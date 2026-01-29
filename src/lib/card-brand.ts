/**
 * Detecção de bandeira do cartão a partir do BIN (primeiros dígitos).
 * Usado no checkout para exibir ícone da bandeira (padrão Pagar.me / e-commerce).
 */

export type CardBrand = "visa" | "mastercard" | "elo" | "amex" | null;

/** Retorna a bandeira a partir do número (apenas dígitos; mínimo 6 para Elo/Mastercard, 2 para Amex, 1 para Visa). */
export function getCardBrandFromNumber(number: string): CardBrand {
  const digits = number.replace(/\D/g, "");
  if (digits.length === 0) return null;

  // Amex: 34 ou 37 (15 dígitos)
  if (digits.startsWith("34") || digits.startsWith("37")) return "amex";
  // Visa: começa com 4
  if (digits.startsWith("4")) return "visa";
  // Mastercard: 51-55 ou 2221-2720
  if (digits.length >= 4) {
    const first4 = parseInt(digits.slice(0, 4), 10);
    if (first4 >= 2221 && first4 <= 2720) return "mastercard";
    if (first4 >= 5100 && first4 <= 5599) return "mastercard";
  }
  if (digits.length >= 2) {
    const first2 = parseInt(digits.slice(0, 2), 10);
    if (first2 >= 51 && first2 <= 55) return "mastercard";
  }
  // Elo: BINs comuns por prefixo e faixas
  if (digits.length >= 6) {
    const first6 = digits.slice(0, 6);
    const first6Num = parseInt(first6, 10);
    const eloPrefixes = ["636368", "438935", "504175", "451416", "636297"];
    if (eloPrefixes.some((p) => first6.startsWith(p))) return "elo";
    if (first6Num >= 506699 && first6Num <= 506778) return "elo";
    if (first6Num >= 509000 && first6Num <= 509999) return "elo";
    if (first6Num >= 650031 && first6Num <= 650051) return "elo";
    if (first6Num >= 650405 && first6Num <= 650439) return "elo";
    if (first6Num >= 650485 && first6Num <= 650598) return "elo";
    if (first6Num >= 650700 && first6Num <= 650727) return "elo";
    if (first6Num >= 650901 && first6Num <= 650920) return "elo";
    if (first6Num >= 651652 && first6Num <= 651679) return "elo";
    if (first6Num >= 655000 && first6Num <= 655058) return "elo";
  }

  return null;
}

/** Formata número do cartão com espaços a cada 4 dígitos (máx. 19 chars para Amex 4-6-5). */
export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 4) return digits;
  if (digits.startsWith("34") || digits.startsWith("37")) {
    // Amex: 4-6-5
    return [digits.slice(0, 4), digits.slice(4, 10), digits.slice(10, 15)]
      .filter(Boolean)
      .join(" ");
  }
  return digits.match(/.{1,4}/g)?.join(" ") ?? digits;
}

/** Formata validade MM/AA. */
export function formatExpDate(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
}
