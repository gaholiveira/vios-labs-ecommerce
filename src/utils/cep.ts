/**
 * Utilitário para buscar endereço via CEP usando API ViaCEP
 * https://viacep.com.br/
 */

export interface ViaCEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

/**
 * Busca endereço completo a partir de um CEP
 * @param cep - CEP com ou sem formatação
 * @returns Dados do endereço ou null se não encontrado
 */
export async function fetchAddressByCEP(
  cep: string,
): Promise<ViaCEPResponse | null> {
  // Limpar CEP (remover formatação)
  const cleanedCEP = cep.replace(/\D/g, "");

  if (cleanedCEP.length !== 8) {
    return null;
  }

  try {
    const response = await fetch(
      `https://viacep.com.br/ws/${cleanedCEP}/json/`,
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as ViaCEPResponse;

    // ViaCEP retorna { erro: true } quando CEP não existe
    if (data.erro) {
      return null;
    }

    return data;
  } catch (error) {
    console.error("Erro ao buscar CEP:", error);
    return null;
  }
}
