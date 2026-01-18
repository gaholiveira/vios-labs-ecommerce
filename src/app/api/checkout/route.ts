import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

interface CheckoutItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items }: { items: CheckoutItem[] } = body;

    // Validação dos itens
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items são obrigatórios e devem ser um array não vazio' },
        { status: 400 }
      );
    }

    // Obter origin da requisição
    const origin = request.headers.get('origin') || request.nextUrl.origin;

    // Construir line_items para o Stripe
    const lineItems = items.map((item) => {
      // Converter preço de centavos (se necessário) ou usar o preço direto em BRL
      // Assumindo que o preço está em reais (289.90 = R$ 289,90)
      // Stripe espera o preço em centavos, então multiplicamos por 100
      const priceInCents = Math.round(item.price * 100);

      return {
        price_data: {
          currency: 'brl',
          product_data: {
            name: item.name,
            images: item.image ? [`${origin}${item.image}`] : [],
          },
          unit_amount: priceInCents,
        },
        quantity: item.quantity,
      };
    });

    // Criar sessão de checkout no Stripe
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      shipping_address_collection: {
        allowed_countries: ['BR'],
      },
      line_items: lineItems,
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/carrinho`,
      metadata: {
        // Opcional: armazenar IDs dos produtos para referência futura
        items: JSON.stringify(items.map((item) => ({ id: item.id, quantity: item.quantity }))),
      },
    });

    // Retornar URL da sessão e sessionId
    return NextResponse.json(
      {
        url: session.url,
        sessionId: session.id,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erro ao criar sessão de checkout:', error);

    return NextResponse.json(
      {
        error: 'Erro ao processar checkout',
        message: error.message || 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
