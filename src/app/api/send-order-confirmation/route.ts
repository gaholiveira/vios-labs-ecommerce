import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Inicializar Resend (lazy para evitar erros de build)
const getResendClient = () => {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    throw new Error('Missing RESEND_API_KEY environment variable.');
  }
  return new Resend(RESEND_API_KEY);
};

// Tipos
interface OrderItem {
  product_name: string;
  quantity: number;
  price: number;
  product_image: string | null;
}

interface OrderConfirmationEmailData {
  customerEmail: string;
  customerName: string | null;
  orderId: string;
  orderDate: string;
  totalAmount: number;
  items: OrderItem[];
  orderUrl?: string;
}

// Formatar preço em BRL
function formatPrice(price: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price);
}

// Formatar data
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

// Template HTML do email (Luxury Minimalist)
function generateOrderConfirmationEmail(data: OrderConfirmationEmailData): string {
  const orderUrl = data.orderUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://vioslabs.com.br'}/orders`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vioslabs.com.br';

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmação de Pedido - VIOS LABS</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #faf9f6; color: #1a1a1a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf9f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 48px 48px 32px 48px; text-align: center; border-bottom: 1px solid #f0f0f0;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 0.1em; text-transform: uppercase; color: #082f1e;">
                VIOS LABS
              </h1>
              <p style="margin: 12px 0 0 0; font-size: 12px; letter-spacing: 0.05em; color: #666; text-transform: uppercase;">
                Pedido Confirmado
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 48px;">
              
              <!-- Greeting -->
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #1a1a1a;">
                Olá ${data.customerName || 'cliente'},
              </p>
              
              <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 1.6; color: #1a1a1a;">
                Obrigado por escolher a VIOS LABS. Seu pedido foi confirmado com sucesso e está sendo processado.
              </p>

              <!-- Order Details -->
              <div style="background-color: #faf9f6; border-radius: 4px; padding: 24px; margin-bottom: 32px;">
                <p style="margin: 0 0 16px 0; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #666; font-weight: 500;">
                  Detalhes do Pedido
                </p>
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #1a1a1a;">
                  <strong>Nº do Pedido:</strong> #${data.orderId.slice(0, 8).toUpperCase()}
                </p>
                <p style="margin: 0; font-size: 14px; color: #1a1a1a;">
                  <strong>Data:</strong> ${formatDate(data.orderDate)}
                </p>
              </div>

              <!-- Order Items -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px; border-top: 1px solid #f0f0f0; border-bottom: 1px solid #f0f0f0;">
                ${data.items.map((item) => `
                  <tr>
                    <td style="padding: 24px 0; border-bottom: 1px solid #faf9f6;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          ${item.product_image ? `
                            <td width="80" style="padding-right: 16px; vertical-align: top;">
                              <img src="${item.product_image}" alt="${item.product_name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px; border: 1px solid #f0f0f0;" />
                            </td>
                          ` : ''}
                          <td style="vertical-align: top;">
                            <p style="margin: 0 0 8px 0; font-size: 15px; font-weight: 500; color: #1a1a1a;">
                              ${item.product_name}
                            </p>
                            <p style="margin: 0; font-size: 13px; color: #666;">
                              Quantidade: ${item.quantity} × ${formatPrice(item.price)}
                            </p>
                          </td>
                          <td align="right" style="vertical-align: top;">
                            <p style="margin: 0; font-size: 15px; font-weight: 500; color: #082f1e;">
                              ${formatPrice(item.price * item.quantity)}
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                `).join('')}
              </table>

              <!-- Total -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                <tr>
                  <td align="right">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; text-align: right;">
                          <p style="margin: 0; font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 0.05em;">
                            Total
                          </p>
                        </td>
                        <td width="120" style="padding: 8px 0 8px 24px; text-align: right;">
                          <p style="margin: 0; font-size: 20px; font-weight: 500; color: #082f1e;">
                            ${formatPrice(data.totalAmount)}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Next Steps -->
              <div style="background-color: #f0f7f4; border-left: 3px solid #082f1e; padding: 20px; margin-bottom: 32px; border-radius: 4px;">
                <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 500; color: #082f1e;">
                  Próximos Passos
                </p>
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #1a1a1a;">
                  Você receberá um e-mail com o código de rastreamento assim que o pedido for despachado. 
                  Enquanto isso, você pode acompanhar o status do seu pedido acessando sua conta.
                </p>
              </div>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 24px 0;">
                    <a href="${orderUrl}" style="display: inline-block; padding: 16px 32px; background-color: #082f1e; color: #ffffff; text-decoration: none; border-radius: 4px; font-size: 13px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase;">
                      Acompanhar Pedido
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <p style="margin: 32px 0 0 0; font-size: 13px; line-height: 1.6; color: #666; text-align: center;">
                Precisa de ajuda? Entre em contato conosco através do nosso 
                <a href="${siteUrl}" style="color: #082f1e; text-decoration: underline;">site</a>.
              </p>

            </td>
          </tr>

          <!-- Footer Bottom -->
          <tr>
            <td style="padding: 32px 48px; background-color: #faf9f6; text-align: center; border-top: 1px solid #f0f0f0;">
              <p style="margin: 0 0 8px 0; font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.1em;">
                VIOS LABS
              </p>
              <p style="margin: 0; font-size: 11px; color: #999;">
                © ${new Date().getFullYear()} VIOS LABS. Todos os direitos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function POST(req: NextRequest) {
  try {
    const resend = getResendClient();
    const data: OrderConfirmationEmailData = await req.json();

    // Validação
    if (!data.customerEmail) {
      return NextResponse.json(
        { error: 'Customer email is required' },
        { status: 400 }
      );
    }

    if (!data.orderId || !data.items || data.items.length === 0) {
      return NextResponse.json(
        { error: 'Order ID and items are required' },
        { status: 400 }
      );
    }

    // Obter domínio de envio do Resend
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@resend.dev';
    const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'VIOS LABS';

    // Enviar email
    const { data: emailData, error } = await resend.emails.send({
      from: `${siteName} <${fromEmail}>`,
      to: data.customerEmail,
      subject: `Pedido Confirmado #${data.orderId.slice(0, 8).toUpperCase()} - ${siteName}`,
      html: generateOrderConfirmationEmail(data),
    });

    if (error) {
      console.error('Error sending email:', error);
      return NextResponse.json(
        { error: 'Failed to send email', details: error },
        { status: 500 }
      );
    }

    // Order confirmation email sent successfully

    return NextResponse.json({ 
      success: true, 
      messageId: emailData?.id 
    });

  } catch (error: any) {
    console.error('Error in send-order-confirmation:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
