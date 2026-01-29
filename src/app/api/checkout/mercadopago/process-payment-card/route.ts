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

/** formData enviado pelo Payment Brick para cartão (onSubmit) */
interface CardFormDataFromBrick {
  token?: string;
  payment_method_id?: string;
  issuer_id?: string;
  installments?: number;
  transaction_amount?: number;
  payer?: {
    email?: string;
    first_name?: string;
    last_name?: string;
    identification?: { type?: string; number?: string };
  };
}

interface ProcessCardBody {
  preferenceId: string;
  amount: number;
  formData: CardFormDataFromBrick;
}

/**
 * Cria pagamento com cartão (2x ou 3x) via API do Mercado Pago.
 * Chamado pelo Payment Brick no onSubmit quando o método é credit_card.
 * O webhook receberá a notificação e criará o pedido (metadata.preference_id).
 */
export async function POST(req: Request) {
  try {
    if (!isMercadoPagoConfigured()) {
      return NextResponse.json(
        { error: "Mercado Pago não configurado" },
        { status: 503 },
      );
    }

    let body: ProcessCardBody;
    try {
      const raw = await req.json();
      if (
        !raw ||
        typeof raw !== "object" ||
        !raw.preferenceId ||
        typeof raw.amount !== "number" ||
        !raw.formData ||
        typeof raw.formData !== "object"
      ) {
        return NextResponse.json(
          { error: "preferenceId, amount e formData são obrigatórios" },
          { status: 400 },
        );
      }
      body = raw as ProcessCardBody;
    } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }

    const { preferenceId, amount, formData } = body;
    const token = formData.token;
    const paymentMethodId = formData.payment_method_id;
    const installments = formData.installments ?? 1;
    const transactionAmount = Number(formData.transaction_amount ?? amount);
    const payerEmail = formData.payer?.email?.trim() || "";
    const payerFirstName = formData.payer?.first_name ?? "";
    const payerLastName = formData.payer?.last_name ?? "";
    const identification = formData.payer?.identification;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Token do cartão é obrigatório" },
        { status: 400 },
      );
    }
    if (!paymentMethodId) {
      return NextResponse.json(
        { error: "Método de pagamento é obrigatório" },
        { status: 400 },
      );
    }
    if (!payerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payerEmail)) {
      return NextResponse.json(
        { error: "E-mail do pagador inválido" },
        { status: 400 },
      );
    }
    if (transactionAmount <= 0 || !Number.isFinite(transactionAmount)) {
      return NextResponse.json(
        { error: "Valor do pagamento inválido" },
        { status: 400 },
      );
    }

    const config = getMercadoPagoClient();
    const paymentClient = new Payment(config);

    const payerBody: {
      email: string;
      first_name?: string;
      last_name?: string;
      identification?: { type?: string; number?: string };
    } = { email: payerEmail };
    if (payerFirstName) payerBody.first_name = payerFirstName;
    if (payerLastName) payerBody.last_name = payerLastName;
    if (
      identification &&
      typeof identification.type === "string" &&
      typeof identification.number === "string"
    ) {
      payerBody.identification = {
        type: identification.type,
        number: identification.number.replace(/\D/g, ""),
      };
    }

    const issuerId =
      formData.issuer_id != null && formData.issuer_id !== ""
        ? Number(formData.issuer_id)
        : undefined;
    const idempotencyKey = randomUUID();
    const payment = await paymentClient.create({
      body: {
        transaction_amount: transactionAmount,
        token,
        payment_method_id: paymentMethodId,
        installments: Math.min(Math.max(1, installments), 24),
        payer: payerBody,
        ...(typeof issuerId === "number" && Number.isFinite(issuerId)
          ? { issuer_id: issuerId }
          : {}),
        external_reference: preferenceId,
        description: `Pedido VIOS Labs - ${preferenceId}`,
        metadata: { preference_id: preferenceId },
      },
      requestOptions: {
        idempotencyKey,
      },
    });

    return NextResponse.json({
      paymentId: payment.id,
      status: payment.status,
      status_detail: payment.status_detail,
    });
  } catch (err: unknown) {
    console.error("[MERCADOPAGO process-payment-card]", err);
    const message =
      err instanceof Error ? err.message : "Erro ao processar cartão.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
