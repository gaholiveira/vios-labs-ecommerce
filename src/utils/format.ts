/**
 * Formata um número como preço em Real brasileiro (R$)
 * @param price - O preço a ser formatado
 * @returns String formatada como "R$ XX,XX"
 */
export function formatPrice(price: number): string {
  return `R$ ${price.toFixed(2).replace('.', ',')}`;
}
