/**
 * Status (estilo Stories) — conteúdo para a barra horizontal na home.
 * Edite aqui para adicionar/remover itens (promoções, novidades, etc.).
 */
export interface StatusItem {
  id: string;
  image: string;
  title: string;
  /** Link opcional ao clicar (ex: /produto/xxx, /kit/xxx) */
  link?: string;
}

export const STATUS_ITEMS: StatusItem[] = [];
