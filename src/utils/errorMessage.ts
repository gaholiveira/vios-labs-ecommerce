/**
 * Extrai a mensagem de um erro desconhecido de forma type-safe.
 * Usa como substituto seguro de `(err as any).message`.
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Erro desconhecido";
}
