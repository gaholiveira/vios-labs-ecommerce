import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  getMercadoPagoPreferenceClient,
  isMercadoPagoConfigured,
  validateMercadoPagoConfig,
} from "@/lib/mercadopago";
import type { ReserveInventoryResponse } from "@/types/database";

// ============================================================================
// CONFIGURAÇÃO DE RUNTIME PARA API ROUTE
// ============================================================================
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// ============================================================================
// CONSTANTES DE NEGÓCIO (Reutilizar do checkout principal)
// ============================================================================
const FREE_SHIPPING_THRESHOLD = 289.9;
const FIXED_SHIPPING_PRICE = 2500; // R$ 25,00 em centavos
const PIX_DISCOUNT_PERCENT = 0.05; // 5% de desconto no PIX (sobre o subtotal)
const IS_PRESALE = true; // Mudar para false após 16/02
const DEFAULT_ORIGIN_PROD = "https://vioslabs.com.br";
const DEFAULT_ORIGIN_DEV = "http://localhost:3000";

// ============================================================================
// CONSTANTES DE SEGURANÇA E VALIDAÇÃO (Reutilizar do checkout principal)
// ============================================================================
const MIN_SUBTOTAL = 10.0;
const MAX_SUBTOTAL = 100000.0;
const MIN_QUANTITY = 1;
const MAX_QUANTITY_PER_ITEM = 10;
const MAX_ITEMS_PER_CART = 20;
const MAX_TOTAL_QUANTITY = 50;

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  kitProducts?: string[];
  isKit?: boolean;
}

interface AddressData {
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface CheckoutFormData {
  cpf: string;
  phone: string;
  address: AddressData;
}

interface MercadoPagoCheckoutRequestBody {
  items: CartItem[];
  userId?: string;
  customerEmail?: string;
  paymentMethod: "pix" | "card";
  installmentOption?: "1x" | "2x" | "3x"; // Para futuro uso com cartão parcelado
  checkoutData?: CheckoutFormData; // Dados de checkout coletados antes
}

// ============================================================================
// TIPOS (MERCADO PAGO) - mínimos para evitar `any`
// ============================================================================
type MercadoPagoCurrencyId = "BRL";

interface MercadoPagoPreferenceItem {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  currency_id: MercadoPagoCurrencyId;
  picture_url?: string;
}

interface MercadoPagoPayer {
  email?: string;
  identification?: {
    type: "CPF" | "CNPJ";
    number: string;
  };
  phone?: {
    area_code: string;
    number: string;
  };
  address?: {
    zip_code?: string;
    street_name?: string;
    street_number?: string;
  };
}

interface MercadoPagoPaymentMethods {
  excluded_payment_types?: Array<{ id: string }>;
  excluded_payment_methods?: Array<{ id: string }>;
  installments?: number;
  default_installments?: number;
}

interface MercadoPagoReceiverAddress {
  zip_code?: string;
  street_name?: string;
  street_number?: string;
  city_name?: string;
  state_name?: string;
  country_name?: string;
}

interface MercadoPagoShipments {
  free_shipping: boolean;
  cost?: number;
  receiver_address: MercadoPagoReceiverAddress;
}

interface MercadoPagoPreferenceBody {
  items: MercadoPagoPreferenceItem[];
  payer: MercadoPagoPayer;
  payment_methods: MercadoPagoPaymentMethods;
  shipments: MercadoPagoShipments;
  back_urls: {
    success: string;
    failure: string;
    pending: string;
  };
  notification_url: string;
  external_reference: string;
  metadata: Record<string, string>;
  /** Validade do link de pagamento: evita "link já não está disponível" */
  expires?: boolean;
  expiration_date_from?: string; // ISO 8601
  expiration_date_to?: string; // ISO 8601
}

// ============================================================================
// CLIENT INITIALIZATION
// ============================================================================

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase configuration.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// ============================================================================
// FUNÇÕES AUXILIARES (Reutilizar do checkout principal)
// ============================================================================

function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((acc, item) => acc + item.price * item.quantity, 0);
}

function qualifiesForFreeShipping(subtotal: number): boolean {
  return subtotal >= FREE_SHIPPING_THRESHOLD;
}

