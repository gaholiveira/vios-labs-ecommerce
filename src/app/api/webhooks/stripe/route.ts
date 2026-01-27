import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Função helper para obter o cliente Supabase Admin (lazy initialization)
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase configuration. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Função helper para obter o cliente Stripe (lazy initialization)
function getStripeClient(): Stripe {
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

  if (!STRIPE_SECRET_KEY) {
    throw new Error('Missing STRIPE_SECRET_KEY environment variable.');
  }

  return new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2025-02-24.acacia',
    typescript: true,
  });
}

// Configuração para webhook do Stripe
// Usamos Node.js runtime para garantir compatibilidade com o Stripe webhook
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// IMPORTANTE: Prevenir redirects que causam erro 307
// Garantir que a rota aceita apenas POST
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Webhooks only accept POST requests.' },
    { status: 405 }
  );
}

/**
 * Webhook do Stripe para processar eventos de pagamento
 * 
 * Eventos processados:
 * - checkout.session.completed: Quando o checkout é concluído com sucesso
 * - payment_intent.succeeded: Quando o pagamento é confirmado
 */
export async function POST(req: NextRequest) {
  try {
    const stripe = getStripeClient();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('Missing STRIPE_WEBHOOK_SECRET environment variable.');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Obter o corpo da requisição como texto (raw body)
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing stripe-signature header.');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verificar a assinatura do webhook
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    // Processar o evento baseado no tipo
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, stripe);
        break;

      case 'payment_intent.succeeded':
        // Opcional: também processar payment_intent.succeeded como fallback
        // Mas checkout.session.completed já deve ser suficiente
        // Não processar aqui, esperar checkout.session.completed
        break;

      default:
        // Evento não tratado - silenciosamente ignorar
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('❌ Error processing webhook:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      cause: error.cause,
    });
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Processa o evento checkout.session.completed
 * Cria o pedido e os itens do pedido no Supabase
 */
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  stripe: Stripe
) {
  const supabaseAdmin = getSupabaseAdmin();
  
  try {
    // Verificar se já processamos este pedido (evitar duplicatas)
    const { data: existingOrder, error: checkError } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('stripe_session_id', session.id)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 é "not found", que é esperado. Outros erros são problemas reais.
      console.error('Error checking existing order:', checkError);
      throw new Error(`Failed to check existing order: ${checkError.message}`);
    }

    if (existingOrder) {
      // Pedido já existe - evitar duplicatas
      return;
    }

    // Obter dados do metadata da sessão
    const metadata = session.metadata || {};
    const userId = metadata.userId === 'null' || metadata.userId === null || metadata.userId === undefined ? null : metadata.userId;
    
    // Prioridade para obter email:
    // 1. session.customer_email (sempre preenchido se coletado no checkout)
    // 2. session.customer_details?.email (fallback)
    // 3. metadata.customerEmail (fallback, pode ser 'null' string)
    let customerEmail = session.customer_email || 
                       session.customer_details?.email || 
                       (metadata.customerEmail && metadata.customerEmail !== 'null' ? metadata.customerEmail : null);
    
    // Validar que temos um email do cliente (OBRIGATÓRIO)
    if (!customerEmail || customerEmail === 'null') {
      console.error('❌ Missing customer email in session:', {
        session_id: session.id,
        customer_email: session.customer_email,
        metadata_customerEmail: metadata.customerEmail,
        customer_details_email: session.customer_details?.email,
        customer_details: session.customer_details,
        payment_intent: session.payment_intent,
      });
      
      // Tentar recuperar do PaymentIntent como último recurso
      if (session.payment_intent && typeof session.payment_intent === 'string') {
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
          customerEmail = paymentIntent.receipt_email || customerEmail;
        } catch (piError) {
          console.error('Error fetching PaymentIntent:', piError);
        }
      }
      
      if (!customerEmail || customerEmail === 'null') {
        throw new Error('Customer email is required but not found in session. Ensure email collection is enabled in Stripe Checkout.');
      }
    }

    // Obter os itens da linha da sessão do Stripe
    let lineItems;
    try {
      lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        expand: ['data.price.product'],
      });
    } catch (error: any) {
      console.error('Error fetching line items:', error);
      throw new Error(`Failed to fetch line items: ${error.message}`);
    }

    if (!lineItems.data || lineItems.data.length === 0) {
      console.error('No line items found in checkout session:', session.id);
      throw new Error('No line items found in checkout session');
    }

    // Calcular o total (incluindo shipping se houver)
    const amountTotal = session.amount_total ? session.amount_total / 100 : 0; // Converter de centavos para reais

    // Criar o pedido no Supabase
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: userId || null,
        customer_email: customerEmail,
        status: 'paid', // Checkout session completed significa que foi pago
        total_amount: amountTotal,
        stripe_session_id: session.id,
      })
      .select()
      .single();

    if (orderError) {
      console.error('❌ Error creating order:', orderError);
      console.error('Error details:', {
        code: orderError.code,
        message: orderError.message,
        details: orderError.details,
        hint: orderError.hint,
      });
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    if (!order) {
      console.error('❌ Order was not created (no data returned)');
      throw new Error('Order was not created');
    }

    // Order created successfully

    // Criar os itens do pedido
    const orderItems: Array<{
      order_id: string;
      product_id: string;
      product_name: string;
      quantity: number;
      price: number;
      product_image: string | null;
    }> = [];

    for (const lineItem of lineItems.data) {
      // Extrair informações do produto
      const product = lineItem.price?.product as Stripe.Product | string | undefined;
      const productName = typeof product === 'object' && product
        ? product.name
        : lineItem.description || 'Produto';
      
      // Extrair product_id do metadata do produto
      let productId = 'unknown';
      if (typeof product === 'object' && product) {
        // Priorizar product_id do metadata, depois usar o ID do Stripe
        productId = product.metadata?.product_id || product.id;
      } else if (typeof lineItem.price?.product === 'string') {
        // Se o produto não foi expandido e é apenas uma string ID
        productId = lineItem.price.product;
      }
      
      // Obter imagem do produto se disponível
      let productImage: string | null = null;
      
      if (typeof product === 'object' && product) {
        // Produto expandido - usar images do produto
        if (product.images && product.images.length > 0) {
          productImage = product.images[0];
        }
      }
      
      // Verificar se é um kit
      const isKit = typeof product === 'object' && product?.metadata?.is_kit === 'true';
      const kitProducts = typeof product === 'object' && product?.metadata?.kit_products
        ? product.metadata.kit_products.split(',')
        : [];

      if (isKit && kitProducts.length > 0) {
        // É um kit - criar order_items para cada produto do kit
        const kitPrice = lineItem.price?.unit_amount ? lineItem.price.unit_amount / 100 : 0;
        const kitQuantity = lineItem.quantity || 1;

        // Criar item principal do kit
        orderItems.push({
          order_id: order.id,
          product_id: productId,
          product_name: productName,
          quantity: kitQuantity,
          price: kitPrice,
          product_image: productImage,
        });

        // Criar order_items para cada produto do kit (para histórico e estoque)
        // Preço será 0 pois o preço já está no item do kit
        for (const kitProductId of kitProducts) {
          orderItems.push({
            order_id: order.id,
            product_id: kitProductId.trim(),
            product_name: `${productName} - ${kitProductId.trim()}`,
            quantity: kitQuantity,
            price: 0, // Preço já está no item do kit
            product_image: null,
          });
        }
      } else {
        // Produto individual - criar normalmente
        orderItems.push({
          order_id: order.id,
          product_id: productId,
          product_name: productName,
          quantity: lineItem.quantity || 1,
          price: lineItem.price?.unit_amount ? lineItem.price.unit_amount / 100 : 0,
          product_image: productImage,
        });
      }

      // Log para debug (apenas em desenvolvimento)
      if (process.env.NODE_ENV === 'development') {
        console.log('📦 Processando item do pedido:', {
          productId,
          productName,
          isKit,
          kitProducts: isKit ? kitProducts : null,
          hasImage: !!productImage,
          imageUrl: productImage,
          productType: typeof product,
        });
      }
    }

    // Inserir todos os itens do pedido
    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      // Tentar deletar o pedido criado se os itens falharem
      await supabaseAdmin.from('orders').delete().eq('id', order.id);
      throw new Error(`Failed to create order items: ${itemsError.message}`);
    }

    // Pedido criado com sucesso (log removido para produção)

    // ========================================================================
    // CONFIRMAR RESERVA DE ESTOQUE (Sistema de Inventory)
    // ========================================================================
    // Confirma a reserva de estoque e decrementa o stock_quantity
    try {
      const { data: confirmResult, error: confirmError } = await supabaseAdmin.rpc('confirm_reservation', {
        p_stripe_session_id: session.id,
        p_order_id: order.id,
      });

      if (confirmError) {
        console.error('⚠️ Error confirming inventory reservation:', confirmError);
        // Log o erro mas não falha o webhook (pedido já foi criado)
        // Em produção, você pode adicionar uma fila de retry aqui
      } else if (confirmResult && !confirmResult.success) {
        console.warn('⚠️ Inventory reservation not found or already processed:', confirmResult);
        // Isso pode acontecer se não houve reserva prévia (checkout antigo)
        // Ou se a reserva já foi processada
      } else {
        // Reserva confirmada com sucesso
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Inventory reservation confirmed for order:', order.id);
        }
      }
    } catch (inventoryError: any) {
      console.error('⚠️ Error in inventory confirmation:', inventoryError.message);
      // Não falha o webhook, apenas loga o erro
    }

    // Enviar email de confirmação (não bloqueia se falhar)
    try {
      await sendOrderConfirmationEmail({
        order,
        orderItems,
        customerEmail,
        customerName: session.customer_details?.name || null,
      });
    } catch (emailError: any) {
      // Log do erro mas não falha o webhook
      console.error('⚠️ Error sending confirmation email:', emailError.message);
    }

  } catch (error: any) {
    console.error('Error in handleCheckoutSessionCompleted:', error);
    throw error;
  }
}

