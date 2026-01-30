/**
 * Declaração de tipos para o módulo pagarme/browser (pagarme-js).
 * Evita erro de "Could not find a declaration file" no build.
 */
declare module "pagarme/browser" {
  interface PagarmeEncryptCard {
    card_number: string;
    card_holder_name: string;
    card_expiration_date: string;
    card_cvv: string;
  }

  interface PagarmeClient {
    security: {
      encrypt(card: PagarmeEncryptCard): Promise<string>;
    };
  }

  interface PagarmeStatic {
    client: {
      connect(options: { encryption_key: string }): Promise<PagarmeClient>;
    };
  }

  const pagarme: PagarmeStatic;
  export default pagarme;
}
