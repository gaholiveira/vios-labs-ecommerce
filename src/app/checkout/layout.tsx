import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout | VIOS LABS",
  description:
    "Finalize sua compra com segurança. PIX ou cartão de crédito — entrega em todo o Brasil.",
  robots: { index: false, follow: true },
};

/**
 * Layout minimalista para rotas /checkout* — apenas logo no header.
 * Navbar e Footer são ocultados pelo ConditionalSiteChrome no root layout.
 */
export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col">
      <header className="shrink-0 border-b border-brand-softblack/10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="text-brand-softblack font-light uppercase tracking-[0.2em] text-sm hover:opacity-80 transition-opacity"
          >
            VIOS LABS
          </Link>
          <Link
            href="/"
            className="text-[10px] uppercase tracking-wider text-brand-softblack/60 hover:text-brand-green transition-colors"
          >
            Voltar
          </Link>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