function validateCartItems(items: CartItem[]): {
  valid: boolean;
  error?: string;
} {
  if (!Array.isArray(items) || items.length === 0) {
    return { valid: false, error: "Carrinho vazio" };
  }

  if (items.length > MAX_ITEMS_PER_CART) {
    return {
      valid: false,
      error: `Máximo de ${MAX_ITEMS_PER_CART} itens diferentes permitidos`,
    };
  }

  const seenIds = new Set<string>();
  let totalQuantity = 0;

  for (const item of items) {
    // Validar estrutura básica
    if (
      !item.id ||
      !item.name ||
      typeof item.price !== "number" ||
      typeof item.quantity !== "number"
    ) {
      return {
        valid: false,
        error: `Item inválido: ${item.name || "desconhecido"}`,
      };
    }

    // Validar IDs duplicados
    if (seenIds.has(item.id)) {
      return {
        valid: false,
        error: `Item duplicado no carrinho: ${item.name}`,
      };
    }
    seenIds.add(item.id);

    // Validar preço
    if (
      !Number.isFinite(item.price) ||
      item.price <= 0 ||
      item.price > 100000
    ) {
      return { valid: false, error: `Preço inválido para ${item.name}` };
    }

    // Validar quantidade
    if (
      !Number.isInteger(item.quantity) ||
      item.quantity < MIN_QUANTITY ||
      item.quantity > MAX_QUANTITY_PER_ITEM
    ) {
      return {
        valid: false,
        error: `Quantidade inválida para ${item.name}. Mínimo: ${MIN_QUANTITY}, Máximo: ${MAX_QUANTITY_PER_ITEM}`,
      };
    }

    // Validar quantidade total
    totalQuantity += item.quantity;
    if (totalQuantity > MAX_TOTAL_QUANTITY) {
      return {
        valid: false,
        error: `Quantidade total máxima excedida (${MAX_TOTAL_QUANTITY} itens)`,
      };
    }

    // Validar se é kit e tem produtos definidos
    if (
      item.isKit &&
      (!item.kitProducts ||
        !Array.isArray(item.kitProducts) ||
        item.kitProducts.length === 0)
    ) {
      return { valid: false, error: `Kit ${item.name} sem produtos definidos` };
    }
  }

  return { valid: true };
}

function validateSubtotal(subtotal: number): {
  valid: boolean;
  error?: string;
} {
  if (subtotal < MIN_SUBTOTAL) {
    return {
      valid: false,
      error: `Subtotal mínimo de R$ ${MIN_SUBTOTAL.toFixed(2)} não atingido`,
    };
  }

  if (subtotal > MAX_SUBTOTAL) {
    return {
      valid: false,
      error:
        "Subtotal excede o valor máximo permitido. Entre em contato com o suporte.",
    };
  }

  if (!Number.isFinite(subtotal)) {
    return {
      valid: false,
      error: "Erro no cálculo do subtotal. Tente novamente.",
    };
  }

  return { valid: true };
}

function getOrigin(req: Request): string {
  const origin =
    req.headers.get("origin") ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.NODE_ENV === "production"
      ? DEFAULT_ORIGIN_PROD
      : DEFAULT_ORIGIN_DEV);

  if (
    !origin ||
    (!origin.startsWith("http://") && !origin.startsWith("https://"))
  ) {
    throw new Error("Invalid origin URL");
  }

  return origin;
}

/**
 * Libera todas as reservas feitas durante o checkout em caso de erro
 */
