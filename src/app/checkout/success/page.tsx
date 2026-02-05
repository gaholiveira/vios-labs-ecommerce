"use client";

import { useEffect, Suspense, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Mail, ArrowRight, Package, Loader2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { createClient } from "@/utils/supabase/client";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId =
    searchParams.get("order_id") ??
    searchParams.get("session_id") ??
    searchParams.get("payment_intent");
  const { clearCart } = useCart();
  const [orderStatus, setOrderStatus] = useState<
    "checking" | "found" | "not_found" | "error"
  >("checking");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const attemptsRef = useRef(0);

  // Limpar carrinho
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  // Verificar se usuário está logado
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsUserLoggedIn(!!user);
    };
    checkAuth();
  }, []);

  // Verificar se pedido foi criado
  useEffect(() => {
    if (!sessionId) {
      setOrderStatus("error");
      return;
    }

    const maxAttempts = 15; // 15 tentativas = 30 segundos (2s cada)
    attemptsRef.current = 0;
    let isCancelled = false;

    const checkOrder = async () => {
      if (isCancelled) return;

      attemptsRef.current++;

      try {
        const response = await fetch(
          `/api/orders/verify?session_id=${sessionId}`,
        );
        const data = await response.json();

        if (isCancelled) return;

        if (data.exists) {
          setOrderStatus("found");
          setOrderId(data.orderId);
          if (pollingRef.current) {
            clearTimeout(pollingRef.current);
            pollingRef.current = null;
          }
        } else if (attemptsRef.current < maxAttempts) {
          // Tentar novamente após 2 segundos
          pollingRef.current = setTimeout(() => {
            checkOrder();
          }, 2000);
        } else {
          // Timeout após maxAttempts
          setOrderStatus("not_found");
          pollingRef.current = null;
        }
      } catch (error) {
        if (isCancelled) return;

        console.error("Erro ao verificar pedido:", error);
        if (attemptsRef.current < maxAttempts) {
          // Tentar novamente após 2 segundos
          pollingRef.current = setTimeout(() => {
            checkOrder();
          }, 2000);
        } else {
          setOrderStatus("error");
          pollingRef.current = null;
        }
      }
    };

    // Primeira verificação imediata
    checkOrder();

    // Cleanup
    return () => {
      isCancelled = true;
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [sessionId]);

  return (
    <main className="min-h-screen bg-[#faf9f6] flex items-center justify-center px-4 md:px-6 py-24 md:py-32">
      <div className="flex flex-col items-center text-center max-w-lg w-full mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Ícone de Sucesso */}
        <div className="mb-8 md:mb-10 relative">
          <div className="absolute inset-0 bg-[#082f1e]/10 rounded-full blur-xl animate-pulse" />
          <div className="relative w-24 h-24 md:w-28 md:h-28 bg-white border border-[#082f1e]/10 rounded-full flex items-center justify-center shadow-sm">
            <Check
              className="w-10 h-10 md:w-12 md:h-12 text-[#082f1e]"
              strokeWidth={1.5}
            />
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
            <h3 className="text-sm font-medium text-[#082f1e] mb-2">
              Próximos Passos
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              Enviamos uma confirmação com os detalhes de rastreamento para o
              seu e-mail.
            </p>
            <p className="text-xs text-stone-500 mt-3 font-medium">
              Verifique sua caixa de entrada
            </p>
          </div>
        </div>

        {/* Status do Pedido */}
        {orderStatus === "checking" && (
          <div className="w-full bg-white border border-stone-100 rounded-xl p-6 md:p-8 mb-6 shadow-sm">
            <div className="flex items-center justify-center gap-3 text-stone-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <p className="text-sm">Processando seu pedido...</p>
            </div>
          </div>
        )}

        {/* Pedido não encontrado após polling (pagamento aprovado, webhook pode atrasar) */}
        {orderStatus === "not_found" && (
          <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-6 md:p-8 mb-6 shadow-sm">
            <p className="text-sm text-amber-800 font-medium mb-2">
              Pagamento aprovado
            </p>
            <p className="text-sm text-amber-700 leading-relaxed">
              Estamos confirmando seu pedido. Você receberá o e-mail de
              confirmação em breve. Se não receber em 24h, entre em contato
              conosco.
            </p>
          </div>
        )}

        {/* Erro ao verificar */}
        {orderStatus === "error" && (
          <div className="w-full bg-red-50 border border-red-200 rounded-xl p-6 md:p-8 mb-6 shadow-sm">
            <p className="text-sm text-red-800 font-medium mb-2">
              Não foi possível verificar o pedido
            </p>
            <p className="text-sm text-red-700 leading-relaxed">
              Seu pagamento foi aprovado. Entre em contato com o suporte
              informando o código da compra para confirmar seu pedido.
            </p>
          </div>
        )}

        {/* Ações */}
        <div className="space-y-4 w-full max-w-sm">
          {/* Botão Ver Meus Pedidos (pedido encontrado; guest também pode ver se tiver link) */}
          {orderStatus === "found" && (
            <Link href="/orders" className="block w-full">
              <button className="w-full py-4 md:py-5 bg-[#082f1e] text-white hover:bg-[#082f1e]/90 transition-all duration-300 rounded-sm uppercase tracking-widest text-xs font-medium flex items-center justify-center gap-2 group">
                <Package className="w-4 h-4" />
                Ver Meus Pedidos
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          )}

          <Link href="/" className="block w-full">
            <button className="w-full py-4 md:py-5 border border-[#082f1e] text-[#082f1e] bg-transparent hover:bg-[#082f1e] hover:text-white transition-all duration-300 rounded-sm uppercase tracking-widest text-xs font-medium flex items-center justify-center gap-2 group">
              Continuar Comprando
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>

          {/* Link para criar conta (Estratégia Guest Checkout) */}
          {!isUserLoggedIn && (
            <div className="pt-6 text-xs text-stone-400 max-w-sm mx-auto">
              Ainda não tem conta?{" "}
              <Link
                href="/register"
                className="text-[#082f1e] underline underline-offset-4 hover:opacity-80 transition-opacity"
              >
                Crie sua senha
              </Link>{" "}
              com o mesmo e-mail para acompanhar este pedido.
            </div>
          )}

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
        {process.env.NODE_ENV === "development" && sessionId && (
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
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
          <div className="text-stone-400 text-sm animate-pulse">
            Carregando confirmação...
          </div>
        </main>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
