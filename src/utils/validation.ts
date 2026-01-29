/**
 * Utilitários de validação para formulários de checkout
 * Validações específicas para dados brasileiros (CPF, CEP)
 */

/**
 * Remove caracteres não numéricos de uma string
 */
function cleanNumericString(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Valida CPF brasileiro
 * @param cpf - CPF com ou sem formatação (ex: "123.456.789-00" ou "12345678900")
 * @returns true se o CPF é válido
 */
export function validateCPF(cpf: string): boolean {
  const cleaned = cleanNumericString(cpf);

  // Deve ter exatamente 11 dígitos
  if (cleaned.length !== 11) {
    return false;
  }

  // Verificar se todos os dígitos são iguais (CPF inválido)
  if (/^(\d)\1{10}$/.test(cleaned)) {
    return false;
  }

  // Validar dígitos verificadores
  let sum = 0;
  let remainder: number;

  // Validar primeiro dígito verificador
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.substring(9, 10))) {
    return false;
  }

  // Validar segundo dígito verificador
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.substring(10, 11))) {
    return false;
  }

  return true;
}

/**
 * Formata CPF para exibição (123.456.789-00)
 */
export function formatCPF(cpf: string): string {
  const cleaned = cleanNumericString(cpf);
  if (cleaned.length !== 11) return cpf;
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

/**
 * Valida CEP brasileiro
 * @param cep - CEP com ou sem formatação (ex: "12345-678" ou "12345678")
 * @returns true se o CEP é válido
 */
export function validateCEP(cep: string): boolean {
  const cleaned = cleanNumericString(cep);
  // CEP deve ter exatamente 8 dígitos
  return cleaned.length === 8 && /^\d{8}$/.test(cleaned);
}

/**
 * Formata CEP para exibição (12345-678)
 */
export function formatCEP(cep: string): string {
  const cleaned = cleanNumericString(cep);
  if (cleaned.length !== 8) return cep;
  return cleaned.replace(/(\d{5})(\d{3})/, "$1-$2");
}

/**
 * Valida e-mail (formato básico)
 * @param email - E-mail a validar
 * @returns true se o formato é válido
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

/**
 * Valida telefone brasileiro
 * @param phone - Telefone com ou sem formatação
 * @returns true se o telefone é válido (10 ou 11 dígitos)
 */
export function validatePhone(phone: string): boolean {
  const cleaned = cleanNumericString(phone);
  // Telefone deve ter 10 ou 11 dígitos (fixo ou celular)
  return cleaned.length === 10 || cleaned.length === 11;
}

/**
 * Formata telefone brasileiro para exibição ((11) 98765-4321)
 */
export function formatPhone(phone: string): string {
  const cleaned = cleanNumericString(phone);
  if (cleaned.length === 10) {
    // Telefone fixo: (11) 1234-5678
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  } else if (cleaned.length === 11) {
    // Celular: (11) 98765-4321
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  return phone;
}

/**
 * Interface para dados de endereço
 */
export interface AddressData {
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

/**
 * Valida dados de endereço completos
 */
export function validateAddress(address: AddressData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!validateCEP(address.cep)) {
    errors.push("CEP inválido");
  }

  if (!address.street || address.street.trim().length < 3) {
    errors.push("Rua deve ter pelo menos 3 caracteres");
  }

  if (!address.number || address.number.trim().length === 0) {
    errors.push("Número é obrigatório");
  }

  if (!address.neighborhood || address.neighborhood.trim().length < 2) {
    errors.push("Bairro deve ter pelo menos 2 caracteres");
  }

  if (!address.city || address.city.trim().length < 2) {
    errors.push("Cidade deve ter pelo menos 2 caracteres");
  }

  if (!address.state || address.state.length !== 2) {
    errors.push("Estado deve ter 2 caracteres (ex: SP)");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
