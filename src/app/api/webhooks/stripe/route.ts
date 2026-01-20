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
      console.log(`✅ Webhook verified: ${event.type} (${event.id})`);
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
        console.log(`Processing checkout.session.completed for session: ${(event.data.object as Stripe.Checkout.Session).id}`);
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, stripe);
        break;

      case 'payment_intent.succeeded':
        // Opcional: também processar payment_intent.succeeded como fallback
        // Mas checkout.session.completed já deve ser suficiente
        console.log(`Payment intent succeeded: ${(event.data.object as Stripe.PaymentIntent).id}`);
        // Não processar aqui, esperar checkout.session.completed
        break;

      default:
        console.log(`⚠️ Unhandled event type: ${event.type} (${event.id})`);
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
    console.log(`Processing checkout session: ${session.id}`);
    
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
      console.log(`⚠️ Order already exists for session ${session.id}: ${existingOrder.id}`);
      return;
    }

    // Obter dados do metadata da sessão
    const metadata = session.metadata || {};
    const userId = metadata.userId === 'null' || metadata.userId === null || metadata.userId === undefined ? null : metadata.userId;
    const customerEmail = session.customer_email || metadata.customerEmail || session.customer_details?.email;
    const isGuest = metadata.isGuest === 'true' || !userId;

    console.log('Session metadata:', { userId, customerEmail, isGuest, metadata });

    // Validar que temos um email do cliente
    if (!customerEmail) {
      console.error('Missing customer email in session:', {
        customer_email: session.customer_email,
        metadata_customerEmail: metadata.customerEmail,
        customer_details_email: session.customer_details?.email,
      });
      throw new Error('Customer email is required but not found in session');
    }

    // Obter os itens da linha da sessão do Stripe
    console.log('Fetching line items for session:', session.id);
    let lineItems;
    try {
      lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        expand: ['data.price.product'],
      });
      console.log(`Found ${lineItems.data?.length || 0} line items`);
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
    console.log('Creating order in Supabase:', {
      user_id: userId,
      customer_email: customerEmail,
      total_amount: amountTotal,
      stripe_session_id: session.id,
    });

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

    console.log(`✅ Order created: ${order.id}`);

    // Criar os itens do pedido
    const orderItems = lineItems.data.map((lineItem) => {
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
      const productImage = typeof product === 'object' && product && product.images && product.images.length > 0
        ? product.images[0]
        : null;

      return {
        order_id: order.id,
        product_id: productId,
        product_name: productName,
        quantity: lineItem.quantity || 1,
        price: lineItem.price?.unit_amount ? lineItem.price.unit_amount / 100 : 0, // Converter de centavos para reais
        product_image: productImage,
      };
    });

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

    console.log(`✅ Order created successfully: ${order.id} for ${isGuest ? 'guest' : 'user'} ${userId || customerEmail}`);
  } catch (error: any) {
    console.error('Error in handleCheckoutSessionCompleted:', error);
    throw error;
  }
}
