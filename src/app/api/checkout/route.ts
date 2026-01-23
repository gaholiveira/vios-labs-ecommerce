import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from '@supabase/supabase-js';
import type { ReserveInventoryResponse } from '@/types/database';

// ============================================================================
// CONSTANTES DE NEGÓCIO - VIOS LABS
// ============================================================================
const FREE_SHIPPING_THRESHOLD = 289.90; // R$ 289,90 - Valor mínimo para frete grátis
const FIXED_SHIPPING_PRICE = 2500;      // R$ 25,00 em centavos

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
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
    throw new Error(
      'Missing STRIPE_SECRET_KEY environment variable. Please add it to your .env.local file.'
    );
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
    throw new Error(
      'Missing Supabase configuration. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    );
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
 * Normaliza URLs de imagens, convertendo caminhos relativos em URLs absolutas
 */
function normalizeImageUrl(imageUrl: string | undefined, origin: string): string | undefined {
  if (!imageUrl) return undefined;
  
  // Se já é uma URL absoluta, retornar diretamente
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // Se é uma URL relativa começando com /
  if (imageUrl.startsWith('/')) {
    return `${origin}${imageUrl}`;
  }
  
  // Caso contrário, assumir que precisa de /
  return `${origin}/${imageUrl}`;
}

/**
 * Calcula o subtotal do carrinho em reais (não em centavos)
 */
function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((acc, item) => {
    return acc + (item.price * item.quantity);
  }, 0);
}

/**
 * Determina se o pedido se qualifica para frete grátis
 */
function qualifiesForFreeShipping(subtotal: number): boolean {
  return subtotal >= FREE_SHIPPING_THRESHOLD;
}

/**
 * Cria as opções de frete baseado no subtotal do pedido
 * 
 * Display: "Entrega Standard (Brasil)" - Reforça cobertura nacional uniforme
 * Prazo: 3-14 dias úteis - Honesto e cobre todo território brasileiro
 *        • 3 dias: Surpreende positivamente o Sudeste/Sul
 *        • 14 dias: Cobre com segurança Norte/Nordeste/Centro-Oeste
 */
function createShippingOptions(isFreeShipping: boolean): Stripe.Checkout.SessionCreateParams.ShippingOption[] {
  if (isFreeShipping) {
    return [
      {
        shipping_rate_data: {
          type: "fixed_amount" as const,
          fixed_amount: { 
            amount: 0, 
            currency: "brl" 
          },
          display_name: "Entrega Standard (Brasil)",
          delivery_estimate: {
            minimum: { unit: "business_day" as const, value: 3 },
            maximum: { unit: "business_day" as const, value: 14 },
          },
        },
      },
    ];
  }
  
  return [
    {
      shipping_rate_data: {
        type: "fixed_amount" as const,
        fixed_amount: { 
          amount: FIXED_SHIPPING_PRICE, 
          currency: "brl" 
        },
        display_name: "Entrega Standard (Brasil)",
        delivery_estimate: {
          minimum: { unit: "business_day" as const, value: 3 },
          maximum: { unit: "business_day" as const, value: 14 },
        },
      },
    },
  ];
}

// ============================================================================
// ROTA PRINCIPAL - POST /api/checkout
// ============================================================================

