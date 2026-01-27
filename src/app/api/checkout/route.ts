import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import type { ReserveInventoryResponse } from "@/types/database";

// ============================================================================
// CONSTANTES DE NEGÓCIO
// ============================================================================
const FREE_SHIPPING_THRESHOLD = 289.9;
const FIXED_SHIPPING_PRICE = 2500; // R$ 25,00 em centavos
const IS_PRESALE = true; // Mudar para false após 16/02
const DEFAULT_ORIGIN_PROD = "https://vioslabs.com.br";
const DEFAULT_ORIGIN_DEV = "http://localhost:3000";

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  // Para kits, armazena os IDs dos produtos que compõem o kit
  kitProducts?: string[];
  isKit?: boolean;
}

interface CheckoutRequestBody {
  items: CartItem[];
  userId?: string;
  customerEmail?: string;
}

// ============================================================================
// CLIENT INITIALIZATION
// ============================================================================

function getStripeClient(): Stripe {
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

  if (!STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable.");
  }

  return new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: "2025-02-24.acacia",
    typescript: true,
    maxNetworkRetries: 2,
    timeout: 30000,
  });
}

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
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Libera todas as reservas feitas durante o checkout em caso de erro
 * Garante que estoque não fique travado por reservas parciais
 */
/**
 * Libera todas as reservas feitas durante o checkout em caso de erro
 * Garante que estoque não fique travado por reservas parciais
 */
async function releaseAllReservations(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  tempSessionId: string | null
) {
  if (!tempSessionId) return;

  try {
    // Tentar liberar usando a função RPC (método preferido)
    const { error } = await supabase.rpc('release_reservation', {
      p_stripe_session_id: tempSessionId,
      p_reason: 'Checkout failed - releasing reservation',
    });

    if (error) {
      console.error('[CHECKOUT ERROR] Erro ao liberar reservas via RPC:', error);
      
      // Fallback: Liberar manualmente se RPC falhar
      const { data: reservations, error: fetchError } = await supabase
        .from('inventory_reservations')
        .select('product_id, quantity, id')
        .eq('stripe_session_id', tempSessionId)
        .eq('status', 'active');

      if (fetchError) {
        console.error('[CHECKOUT ERROR] Erro ao buscar reservas para liberação:', fetchError);
        return;
      }

      if (reservations && reservations.length > 0) {
        // Liberar cada reserva manualmente
        for (const reservation of reservations) {
          try {
            // Buscar quantidade atual
            const { data: currentInventory } = await supabase
              .from('inventory')
              .select('reserved_quantity')
              .eq('product_id', reservation.product_id)
              .single();

            if (currentInventory) {
              const newReserved = Math.max(0, (currentInventory.reserved_quantity || 0) - reservation.quantity);
              
              // Atualizar quantidade reservada
              await supabase
                .from('inventory')
                .update({ reserved_quantity: newReserved })
                .eq('product_id', reservation.product_id);

              // Marcar reserva como cancelled
              await supabase
                .from('inventory_reservations')
                .update({ 
                  status: 'cancelled', 
                  completed_at: new Date().toISOString() 
                })
                .eq('id', reservation.id);
            }
          } catch (fallbackError) {
            console.error('[CHECKOUT ERROR] Erro ao liberar reserva individual:', fallbackError);
            // Continuar tentando outras reservas
          }
        }
      }
    }
  } catch (error) {
    console.error('[CHECKOUT ERROR] Erro geral ao liberar reservas:', error);
    // Não lançar erro - apenas logar (não queremos quebrar o fluxo)
  }
}

function normalizeImageUrl(
  imageUrl: string | undefined,
  origin: string,
): string | undefined {
  if (!imageUrl) return undefined;

  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  return imageUrl.startsWith("/")
    ? `${origin}${imageUrl}`
    : `${origin}/${imageUrl}`;
}

function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((acc, item) => acc + item.price * item.quantity, 0);
}

