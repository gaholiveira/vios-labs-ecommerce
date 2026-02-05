import Link from "next/link";

export default function KitNotFound() {
  return (
    <div className="min-h-screen bg-brand-offwhite flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-light uppercase tracking-wider mb-4 text-brand-softblack">
          Kit não encontrado
        </h1>
        <p className="text-brand-softblack/70 mb-8">
          O kit que você está procurando não existe ou foi removido.
        </p>
        <Link
          href="/"
          className="inline-block border border-brand-green bg-brand-green text-brand-offwhite px-6 py-3 uppercase tracking-wider text-xs font-medium hover:bg-brand-softblack hover:border-brand-softblack transition-colors duration-300"
        >
          Voltar para a página inicial
        </Link>
      </div>
    </div>
  );
}