export async function POST(req: Request) {
  try {
    // Inicializar Stripe (lazy initialization)
    const stripe = getStripeClient();
    
    // Parse e validação do body
    const body: CheckoutRequestBody = await req.json();
    const { items, userId, customerEmail } = body;

    // ========================================================================
    // STEP 1: VALIDAÇÕES INICIAIS
    // ========================================================================
    
    // Validar se há itens no carrinho
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Carrinho vazio ou inválido" }, 
        { status: 400 }
      );
    }

    // Obter a URL base (origin)
    const origin = req.headers.get('origin') || 
                   process.env.NEXT_PUBLIC_BASE_URL || 
                   (process.env.NODE_ENV === 'production' 
                     ? 'https://vioslabs.com.br' 
                     : 'http://localhost:3000');

    // Validar se a URL base é válida
    if (!origin || (!origin.startsWith('http://') && !origin.startsWith('https://'))) {
      console.error('[CHECKOUT ERROR] URL base inválida:', origin);
      return NextResponse.json(
        { error: "Configuração de URL inválida. Verifique NEXT_PUBLIC_BASE_URL." },
        { status: 500 }
      );
    }

    // ========================================================================
    // STEP 2: CÁLCULO DO SUBTOTAL E LÓGICA DE FRETE
    // ========================================================================
    
    // Calcular subtotal do pedido (em reais, não centavos)
    const subtotal = calculateSubtotal(items);
    
    // Verificar se qualifica para frete grátis
    const isFreeShipping = qualifiesForFreeShipping(subtotal);
    
    // Log para debug (produção pode ser removido ou enviado para monitoring)
    console.log('[CHECKOUT] Cálculo de Frete:', {
      subtotal: subtotal.toFixed(2),
      threshold: FREE_SHIPPING_THRESHOLD.toFixed(2),
      isFreeShipping,
      shippingCost: isFreeShipping ? 0 : FIXED_SHIPPING_PRICE / 100,
    });

    // ========================================================================
    // STEP 2.5: VALIDAR E RESERVAR ESTOQUE (Sistema de Inventory)
    // ========================================================================
    // IMPORTANTE: Criar sessão temporária do Stripe primeiro para obter o session_id
    // Depois reservar o estoque com esse ID
    
    // Primeiro, vamos criar uma "pré-sessão" temporária do Stripe
    // Na verdade, vamos gerar um ID temporário e depois criar a sessão real
    // Se a reserva falhar, não criamos a sessão
    
    // Nota: Reserva será feita após criar a sessão do Stripe (movido para depois)
    // Isso porque precisamos do stripe_session_id para a reserva

    // ========================================================================
    // STEP 3: CONSTRUIR LINE ITEMS PARA O STRIPE
    // ========================================================================
    
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item) => {
      const imageUrl = normalizeImageUrl(item.image, origin);
      
      return {
        price_data: {
          currency: "brl",
          product_data: {
            name: item.name,
            images: imageUrl ? [imageUrl] : [],
            metadata: {
              product_id: item.id,
            },
          },
          unit_amount: Math.round(item.price * 100), // Converter para centavos
        },
        quantity: item.quantity,
      };
    });

    // ========================================================================
    // STEP 4: CONFIGURAR OPÇÕES DE FRETE
    // ========================================================================
    
    const shippingOptions = createShippingOptions(isFreeShipping);

    // ========================================================================
    // STEP 5: VALIDAR URLs DE RETORNO
    // ========================================================================
    
    const successUrl = `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/?canceled=true`;
    
    try {
      new URL(successUrl);
      new URL(cancelUrl);
    } catch (urlError) {
      console.error('[CHECKOUT ERROR] URLs inválidas:', { 
        successUrl, 
        cancelUrl, 
        origin 
      });
      return NextResponse.json(
        { error: "Erro ao configurar URLs de retorno. Verifique NEXT_PUBLIC_BASE_URL." },
        { status: 500 }
      );
    }

    // ========================================================================
    // STEP 6: CRIAR SESSÃO DO STRIPE CHECKOUT (Configuração Brasil Premium)
    // ========================================================================
    
    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: "payment",
      
      // Payment Methods: Habilitar Card e Boleto
      // PIX será adicionado quando habilitado no dashboard do Stripe
      payment_method_types: ['card', 'boleto'],
      
      // Habilitar cupons de desconto
      allow_promotion_codes: true,
      
      // Customer Information
      customer_email: customerEmail || undefined,
      
      // Address Collection
      billing_address_collection: 'auto',
      shipping_address_collection: {
        allowed_countries: ["BR"],
      },
      
      // ========================================================================
      // CONFIGURAÇÕES PARA O MERCADO BRASILEIRO
      // ========================================================================
      
      // Coleta de Telefone (Obrigatório para avisos de entrega)
      phone_number_collection: {
        enabled: true,
      },
      
      // Coleta de CPF (Obrigatório para Nota Fiscal)
      tax_id_collection: {
        enabled: true,
      },
      
      // Configurações de Métodos de Pagamento
      payment_method_options: {
        // Boleto: Expiração de 3 dias
        boleto: {
          expires_after_days: 3,
        },
        // Pix: Expira automaticamente em 1 hora (padrão do Stripe Brasil)
        // Evita pagamentos tardios que perderam estoque
      },
      
      // Shipping Options (dinâmico baseado no subtotal)
      shipping_options: shippingOptions,
      
      // URLs de Retorno
      success_url: successUrl,
      cancel_url: cancelUrl,
      
      // Metadata para Webhook Processing
      metadata: {
        userId: userId || 'null',
        customerEmail: customerEmail || 'null',
        isGuest: (!userId).toString(),
        subtotal: subtotal.toFixed(2),
        freeShipping: isFreeShipping.toString(),
      },
    });

    // ========================================================================
    // STEP 7: RESERVAR ESTOQUE (após criar sessão do Stripe)
    // ========================================================================
    // Reserva o estoque com o session.id do Stripe
    // Se falhar, a reserva será liberada automaticamente em 1 hora
    
    const supabaseAdmin = getSupabaseAdmin();
    
    try {
      // Reservar estoque para cada produto do carrinho
      for (const item of items) {
        const { data, error } = await supabaseAdmin.rpc('reserve_inventory', {
          p_product_id: item.id,
          p_quantity: item.quantity,
          p_stripe_session_id: session.id,
          p_customer_email: customerEmail || null,
          p_user_id: userId || null,
        });

        if (error) {
          console.error('[CHECKOUT ERROR] Erro ao reservar estoque:', error);
          // Se falhar, registrar mas não bloquear (fallback)
          // O webhook vai tentar processar sem reserva prévia
          continue;
        }

        const reserveResult = data as ReserveInventoryResponse;
        
        if (!reserveResult.success) {
          // Estoque insuficiente
          console.error('[CHECKOUT ERROR] Estoque insuficiente:', {
            product_id: item.id,
            requested: item.quantity,
            available: reserveResult.available,
          });
          
          // Aqui você pode optar por:
          // 1. Cancelar toda a sessão e retornar erro (mais seguro)
          // 2. Continuar e deixar o webhook lidar (mais flexível)
          
          // Opção 1 (recomendado para produção):
          try {
            await stripe.checkout.sessions.expire(session.id);
          } catch (expireError) {
            console.error('[CHECKOUT ERROR] Erro ao expirar sessão:', expireError);
          }
          
          return NextResponse.json(
            {
              error: `Estoque insuficiente para ${item.name}`,
              product: item.name,
              requested: item.quantity,
              available: reserveResult.available || 0,
            },
            { status: 409 } // 409 Conflict
          );
        }

        console.log('[CHECKOUT] Estoque reservado:', {
          product_id: item.id,
          quantity: item.quantity,
          reservation_id: reserveResult.reservation_id,
          expires_at: reserveResult.expires_at,
        });
      }
    } catch (inventoryError: any) {
      console.error('[CHECKOUT ERROR] Erro no sistema de inventário:', inventoryError);
      // Não bloquear o checkout se o sistema de inventário falhar
      // Prosseguir normalmente (fallback para comportamento antigo)
    }

    // ========================================================================
    // STEP 8: RETORNAR URL DA SESSÃO
    // ========================================================================
    
    return NextResponse.json({ url: session.url });

  } catch (err: any) {
    // ========================================================================
    // ERROR HANDLING
    // ========================================================================
    
    console.error("[CHECKOUT ERROR] Erro no Checkout:", err);
    console.error("[CHECKOUT ERROR] Detalhes:", {
      message: err.message,
      type: err.type,
      code: err.code,
      raw: err.raw,
    });
    
    // Mensagem de erro amigável para o cliente
    let errorMessage = "Erro interno no servidor. Tente novamente.";
    
    if (err.message?.includes("Not a valid URL")) {
      errorMessage = "Erro na configuração de URLs. Verifique as variáveis de ambiente.";
    } else if (err.message?.includes("Invalid")) {
      errorMessage = "Dados inválidos fornecidos. Verifique os itens do carrinho.";
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
