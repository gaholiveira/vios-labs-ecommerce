'use client';

import Link from 'next/link';
import { XCircle, ArrowLeft, ShoppingBag } from 'lucide-react';

export default function CanceledPage() {
  return (
    <main className="min-h-screen bg-[#faf9f6] flex items-center justify-center px-4 md:px-6 py-24 md:py-32">
      <div className="flex flex-col items-center text-center max-w-lg w-full mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Ícone de Cancelamento */}
        <div className="mb-8 md:mb-10 relative">
          <div className="absolute inset-0 bg-red-50 rounded-full blur-xl" />
          <div className="relative w-24 h-24 md:w-28 md:h-28 bg-white border border-red-100 rounded-full flex items-center justify-center shadow-sm">
            <XCircle className="w-10 h-10 md:w-12 md:h-12 text-red-400" strokeWidth={1.5} />
          </div>
        </div>

        {/* Textos */}
        <h1 className="text-3xl md:text-4xl font-serif font-medium text-[#082f1e] mb-4 md:mb-6 tracking-wide">
          Checkout Cancelado
        </h1>
        <p className="text-stone-600 mb-8 md:mb-10 leading-relaxed text-base md:text-lg max-w-md mx-auto">
          Seu checkout foi cancelado. Nenhum pagamento foi processado.
        </p>

        {/* Ações */}
        <div className="space-y-4 w-full max-w-sm">
          <Link href="/" className="block w-full">
            <button className="w-full py-4 md:py-5 border border-[#082f1e] text-[#082f1e] bg-transparent hover:bg-[#082f1e] hover:text-white transition-all duration-300 rounded-sm uppercase tracking-widest text-xs font-medium flex items-center justify-center gap-2 group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Voltar para a Loja
            </button>
          </Link>

          <Link href="/" className="block w-full">
            <button className="w-full py-4 md:py-5 bg-[#082f1e] text-white hover:bg-[#082f1e]/90 transition-all duration-300 rounded-sm uppercase tracking-widest text-xs font-medium flex items-center justify-center gap-2 group">
              <ShoppingBag className="w-4 h-4" />
              Ver Carrinho
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}
