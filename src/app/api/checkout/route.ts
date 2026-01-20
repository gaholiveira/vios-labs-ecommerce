import { NextResponse } from "next/server";
import Stripe from "stripe";

// Função helper para obter o cliente Stripe (lazy initialization)
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

export async function POST(req: Request) {
  try {
    // Inicializar Stripe apenas quando a rota for chamada (runtime)
    const stripe = getStripeClient();
    const { items, userId, customerEmail } = await req.json();

    // Obter a URL base da requisição ou variável de ambiente
    const origin = req.headers.get('origin') || 
                   process.env.NEXT_PUBLIC_BASE_URL || 
                   (process.env.NODE_ENV === 'production' 
                     ? 'https://vioslabs.com.br' 
                     : 'http://localhost:3000');

    // Validar se a URL base é válida
    if (!origin || (!origin.startsWith('http://') && !origin.startsWith('https://'))) {
      console.error('URL base inválida:', origin);
      return NextResponse.json(
        { error: "Configuração de URL inválida. Verifique NEXT_PUBLIC_BASE_URL." },
        { status: 500 }
      );
    }

    // 1. Validar se há itens
    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Carrinho vazio" }, { status: 400 });
    }

    // 2. Calcular Subtotal para regra de Frete
    // (Assume que items tem { price: number, quantity: number })
    let subtotal = 0;
    const lineItems = items.map((item: any) => {
      subtotal += item.price * item.quantity;
      
      // Converter URL relativa para absoluta se necessário
      let imageUrl: string | undefined = undefined;
      if (item.image) {
        // Se já é uma URL absoluta, usar diretamente
        if (item.image.startsWith('http://') || item.image.startsWith('https://')) {
          imageUrl = item.image;
        } 
        // Se é uma URL relativa, converter para absoluta
        else if (item.image.startsWith('/')) {
          imageUrl = `${origin}${item.image}`;
        }
        // Se não começa com /, assumir que é relativo
        else {
          imageUrl = `${origin}/${item.image}`;
        }
      }
      
      return {
        price_data: {
          currency: "brl",
          product_data: {
            name: item.name,
            images: imageUrl ? [imageUrl] : [], // Apenas URLs absolutas válidas
            metadata: {
              product_id: item.id, // ID do produto para uso no webhook
            },
          },
          unit_amount: Math.round(item.price * 100), // Converte para centavos
        },
        quantity: item.quantity,
      };
    });

    // 3. Lógica de Frete (Regra de Negócio VIOS)
    // Limite: R$ 289,90
    const FREE_SHIPPING_THRESHOLD = 289.90;
    const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;

    const shippingOptions = isFreeShipping
      ? [
          {
            shipping_rate_data: {
              type: "fixed_amount",
              fixed_amount: { amount: 0, currency: "brl" },
              display_name: "Frete Grátis VIOS (Lote Zero)",
              delivery_estimate: {
                minimum: { unit: "business_day", value: 3 },
                maximum: { unit: "business_day", value: 5 },
              },
            },
          },
        ]
      : [
          {
            shipping_rate_data: {
              type: "fixed_amount",
              fixed_amount: { amount: 2500, currency: "brl" }, // R$ 25,00
              display_name: "Entrega Premium",
              delivery_estimate: {
                minimum: { unit: "business_day", value: 5 },
                maximum: { unit: "business_day", value: 7 },
              },
            },
          },
        ];

    // 4. Validar URLs antes de criar a sessão
    const successUrl = `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/?canceled=true`;
    
    // Validar que as URLs são válidas
    try {
      new URL(successUrl);
      new URL(cancelUrl);
    } catch (urlError) {
      console.error('URLs inválidas:', { successUrl, cancelUrl, origin });
      return NextResponse.json(
        { error: "Erro ao configurar URLs de retorno. Verifique NEXT_PUBLIC_BASE_URL." },
        { status: 500 }
      );
    }

    // 5. Criar Sessão do Checkout
    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: "payment",
      payment_method_types: ["card", "boleto"],
      shipping_address_collection: {
        allowed_countries: ["BR"],
      },
      shipping_options: shippingOptions as any,
      success_url: successUrl,
      cancel_url: cancelUrl,
      // Metadata para identificar se é guest ou user no webhook
      metadata: {
        userId: userId || 'null', // Stripe não aceita null diretamente, usar string 'null'
        customerEmail: customerEmail || 'null',
        isGuest: (!userId).toString(), // 'true' se guest, 'false' se user
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Erro no Checkout:", err);
    console.error("Detalhes do erro:", {
      message: err.message,
      type: err.type,
      code: err.code,
      raw: err.raw,
    });
    
    // Mensagem de erro mais específica para o usuário
    let errorMessage = "Erro interno no servidor";
    if (err.message?.includes("Not a valid URL")) {
      errorMessage = "Erro na configuração de URLs. Verifique as variáveis de ambiente.";
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
