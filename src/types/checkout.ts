/**
 * Tipos para checkout transparente VIOS Labs — Pagar.me como único gateway.
 * Checkout "a cara da VIOS" dentro do site (PIX e cartão via tokenizecard).
 */

/** Item do carrinho enviado para a API de checkout */
export interface CheckoutCartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  kitProducts?: string[];
  isKit?: boolean;
}

/** Payload para o step de pagamento — apenas Pagar.me */
export type CheckoutPaymentPayload =
  | {
      provider: "pagarme";
      orderId: string;
      paymentMethod: "pix";
      pix: {
        qr_code: string | null;
        qr_code_url: string | null;
        /** Código PIX para copiar e colar no app do banco */
        pix_copy_paste: string | null;
      };
    }
  | {
      provider: "pagarme";
      paymentMethod: "card";
      checkoutData: CheckoutFormData;
      items: CheckoutCartItem[];
      userId: string | null;
      installmentOption: "1x" | "2x" | "3x";
      /** Cupom de teste (ex.: TESTE90) */
      couponCode?: string | null;
      /** Valor do frete em reais (Melhor Envio) */
      shippingReais?: number;
      /** Opção de frete selecionada (para metadata do pedido) */
      selectedShippingOption?: { id: string; name: string; type: string } | null;
    };

/** Dados do formulário de checkout (entrega + fiscal) */
export interface CheckoutFormData {
  email: string;
  fullName: string;
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
