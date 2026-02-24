/**
 * Skip link — acessibilidade (WCAG 2.1)
 * Permite que usuários de teclado e leitores de tela pulem navegação e acessem o conteúdo principal.
 */
export default function SkipLink() {
  return (
    <a
      href="#main-content"
      className="skip-link"
    >
      Pular para o conteúdo
    </a>
  );
}
