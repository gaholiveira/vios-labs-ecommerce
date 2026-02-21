/**
 * Testemunho curado — usado antes de haver compras verificadas.
 * Pode vir de beta testers, VIP list, equipe ou feedback externo.
 */
export interface Testimonial {
  id: string;
  /** Texto do depoimento */
  text: string;
  /** Nome ou iniciais (ex.: "Maria S.", "Cliente V.") */
  author: string;
  /** Contexto opcional (ex.: "Beta tester", "VIP") */
  context?: string;
  /** ID do produto (prod_1, prod_2...) — null = geral/kit */
  productId?: string | null;
  /** ID do kit — null = produto individual */
  kitId?: string | null;
  /** Avaliação 1–5 (opcional, para exibir estrelas) */
  rating?: number;
}
