'use client';

import { useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Check, Mail, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <main className="min-h-screen bg-[#faf9f6] flex items-center justify-center px-4 md:px-6 py-24 md:py-32">
      <div className="flex flex-col items-center text-center max-w-lg w-full mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Ícone de Sucesso */}
        <div className="mb-8 md:mb-10 relative">
          <div className="absolute inset-0 bg-[#082f1e]/10 rounded-full blur-xl animate-pulse" />
          <div className="relative w-24 h-24 md:w-28 md:h-28 bg-white border border-[#082f1e]/10 rounded-full flex items-center justify-center shadow-sm">
            <Check className="w-10 h-10 md:w-12 md:h-12 text-[#082f1e]" strokeWidth={1.5} />
          </div>
        </div>

        {/* Textos */}
        <h1 className="text-3xl md:text-4xl font-serif font-medium text-[#082f1e] mb-4 md:mb-6 tracking-wide">
          Pedido Confirmado
        </h1>
        <p className="text-stone-600 mb-8 md:mb-10 leading-relaxed text-base md:text-lg max-w-md mx-auto">
          Sua jornada de alta performance começa agora.
        </p>

        {/* Card de Informação */}
        <div className="w-full bg-white border border-stone-100 rounded-xl p-6 md:p-8 mb-8 md:mb-10 shadow-sm flex items-start space-x-4 text-left">
          <div className="p-2 bg-stone-50 rounded-full shrink-0">
            <Mail className="w-5 h-5 text-stone-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-[#082f1e] mb-2">Próximos Passos</h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              Enviamos uma confirmação com os detalhes de rastreamento para o seu e-mail.
            </p>
            <p className="text-xs text-stone-500 mt-3 font-medium">
              Verifique sua caixa de entrada
            </p>
          </div>
        </div>

        {/* Ações */}
        <div className="space-y-4 w-full max-w-sm">
          <Link href="/" className="block w-full">
            <button className="w-full py-4 md:py-5 border border-[#082f1e] text-[#082f1e] bg-transparent hover:bg-[#082f1e] hover:text-white transition-all duration-300 rounded-sm uppercase tracking-widest text-xs font-medium flex items-center justify-center gap-2 group">
              Continuar Comprando
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
          
          {/* Link para criar conta (Estratégia Guest Checkout) */}
          <div className="pt-6 text-xs text-stone-400 max-w-sm mx-auto">
            Ainda não tem conta?{' '}
            <Link href="/register" className="text-[#082f1e] underline underline-offset-4 hover:opacity-80 transition-opacity">
              Crie sua senha
            </Link>{' '}
            com o mesmo e-mail para acompanhar este pedido.
          </div>

          {/* Link para Concierge (Opcional) */}
          <div className="pt-2">
            <Link 
              href="https://wa.me/5511999999999" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-stone-500 hover:text-[#082f1e] transition-colors underline underline-offset-4"
            >
              Precisa de ajuda? Fale com o Concierge
            </Link>
          </div>
        </div>

        {/* Session ID (Debug - apenas em desenvolvimento) */}
        {process.env.NODE_ENV === 'development' && sessionId && (
          <div className="mt-8 pt-6 border-t border-stone-200">
            <p className="text-xs text-stone-400 font-mono">
              Session ID: {sessionId.substring(0, 20)}...
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
        <div className="text-stone-400 text-sm animate-pulse">Carregando confirmação...</div>
      </main>
    }>
      <SuccessContent />
    </Suspense>
  );
}