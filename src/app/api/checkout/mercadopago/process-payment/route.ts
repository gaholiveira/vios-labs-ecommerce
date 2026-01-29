import { NextResponse } from "next/server";
import { Payment } from "mercadopago";
import {
  getMercadoPagoClient,
  isMercadoPagoConfigured,
} from "@/lib/mercadopago";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

interface ProcessPaymentBody {
  preferenceId: string;
  amount: number;
  payerEmail: string;
}

/**
 * Cria o pagamento PIX via API do Mercado Pago.
 * Chamado pelo Payment Brick no onSubmit — sem isso o botão "Pagar" trava.
 * O webhook receberá a notificação de aprovação e criará o pedido (preferenceId = stripe_session_id).
 */
export async function POST(req: Request) {
  try {
    if (!isMercadoPagoConfigured()) {
      return NextResponse.json(
        { error: "Mercado Pago não configurado" },
        { status: 503 },
      );
    }

    let body: ProcessPaymentBody;
    try {
      const raw = await req.json();
      if (
        !raw ||
        typeof raw !== "object" ||
        !raw.preferenceId ||
        typeof raw.amount !== "number" ||
        !raw.payerEmail ||
        typeof raw.payerEmail !== "string"
      ) {
        return NextResponse.json(
          { error: "preferenceId, amount e payerEmail são obrigatórios" },
          { status: 400 },
        );
      }
      body = raw as ProcessPaymentBody;
    } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }

    const { preferenceId, amount, payerEmail } = body;
    const emailTrimmed = payerEmail.trim().toLowerCase();
    if (!emailTrimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      return NextResponse.json(
        { error: "E-mail do pagador inválido" },
        { status: 400 },
      );
    }
    if (amount <= 0 || !Number.isFinite(amount)) {
      return NextResponse.json(
        { error: "Valor do pagamento inválido" },
        { status: 400 },
      );
    }

    const config = getMercadoPagoClient();
    const paymentClient = new Payment(config);

    const idempotencyKey = randomUUID();
    const payment = await paymentClient.create({
      body: {
        transaction_amount: Number(amount),
        payment_method_id: "pix",
        payer: {
          email: emailTrimmed,
        },
        external_reference: preferenceId,
        description: `Pedido VIOS Labs - ${preferenceId}`,
        metadata: { preference_id: preferenceId },
      },
      requestOptions: {
        idempotencyKey,
      },
    });

    const poi = payment.point_of_interaction;
    const transactionData = poi?.transaction_data;

    return NextResponse.json({
      paymentId: payment.id,
      status: payment.status,
      status_detail: payment.status_detail,
      qr_code_base64: transactionData?.qr_code_base64 ?? null,
      qr_code: transactionData?.qr_code ?? null,
      ticket_url: transactionData?.ticket_url ?? null,
    });
  } catch (err: unknown) {
    console.error("[MERCADOPAGO process-payment]", err);
    const message =
      err instanceof Error ? err.message : "Erro ao criar pagamento PIX.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