function qualifiesForFreeShipping(subtotal: number): boolean {
  return subtotal >= FREE_SHIPPING_THRESHOLD;
}

function createShippingOptions(
  isFreeShipping: boolean,
): Stripe.Checkout.SessionCreateParams.ShippingOption[] {
  const displayName = IS_PRESALE
    ? "Reserva Lote 0 (Envio 16/02)"
    : "Entrega Standard (Brasil)";

  const shippingRateData: Stripe.Checkout.SessionCreateParams.ShippingOption["shipping_rate_data"] =
    {
      type: "fixed_amount" as const,
      fixed_amount: {
        amount: isFreeShipping ? 0 : FIXED_SHIPPING_PRICE,
        currency: "brl",
      },
      display_name: displayName,
    };

  // Adicionar delivery_estimate apenas se não for pré-venda
  if (!IS_PRESALE) {
    shippingRateData.delivery_estimate = {
      minimum: { unit: "business_day" as const, value: 3 },
      maximum: { unit: "business_day" as const, value: 14 },
    };
  }

  return [{ shipping_rate_data: shippingRateData }];
}

// ============================================================================
// ROTA PRINCIPAL - POST /api/checkout
// ============================================================================

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

export async function POST(req: Request) {
  try {
    const stripe = getStripeClient();
    const body: CheckoutRequestBody = await req.json();
    const { items, userId, customerEmail } = body;

    if (!items?.length || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "Carrinho vazio ou inválido" },
        { status: 400 },
      );
    }

    const origin = getOrigin(req);

    const subtotal = calculateSubtotal(items);
    const isFreeShipping = qualifiesForFreeShipping(subtotal);

    // ============================================================================
    // CRÍTICO: RESERVAR ESTOQUE ANTES DE CRIAR SESSÃO STRIPE
    // ============================================================================
    // Esta ordem garante que:
    // 1. Estoque está disponível antes de permitir checkout
    // 2. Se reserva falhar, não criamos sessão desnecessária
    // 3. Evita race conditions e overselling
    // ============================================================================

    const supabaseAdmin = getSupabaseAdmin();
    let tempSessionId: string | null = null; // ID temporário base para reservas
    const tempReservationIds: string[] = []; // IDs únicos de cada reserva

    try {
      // Primeiro: Tentar reservar estoque para TODOS os itens
      // Usamos um ID temporário base único para agrupar as reservas
      tempSessionId = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      for (const item of items) {
        // Se for um kit, reservar estoque para cada produto do kit
        if (item.isKit && item.kitProducts && item.kitProducts.length > 0) {
          // Para cada produto do kit, reservar estoque
          for (const productId of item.kitProducts) {
            if (process.env.NODE_ENV === 'development') {
              console.log("[CHECKOUT] Reservando estoque para produto do kit:", {
                kit_name: item.name,
                product_id: productId,
                quantity: item.quantity,
              });
            }

            // Criar um ID único para cada reserva (para evitar constraint UNIQUE)
            const uniqueReservationId = `${tempSessionId}_${productId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
            tempReservationIds.push(uniqueReservationId);

            try {
              const { data, error } = await supabaseAdmin.rpc("reserve_inventory", {
                p_product_id: productId,
                p_quantity: item.quantity, // Quantidade do kit = quantidade de cada produto
                p_stripe_session_id: uniqueReservationId, // ID único para cada reserva
                p_customer_email: customerEmail || null,
                p_user_id: userId || null,
              });

              if (error) {
                console.error("[CHECKOUT ERROR] Erro ao reservar estoque do kit:", {
                  error,
                  product_id: productId,
                  kit_name: item.name,
                  error_message: error.message,
                  error_code: error.code,
                  error_details: error,
                  error_hint: error.hint,
                });
                
                // Verificar se o produto existe no banco
                const { data: productCheck, error: checkError } = await supabaseAdmin
                  .from('inventory')
                  .select('product_id, stock_quantity')
                  .eq('product_id', productId)
                  .maybeSingle();
                
                console.error("[CHECKOUT ERROR] Verificação de produto:", {
                  product_id: productId,
                  exists: !!productCheck,
                  product_data: productCheck,
                  check_error: checkError,
                });
                
                // Liberar todas as reservas já feitas
                for (const reservationId of tempReservationIds) {
                  await releaseAllReservations(supabaseAdmin, reservationId);
                }
                
                // Verificar se a função RPC existe
                if (error.code === '42883' || error.message?.includes('function') || error.message?.includes('does not exist')) {
                  return NextResponse.json(
                    {
                      error: `Função de reserva de estoque não encontrada. Entre em contato com o suporte técnico.`,
                      product: item.name,
                      product_id: productId,
                    },
                    { status: 500 },
                  );
                }
                
                const errorMessage = productCheck 
                  ? `Erro ao reservar estoque para ${item.name}. Tente novamente.`
                  : `Produto ${productId} não encontrado no sistema de estoque. Entre em contato com o suporte.`;
                
                return NextResponse.json(
                  {
                    error: errorMessage,
                    product: item.name,
                    product_id: productId,
                  },
                  { status: 500 },
                );
              }

              // Validar que data existe e tem o formato correto
              if (!data) {
                console.error("[CHECKOUT ERROR] Resposta vazia da função reserve_inventory:", {
                  product_id: productId,
                  kit_name: item.name,
                });
                // Liberar todas as reservas já feitas
                for (const reservationId of tempReservationIds) {
                  await releaseAllReservations(supabaseAdmin, reservationId);
                }
                return NextResponse.json(
                  {
                    error: `Erro ao processar reserva de estoque para ${item.name}. Tente novamente.`,
                    product: item.name,
                    product_id: productId,
                  },
                  { status: 500 },
                );
              }

              const reserveResult = data as ReserveInventoryResponse;

              if (!reserveResult || !reserveResult.success) {
                const errorMsg = reserveResult?.error || 'Erro desconhecido ao reservar estoque';
                
                console.error("[CHECKOUT ERROR] Falha na reserva de estoque do kit:", {
                  product_id: productId,
                  kit_name: item.name,
                  requested: item.quantity,
                  available: reserveResult?.available,
                  error: errorMsg,
                  reserve_result: reserveResult,
                });

                // Liberar todas as reservas já feitas
                for (const reservationId of tempReservationIds) {
                  await releaseAllReservations(supabaseAdmin, reservationId);
                }

                return NextResponse.json(
                  {
                    error: reserveResult?.error === 'Product not found in inventory'
                      ? `Produto do kit não encontrado no sistema de estoque. Entre em contato com o suporte.`
                      : `Estoque insuficiente para ${item.name}. ${errorMsg}`,
                    product: item.name,
                    requested: item.quantity,
                    available: reserveResult?.available || 0,
                  },
                  { status: 409 },
                );
              }

              if (process.env.NODE_ENV === 'development') {
                console.log("[CHECKOUT] Estoque reservado com sucesso para produto do kit:", {
                  product_id: productId,
                  reservation_id: reserveResult.reservation_id,
                });
              }
            } catch (rpcError: any) {
              console.error("[CHECKOUT ERROR] Exceção ao chamar reserve_inventory:", {
                error: rpcError,
                product_id: productId,
                kit_name: item.name,
                error_message: rpcError?.message,
                error_stack: rpcError?.stack,
              });
              
              // Liberar todas as reservas já feitas
              for (const reservationId of tempReservationIds) {
                await releaseAllReservations(supabaseAdmin, reservationId);
              }
              
              return NextResponse.json(
                {
                  error: `Erro ao processar reserva de estoque para ${item.name}. Tente novamente.`,
                  product: item.name,
                  product_id: productId,
                },
                { status: 500 },
              );
            }
          }
        } else {
          // Produto individual - reservar normalmente
          // Criar um ID único para cada reserva de produto individual também
          const uniqueReservationId = `${tempSessionId}_${item.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
          tempReservationIds.push(uniqueReservationId);
          
          const { data, error } = await supabaseAdmin.rpc("reserve_inventory", {
            p_product_id: item.id,
            p_quantity: item.quantity,
            p_stripe_session_id: uniqueReservationId, // ID único para cada reserva
            p_customer_email: customerEmail || null,
            p_user_id: userId || null,
          });

          if (error) {
            console.error("[CHECKOUT ERROR] Erro ao reservar estoque:", error);
            // Liberar todas as reservas já feitas
            for (const reservationId of tempReservationIds) {
              await releaseAllReservations(supabaseAdmin, reservationId);
            }
            return NextResponse.json(
              {
                error: `Erro ao reservar estoque para ${item.name}. Tente novamente.`,
                product: item.name,
              },
              { status: 500 },
            );
          }

          const reserveResult = data as ReserveInventoryResponse;

          if (!reserveResult.success) {
            console.error("[CHECKOUT ERROR] Estoque insuficiente:", {
              product_id: item.id,
              requested: item.quantity,
              available: reserveResult.available,
            });

            // Liberar todas as reservas já feitas
            for (const reservationId of tempReservationIds) {
              await releaseAllReservations(supabaseAdmin, reservationId);
            }

            return NextResponse.json(
              {
                error: `Estoque insuficiente para ${item.name}`,
                product: item.name,
                requested: item.quantity,
                available: reserveResult.available || 0,
              },
              { status: 409 },
            );
          }
        }
      }

      // Se chegou aqui, todas as reservas foram bem-sucedidas
      // Agora podemos criar a sessão Stripe com segurança

      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(
        (item) => {
          const imageUrl = normalizeImageUrl(item.image, origin);

          // Preparar metadata do produto
          const productMetadata: Record<string, string> = {
            product_id: item.id,
          };

          // Se for um kit, adicionar informações dos produtos do kit
          if (item.isKit && item.kitProducts && item.kitProducts.length > 0) {
            productMetadata.is_kit = 'true';
            productMetadata.kit_products = item.kitProducts.join(',');
          }

          return {
            price_data: {
              currency: "brl",
              product_data: {
                name: item.name,
                images: imageUrl ? [imageUrl] : [],
                metadata: productMetadata,
              },
              unit_amount: Math.round(item.price * 100),
            },
            quantity: item.quantity,
          };
        },
      );

      const successUrl = `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${origin}/checkout/canceled`;

      const session = await stripe.checkout.sessions.create({
        line_items: lineItems,
        mode: "payment",
        payment_method_types: ["card", "boleto"],
        allow_promotion_codes: true,
        customer_email: customerEmail || undefined,
        billing_address_collection: "auto",
        shipping_address_collection: { allowed_countries: ["BR"] },
        phone_number_collection: { enabled: true },
        tax_id_collection: { enabled: true },
        payment_method_options: {
          boleto: { expires_after_days: 3 },
        },
        shipping_options: createShippingOptions(isFreeShipping),
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId: userId || "null",
          customerEmail: customerEmail || "null",
          isGuest: (!userId).toString(),
          subtotal: subtotal.toFixed(2),
          freeShipping: isFreeShipping.toString(),
        },
      });

      // Atualizar reservas com o session.id real do Stripe
      // Isso garante que o webhook possa encontrar as reservas corretas
      // NOTA: A constraint UNIQUE em stripe_session_id foi removida para permitir
      // múltiplas reservas para a mesma sessão (kits com múltiplos produtos)
      try {
        // Atualizar todas as reservas usando os IDs temporários únicos
        if (tempReservationIds.length > 0) {
          // Atualizar uma por uma para evitar problemas de constraint (se ainda existir)
          let updateErrors: any[] = [];
          
          for (const reservationId of tempReservationIds) {
            const { error: updateError } = await supabaseAdmin
              .from('inventory_reservations')
              .update({ stripe_session_id: session.id })
              .eq('stripe_session_id', reservationId)
              .eq('status', 'active');

            if (updateError) {
              console.error(`[CHECKOUT ERROR] Erro ao atualizar reserva ${reservationId}:`, updateError);
              updateErrors.push({ reservationId, error: updateError });
            }
          }

          // Se houver erros, mas não for constraint UNIQUE, continuar
          // Se for constraint UNIQUE, significa que a constraint ainda existe no banco
          const hasUniqueConstraintError = updateErrors.some(
            e => e.error?.code === '23505' || e.error?.message?.includes('unique constraint')
          );

          if (hasUniqueConstraintError && updateErrors.length > 0) {
            if (process.env.NODE_ENV === 'development') {
              console.error("[CHECKOUT ERROR] Constraint UNIQUE ainda existe no banco. Execute o script fix_inventory_reservations_constraint.sql");
            }
            // Continuar mesmo assim - as reservas foram criadas com sucesso
            // O webhook pode usar os IDs temporários ou podemos ajustar depois
          } else if (updateErrors.length > 0) {
            // Outros erros - tratar como falha
            throw updateErrors[0].error;
          }
        } else {
          // Fallback: atualizar usando o tempSessionId base (para produtos individuais)
          const { error: updateError } = await supabaseAdmin
            .from('inventory_reservations')
            .update({ stripe_session_id: session.id })
            .eq('stripe_session_id', tempSessionId)
            .eq('status', 'active');

          if (updateError) {
            // Se for erro de constraint UNIQUE, apenas logar (reserva já existe)
            if (updateError.code === '23505' || updateError.message?.includes('unique constraint')) {
              console.warn("[CHECKOUT WARNING] Constraint UNIQUE ainda existe. Reserva pode já estar atualizada.");
            } else {
              throw updateError;
            }
          }
        }
      } catch (updateError) {
        console.error("[CHECKOUT ERROR] Erro ao atualizar session_id nas reservas:", updateError);
        // Se falhar ao atualizar, liberar todas as reservas e expirar sessão
        // Liberar todas as reservas usando os IDs temporários
        for (const reservationId of tempReservationIds) {
          await releaseAllReservations(supabaseAdmin, reservationId);
        }
        if (tempSessionId) {
          await releaseAllReservations(supabaseAdmin, tempSessionId);
        }
        await stripe.checkout.sessions.expire(session.id).catch(() => {});
        return NextResponse.json(
          { error: "Erro ao processar reserva de estoque. Tente novamente." },
          { status: 500 },
        );
      }

      return NextResponse.json({ url: session.url });
    } catch (inventoryError: any) {
      console.error(
        "[CHECKOUT ERROR] Erro no sistema de inventário:",
        inventoryError,
      );
      
      // Em caso de erro inesperado, liberar todas as reservas
      // Liberar todas as reservas usando os IDs temporários
      for (const reservationId of tempReservationIds) {
        await releaseAllReservations(supabaseAdmin, reservationId);
      }
      if (tempSessionId) {
        await releaseAllReservations(supabaseAdmin, tempSessionId);
      }

      return NextResponse.json(
        { error: "Erro ao processar checkout. Tente novamente." },
        { status: 500 },
      );
    }
  } catch (err: any) {
    console.error("[CHECKOUT ERROR] Erro no Checkout:", err);

    let errorMessage = "Erro interno no servidor. Tente novamente.";

    if (
      err.message?.includes("Not a valid URL") ||
      err.message?.includes("Invalid origin")
    ) {
      errorMessage =
        "Erro na configuração de URLs. Verifique as variáveis de ambiente.";
    } else if (err.message?.includes("Invalid")) {
      errorMessage =
        "Dados inválidos fornecidos. Verifique os itens do carrinho.";
    } else if (err.message) {
      errorMessage = err.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