async function releaseAllReservations(
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  reservationId: string,
): Promise<void> {
  try {
    // Tentar usar RPC primeiro (mais eficiente)
    const { error: rpcError } = await supabaseAdmin.rpc(
      "release_inventory_reservation",
      {
        p_reservation_id: reservationId,
      },
    );

    if (!rpcError) {
      return;
    }

    // Fallback: Liberar manualmente se RPC falhar
    const { data: reservations, error: fetchError } = await supabaseAdmin
      .from("inventory_reservations")
      .select("product_id, quantity, id")
      .eq("stripe_session_id", reservationId)
      .eq("status", "active");

    if (fetchError) {
      console.error(
        "[MERCADOPAGO CHECKOUT ERROR] Erro ao buscar reservas para liberação:",
        fetchError,
      );
      return;
    }

    if (reservations && reservations.length > 0) {
      // Liberar cada reserva manualmente
      for (const reservation of reservations) {
        try {
          const { data: currentInventory } = await supabaseAdmin
            .from("inventory")
            .select("reserved_quantity")
            .eq("product_id", reservation.product_id)
            .single();

          if (currentInventory) {
            const newReserved = Math.max(
              0,
              (currentInventory.reserved_quantity || 0) - reservation.quantity,
            );

            await supabaseAdmin
              .from("inventory")
              .update({ reserved_quantity: newReserved })
              .eq("product_id", reservation.product_id);

            // Marcar reserva como liberada
            await supabaseAdmin
              .from("inventory_reservations")
              .update({ status: "released" })
              .eq("id", reservation.id);
          }
        } catch (error) {
          console.error(
            `[MERCADOPAGO CHECKOUT ERROR] Erro ao liberar reserva ${reservation.id}:`,
            error,
          );
        }
      }
    }
  } catch (error) {
    console.error(
      "[MERCADOPAGO CHECKOUT ERROR] Erro ao liberar reservas:",
      error,
    );
  }
}

// ============================================================================
// ROTA PRINCIPAL - POST /api/checkout/mercadopago
// ============================================================================

