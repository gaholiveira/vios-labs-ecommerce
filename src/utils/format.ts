/**
 * Formata um número como preço em Real brasileiro (R$)
 * @param price - O preço a ser formatado
 * @returns String formatada como "R$ XX,XX"
 */
export function formatPrice(price: number): string {
  return `R$ ${price.toFixed(2).replace('.', ',')}`;
}

/**
 * Formata quantidade de unidades vendidas (prova social)
 * Ex.: 1247 → "1.247"
 */
export function formatUnitsSold(count: number): string {
  return count.toLocaleString('pt-BR');
}

/**
 * Formata unidades vendidas para destaque (prova social)
 * Ex.: 40 → "40+", 32 → "30+", 20 → "20+", 15 → "15"
 */
export function formatUnitsSoldForDisplay(count: number): string {
  if (count >= 100) return '100+';
  if (count >= 50) return '50+';
  if (count >= 40) return '40+';
  if (count >= 30) return '30+';
  if (count >= 20) return '20+';
  return count.toLocaleString('pt-BR');
}

/**
 * Formata um número de telefone brasileiro
 * Aceita números com ou sem código do país (+55)
 * Formato: (XX) XXXXX-XXXX (11 dígitos) ou +55 XX XXXXX-XXXX (13 dígitos)
 * @param phone - O número de telefone a ser formatado
 * @returns String formatada
 */
export function formatPhone(phone: string): string {
  // Remove tudo que não é número
  const numbers = phone.replace(/\D/g, '');

  // Se começar com 55 (código do Brasil), trata como internacional
  if (numbers.startsWith('55') && numbers.length > 11) {
    const countryCode = numbers.substring(0, 2);
    const rest = numbers.substring(2);
    
    if (rest.length <= 2) {
      return `+${countryCode} ${rest}`;
    } else if (rest.length <= 7) {
      return `+${countryCode} ${rest.substring(0, 2)} ${rest.substring(2)}`;
    } else if (rest.length <= 11) {
      return `+${countryCode} ${rest.substring(0, 2)} ${rest.substring(2, 7)}-${rest.substring(7)}`;
    } else {
      // Se tiver mais de 11 dígitos após o 55, mantém apenas os primeiros 13
      const limited = rest.substring(0, 11);
      return `+${countryCode} ${limited.substring(0, 2)} ${limited.substring(2, 7)}-${limited.substring(7)}`;
    }
  }

  // Formatação para números nacionais (até 11 dígitos: DDD + 9 dígitos)
  if (numbers.length === 0) {
    return '';
  } else if (numbers.length <= 2) {
    return `(${numbers}`;
  } else if (numbers.length <= 7) {
    return `(${numbers.substring(0, 2)}) ${numbers.substring(2)}`;
  } else if (numbers.length <= 11) {
    return `(${numbers.substring(0, 2)}) ${numbers.substring(2, 7)}-${numbers.substring(7)}`;
  } else {
    // Limita a 11 dígitos para números nacionais
    const limited = numbers.substring(0, 11);
    return `(${limited.substring(0, 2)}) ${limited.substring(2, 7)}-${limited.substring(7)}`;
  }
}
