/**
 * Tipos para checkout com provider dinâmico (Stripe Elements / Mercado Pago Bricks).
 * Checkout "a cara da VIOS" — pagamento embed no site, sem redirecionamento.
 */

export type PaymentProvider = "stripe" | "mercadopago";

/** Payload retornado pela API para renderizar o step de pagamento no front */
export type CheckoutPaymentPayload =
  | { provider: "stripe"; clientSecret: string }
  | {
      provider: "mercadopago";
      preferenceId: string;
      publicKey: string;
      amount: number;
      payerEmail?: string;
      /** "pix" = Brick só PIX; "card" = Brick só cartão (2x/3x) */
      paymentMethod: "pix" | "card";
      /** Parcela quando paymentMethod === "card" */
      installmentOption?: "2x" | "3x";
    };

/** Dados do formulário de checkout (entrega + fiscal) */
export interface CheckoutFormData {
  email: string;
  cpf: string;
  phone: string;
  address: {
    cep: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
  };
}

/** Opção de parcelamento no cartão */
export type InstallmentOption = "1x" | "2x" | "3x";

/** Método de pagamento selecionado pelo usuário */
export type PaymentMethod = "card" | "pix";