export async function POST(req: Request) {
  try {
    // ============================================================================
    // VALIDAÇÃO DE CONFIGURAÇÃO DO MERCADO PAGO
    // ============================================================================
    const configValidation = validateMercadoPagoConfig();

    if (!configValidation.isValid) {
      // Em produção, retornar erro claro mas não expor detalhes
      if (process.env.NODE_ENV === "development") {
        console.error(
          "[MERCADOPAGO CHECKOUT] Configuração inválida:",
          configValidation.errors,
        );
      }

      return NextResponse.json(
        {
          error:
            "Mercado Pago não está configurado. Entre em contato com o suporte.",
          details:
            process.env.NODE_ENV === "development"
              ? configValidation.errors
              : undefined,
        },
        { status: 503 }, // Service Unavailable
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const body: MercadoPagoCheckoutRequestBody = await req.json();
    const { items, userId, customerEmail, paymentMethod } = body;

    // ============================================================================
    // VALIDAÇÕES DE SEGURANÇA E INTEGRIDADE
    // ============================================================================

    // Validar estrutura básica do carrinho
    const cartValidation = validateCartItems(items);
    if (!cartValidation.valid) {
      return NextResponse.json(
        { error: cartValidation.error || "Carrinho inválido" },
        { status: 400 },
      );
    }

    const origin = getOrigin(req);

    // Calcular subtotal
    const subtotal = calculateSubtotal(items);

    // Validar subtotal calculado
    const subtotalValidation = validateSubtotal(subtotal);
    if (!subtotalValidation.valid) {
      return NextResponse.json(
        { error: subtotalValidation.error },
        { status: 400 },
      );
    }

    // Validar email (se fornecido)
    if (customerEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const sanitizedEmail = customerEmail.trim().toLowerCase();

      if (!emailRegex.test(sanitizedEmail)) {
        return NextResponse.json({ error: "Email inválido" }, { status: 400 });
      }
    }

    // Validar método de pagamento
    if (paymentMethod !== "pix" && paymentMethod !== "card") {
      return NextResponse.json(
        { error: "Método de pagamento inválido. Use 'pix' ou 'card'." },
        { status: 400 },
      );
    }

    // Este endpoint é dedicado a PIX e CARTÃO PARCELADO (2x/3x)
    if (paymentMethod === "card") {
      if (!body.installmentOption || body.installmentOption === "1x") {
        return NextResponse.json(
          {
            error:
              "Para cartão 1x use o checkout padrão (Stripe). Para parcelamento, selecione 2x ou 3x.",
          },
          { status: 400 },
        );
      }

      if (body.installmentOption !== "2x" && body.installmentOption !== "3x") {
        return NextResponse.json(
          { error: "Parcelamento inválido. Use '2x' ou '3x'." },
          { status: 400 },
        );
      }
    }

    // Para PIX, não permitir parcelamento
    if (
      paymentMethod === "pix" &&
      body.installmentOption &&
      body.installmentOption !== "1x"
    ) {
      return NextResponse.json(
        { error: "PIX não suporta parcelamento." },
        { status: 400 },
      );
    }

    // Dados de entrega/nota fiscal são obrigatórios antes do checkout Mercado Pago
    if (!body.checkoutData) {
      return NextResponse.json(
        {
          error:
            "Dados de entrega são obrigatórios para pagamentos via Mercado Pago. Preencha CPF, telefone e endereço.",
        },
        { status: 400 },
      );
    }

    // Validação mínima (server-side) para robustez
    const cpfDigits = body.checkoutData.cpf.replace(/\D/g, "");
    if (cpfDigits.length !== 11 && cpfDigits.length !== 14) {
      return NextResponse.json(
        {
          error: "CPF/CNPJ inválido. Envie apenas números (11 ou 14 dígitos).",
        },
        { status: 400 },
      );
    }

    const phoneDigits = body.checkoutData.phone.replace(/\D/g, "");
    if (phoneDigits.length !== 10 && phoneDigits.length !== 11) {
      return NextResponse.json(
        { error: "Telefone inválido. Use DDD + número (10 ou 11 dígitos)." },
        { status: 400 },
      );
    }

    const cepDigits = body.checkoutData.address.cep.replace(/\D/g, "");
    if (cepDigits.length !== 8) {
      return NextResponse.json(
        { error: "CEP inválido. Envie apenas números (8 dígitos)." },
        { status: 400 },
      );
    }

    if (
      !body.checkoutData.address.street ||
      !body.checkoutData.address.neighborhood ||
      !body.checkoutData.address.city ||
      !body.checkoutData.address.state ||
      body.checkoutData.address.state.trim().length !== 2 ||
      !body.checkoutData.address.number
    ) {
      return NextResponse.json(
        { error: "Endereço incompleto. Verifique os campos obrigatórios." },
        { status: 400 },
      );
    }

    const isFreeShipping = qualifiesForFreeShipping(subtotal);
    const shippingAmount = isFreeShipping ? 0 : FIXED_SHIPPING_PRICE;
    const pixDiscountAmount =
      paymentMethod === "pix" ? subtotal * PIX_DISCOUNT_PERCENT : 0;
    const totalAmount = subtotal + shippingAmount / 100 - pixDiscountAmount; // shippingAmount em centavos

    // Log estruturado para auditoria (apenas em desenvolvimento)
    if (process.env.NODE_ENV === "development") {
      console.log("[MERCADOPAGO CHECKOUT] Validações passadas:", {
        items_count: items.length,
        subtotal: subtotal.toFixed(2),
        shipping: (shippingAmount / 100).toFixed(2),
        total: totalAmount.toFixed(2),
        freeShipping: isFreeShipping,
        paymentMethod,
        userId: userId || "guest",
      });
    }

    // ============================================================================
    // RESERVA DE ESTOQUE (ANTES de criar preferência)
    // ============================================================================
    const tempPreferenceId = `temp_mp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const tempReservationIds: string[] = [];

    try {
      // Reservar estoque para cada item
      for (const item of items) {
        // Se for um kit, reservar estoque para cada produto do kit
        if (item.isKit && item.kitProducts && item.kitProducts.length > 0) {
          for (const productId of item.kitProducts) {
            if (process.env.NODE_ENV === "development") {
              console.log(
                "[MERCADOPAGO CHECKOUT] Reservando estoque para produto do kit:",
                {
                  kit_name: item.name,
                  product_id: productId,
                  quantity: item.quantity,
                },
              );
            }

            const uniqueReservationId = `${tempPreferenceId}_${productId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
            tempReservationIds.push(uniqueReservationId);

            try {
              const { data, error } = await supabaseAdmin.rpc(
                "reserve_inventory",
                {
                  p_product_id: productId,
                  p_quantity: item.quantity,
                  p_stripe_session_id: uniqueReservationId, // Usar mesmo campo (será atualizado depois)
                  p_customer_email: customerEmail || null,
                  p_user_id: userId || null,
                },
              );

              if (error) {
                throw error;
              }

              const response = data as ReserveInventoryResponse;
              if (!response.success) {
                throw new Error(response.error || "Erro ao reservar estoque");
              }
            } catch (error: unknown) {
              console.error(
                "[MERCADOPAGO CHECKOUT ERROR] Erro ao reservar estoque para produto do kit:",
                error,
              );

              // Liberar todas as reservas já feitas
              for (const reservationId of tempReservationIds) {
                await releaseAllReservations(supabaseAdmin, reservationId);
              }

              const errorMessage =
                error instanceof Error
                  ? error.message
                  : "Erro ao reservar estoque. Tente novamente.";

              return NextResponse.json(
                { error: errorMessage },
                { status: 409 }, // Conflict
              );
            }
          }
        } else {
          // Produto individual
          if (process.env.NODE_ENV === "development") {
            console.log(
              "[MERCADOPAGO CHECKOUT] Reservando estoque para produto:",
              {
                product_id: item.id,
                quantity: item.quantity,
              },
            );
          }

          const uniqueReservationId = `${tempPreferenceId}_${item.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
          tempReservationIds.push(uniqueReservationId);

          try {
            const { data, error } = await supabaseAdmin.rpc(
              "reserve_inventory",
              {
                p_product_id: item.id,
                p_quantity: item.quantity,
                p_stripe_session_id: uniqueReservationId,
                p_customer_email: customerEmail || null,
                p_user_id: userId || null,
              },
            );

            if (error) {
              throw error;
            }

            const response = data as ReserveInventoryResponse;
            if (!response.success) {
              throw new Error(response.error || "Erro ao reservar estoque");
            }
          } catch (error: unknown) {
            console.error(
              "[MERCADOPAGO CHECKOUT ERROR] Erro ao reservar estoque:",
              error,
            );

            // Liberar todas as reservas já feitas
            for (const reservationId of tempReservationIds) {
              await releaseAllReservations(supabaseAdmin, reservationId);
            }

            const errorMessage =
              error instanceof Error
                ? error.message
                : "Erro ao reservar estoque. Tente novamente.";
            return NextResponse.json({ error: errorMessage }, { status: 409 });
          }
        }
      }

      // ============================================================================
      // CRIAR PREFERÊNCIA NO MERCADO PAGO
      // ============================================================================
      const preferenceClient = getMercadoPagoPreferenceClient();

      // Preparar itens para a preferência
      const preferenceItems: MercadoPagoPreferenceItem[] = items.map(
        (item) => ({
          id: item.id,
          title: item.name,
          quantity: item.quantity,
          unit_price: item.price, // Mercado Pago aceita em reais (não centavos)
          currency_id: "BRL",
          ...(item.image && {
            picture_url: item.image.startsWith("http")
              ? item.image
              : `${origin}${item.image}`,
          }),
        }),
      );

      // Desconto 5% PIX: item com preço negativo (sobre o subtotal)
      if (pixDiscountAmount > 0) {
        preferenceItems.push({
          id: "pix-discount",
          title: "Desconto 5% (PIX)",
          quantity: 1,
          unit_price: -pixDiscountAmount,
          currency_id: "BRL",
        });
      }

      // Frete NÃO vai como item na lista — usamos shipments.cost para o Checkout Pro
      // exibir "Envio" / "Frete" como linha separada (igual ao Stripe). Se mandar como
      // item, o MP às vezes mostra só o total sem detalhar frete.

      // URLs de retorno
      // IMPORTANTE: Mercado Pago usa {preference_id} como placeholder, não {CHECKOUT_SESSION_ID}
      const successUrl = `${origin}/checkout/success?session_id={preference_id}`;
      const failureUrl = `${origin}/checkout/canceled`;
      const pendingUrl = `${origin}/checkout/pending`;

      // Validar que successUrl está definido antes de usar auto_return
      if (!successUrl || !successUrl.includes("http")) {
        throw new Error("URL de sucesso inválida");
      }

      if (process.env.NODE_ENV === "development") {
        console.log("[MERCADOPAGO CHECKOUT] URLs configuradas:", {
          success: successUrl,
          failure: failureUrl,
          pending: pendingUrl,
        });
      }

      // Webhook URL (será configurado no dashboard do MP)
      const webhookUrl = `${origin}/api/webhooks/mercadopago`;

      // Construir objeto de preferência de forma mais explícita
      // Construir objeto de preferência de forma explícita
      // IMPORTANTE: back_urls.success deve estar definido quando auto_return é usado
      // Preparar dados do pagador com informações coletadas do formulário
      const { cpf, phone, address } = body.checkoutData;
      const cpfDigits2 = cpf.replace(/\D/g, "");
      const phoneDigits2 = phone.replace(/\D/g, "");
      const cepDigits2 = address.cep.replace(/\D/g, "");

      const streetNumberRaw = Number.parseInt(address.number, 10);
      const streetNumber = Number.isFinite(streetNumberRaw)
        ? streetNumberRaw
        : undefined;

      const payerData: MercadoPagoPayer = {
        ...(customerEmail && { email: customerEmail }),
        identification: {
          type: cpfDigits2.length === 11 ? "CPF" : "CNPJ",
          number: cpfDigits2,
        },
        phone: {
          area_code: phoneDigits2.substring(0, 2),
          number: phoneDigits2.substring(2),
        },
        address: {
          zip_code: cepDigits2,
          street_name: address.street,
          ...(streetNumber !== undefined && {
            street_number: String(streetNumber),
          }),
        },
      };

      const installmentCount =
        paymentMethod === "card"
          ? body.installmentOption === "2x"
            ? 2
            : 3
          : undefined;

      // Link de pagamento válido por 24h — evita erro "O link de pagamento já não está disponível"
      const now = new Date();
      const validUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const expirationDateFrom = now.toISOString();
      const expirationDateTo = validUntil.toISOString();

      const preferenceData: MercadoPagoPreferenceBody = {
        items: preferenceItems,
        payer: payerData,
        payment_methods: {
          // Para PIX: excluir todos exceto PIX
          ...(paymentMethod === "pix" && {
            excluded_payment_types: [
              { id: "credit_card" },
              { id: "debit_card" },
              { id: "ticket" }, // Boleto
            ],
            excluded_payment_methods: [],
          }),
          // Para cartão parcelado: limitar ao número escolhido (2x/3x)
          ...(paymentMethod === "card" && {
            installments: installmentCount,
            default_installments: installmentCount,
            excluded_payment_types: [
              { id: "ticket" }, // Excluir boleto
            ],
          }),
        },
        // Configurar envio: cost faz o Checkout Pro mostrar "Envio" / "Frete" em linha separada
        shipments: {
          free_shipping: isFreeShipping,
          ...(shippingAmount > 0 &&
            !isFreeShipping && {
              cost: shippingAmount / 100,
            }),
          receiver_address: {
            zip_code: cepDigits2,
            street_name: address.street,
            ...(streetNumber !== undefined && {
              street_number: String(streetNumber),
            }),
            city_name: address.city,
            state_name: address.state,
            country_name: "Brazil",
          },
        },
        // back_urls DEVE estar definido antes de auto_return
        back_urls: {
          success: successUrl,
          failure: failureUrl,
          pending: pendingUrl,
        },
        notification_url: webhookUrl,
        external_reference: tempPreferenceId,
        metadata: {
          order_id: tempPreferenceId,
          user_id: userId || "null",
          customer_email: customerEmail || "null",
          is_guest: (!userId).toString(),
          subtotal: subtotal.toFixed(2),
          shipping: (shippingAmount / 100).toFixed(2),
          total: totalAmount.toFixed(2),
          free_shipping: isFreeShipping.toString(),
          items_count: items.length.toString(),
          total_quantity: items
            .reduce((acc, item) => acc + item.quantity, 0)
            .toString(),
          payment_method: paymentMethod,
          installment_option: body.installmentOption || "1x",
          shipping_cep: cepDigits2,
          shipping_city: address.city,
          shipping_state: address.state,
          ...(address.complement
            ? { shipping_complement: address.complement }
            : {}),
        },
        expires: true,
        expiration_date_from: expirationDateFrom,
        expiration_date_to: expirationDateTo,
      };

      // Adicionar auto_return apenas para PIX
      // NOTA: Temporariamente removido devido a erro persistente do SDK
      // O erro "auto_return invalid. back_url.success must be defined" persiste mesmo com back_urls.success definido
      // Isso pode ser um bug do SDK ou uma validação específica do Mercado Pago
      // Por enquanto, removemos auto_return - o usuário será redirecionado manualmente após pagamento via back_urls
      // TODO: Investigar e corrigir quando SDK for atualizado ou documentação for esclarecida
      // if (paymentMethod === "pix") {
      //   // Garantir que back_urls.success está definido
      //   if (!preferenceData.back_urls?.success) {
      //     throw new Error(
      //       "back_urls.success deve estar definido para usar auto_return",
      //     );
      //   }
      //   // Adicionar auto_return apenas se successUrl estiver válido
      //   if (successUrl && successUrl.includes("http")) {
      //     preferenceData.auto_return = "approved";
      //   }
      // }

      // Log do objeto antes de enviar (apenas em desenvolvimento)
      if (process.env.NODE_ENV === "development") {
        console.log(
          "[MERCADOPAGO CHECKOUT] Objeto de preferência:",
          JSON.stringify(
            {
              ...preferenceData,
              // Não logar notification_url completo por segurança
              notification_url: webhookUrl
                ? `${webhookUrl.substring(0, 30)}...`
                : "undefined",
            },
            null,
            2,
          ),
        );
      }

      // Criar preferência no Mercado Pago
      // Nota: O SDK do Mercado Pago espera o body dentro de um objeto
      const preference = await preferenceClient.create({
        body: preferenceData,
      });

      if (!preference || !preference.init_point) {
        throw new Error("Erro ao criar preferência no Mercado Pago");
      }

      // ============================================================================
      // ATUALIZAR RESERVAS COM O PREFERENCE_ID REAL
      // ============================================================================
      try {
        if (tempReservationIds.length > 0) {
          for (const reservationId of tempReservationIds) {
            const { error: updateError } = await supabaseAdmin
              .from("inventory_reservations")
              .update({ stripe_session_id: preference.id }) // Usar mesmo campo (será atualizado depois se necessário)
              .eq("stripe_session_id", reservationId)
              .eq("status", "active");

            if (updateError) {
              console.error(
                `[MERCADOPAGO CHECKOUT ERROR] Erro ao atualizar reserva ${reservationId}:`,
                updateError,
              );
              // Continuar mesmo com erro - reservas foram criadas
            }
          }
        }
      } catch (updateError) {
        console.error(
          "[MERCADOPAGO CHECKOUT ERROR] Erro ao atualizar reservas:",
          updateError,
        );
        // Não falhar aqui - preferência já foi criada
      }

      return NextResponse.json({
        url: preference.init_point,
        preference_id: preference.id,
      });
    } catch (inventoryError: unknown) {
      console.error(
        "[MERCADOPAGO CHECKOUT ERROR] Erro no sistema de inventário:",
        inventoryError instanceof Error
          ? { message: inventoryError.message, stack: inventoryError.stack }
          : inventoryError,
      );

      // Em caso de erro inesperado, liberar todas as reservas
      try {
        for (const reservationId of tempReservationIds) {
          await releaseAllReservations(supabaseAdmin, reservationId);
        }
      } catch (cleanupError) {
        console.error(
          "[MERCADOPAGO CHECKOUT ERROR] Erro ao limpar reservas:",
          cleanupError,
        );
      }

      const errorMessage =
        inventoryError instanceof Error
          ? inventoryError.message
          : "Erro ao processar checkout. Tente novamente.";

      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  } catch (error: unknown) {
    // Log estruturado do erro geral
    console.error(
      "[MERCADOPAGO CHECKOUT ERROR] Erro geral:",
      error instanceof Error
        ? { message: error.message, stack: error.stack }
        : error,
    );

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Erro inesperado ao processar checkout. Tente novamente.";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