/**
 * Envia email de confirmação de pedido
 * Usa chamada interna direta para evitar fetch desnecessário
 */
async function sendOrderConfirmationEmail({
  order,
  orderItems,
  customerEmail,
  customerName,
}: {
  order: any;
  orderItems: any[];
  customerEmail: string;
  customerName: string | null;
}) {
  // Verificar se Resend está configurado
  if (!process.env.RESEND_API_KEY) {
    // RESEND_API_KEY not configured. Skipping email.
    return;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const orderUrl = `${siteUrl}/orders`;

  const emailData = {
    customerEmail,
    customerName,
    orderId: order.id,
    orderDate: order.created_at,
    totalAmount: order.total_amount,
    items: orderItems.map((item) => ({
      product_name: item.product_name,
      quantity: item.quantity,
      price: item.price,
      product_image: item.product_image,
    })),
    orderUrl,
  };

  try {
    // Chamar API interna de envio de email
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    
    const response = await fetch(`${baseUrl}/api/send-order-confirmation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || 'Failed to send email');
    }

    const result = await response.json();
    // Order confirmation email sent successfully
    return result;
  } catch (error: any) {
    // Log do erro mas não falha o webhook
    console.error('⚠️ Error sending order confirmation email:', error.message);
    throw error;
  }
}
