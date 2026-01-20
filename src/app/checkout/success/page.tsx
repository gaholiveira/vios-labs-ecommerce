'use client';

import Link from 'next/link';
import { Check, ArrowRight } from 'lucide-react';
import { useEffect } from 'react';
import { useCart } from '@/context/CartContext';

export default function SuccessPage() {
  const { clearCart } = useCart();

  // Limpa o carrinho ao carregar a página de sucesso
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[#fdfbf7] px-6">
      <div className="max-w-md w-full text-center space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
        
        {/* Ícone de Sucesso Animado */}
        <div className="mx-auto w-24 h-24 bg-[#082f1e]/5 rounded-full flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-[#082f1e] rounded-full flex items-center justify-center shadow-xl shadow-[#082f1e]/20">
            <Check className="w-8 h-8 text-[#d4af37]" strokeWidth={3} />
          </div>
        </div>

        {/* Texto Principal */}
        <div className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-display font-medium text-[#082f1e]">
            Ritual Iniciado.
          </h1>
          <p className="text-stone-600 leading-relaxed">
            Seu pedido foi confirmado com sucesso. <br/>
            Enviamos os detalhes e o rastreamento para o seu e-mail.
          </p>
        </div>

        {/* Card de Resumo Visual (Decorativo) */}
        <div className="bg-white p-6 rounded-xl border border-stone-100 shadow-sm text-sm text-stone-500">
          <p>Prepare-se para receber a máxima performance em sua casa.</p>
        </div>

        {/* Botão de Retorno */}
        <div className="pt-4">
          <Link 
            href="/" 
            className="inline-flex items-center justify-center px-8 py-4 bg-white border border-[#082f1e] text-[#082f1e] hover:bg-[#082f1e] hover:text-white transition-all duration-300 rounded-full font-medium group"
          >
            Voltar para a Loja
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
