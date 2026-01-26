"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import ComingSoon from "@/components/ComingSoon";
import LoteZeroSplitScreen from "@/components/LoteZeroSplitScreen";
import LoteZeroSkeleton from "@/components/LoteZeroSkeleton";

export default function LoteZeroPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [checkingSalesOpen, setCheckingSalesOpen] = useState(true);
  const [salesOpen, setSalesOpen] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyVip, setAlreadyVip] = useState(false);

  // Handlers para o formulário Split Screen
  const handleSuccess = () => {
    setSubmitted(true);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  // Esconder o Footer nesta página (landing page focada em conversão)
  useEffect(() => {
    // Aguardar um pouco para garantir que o Footer foi renderizado
    const timer = setTimeout(() => {
      const footer = document.querySelector(".lote-zero-footer") as HTMLElement;
      if (footer) {
        footer.style.display = "none";
      }
    }, 0);

    return () => {
      clearTimeout(timer);
      const footer = document.querySelector(".lote-zero-footer") as HTMLElement;
      if (footer) {
        footer.style.display = "";
      }
    };
  }, []);

  // Verificar se as vendas estão abertas
  useEffect(() => {
    async function checkSalesOpen() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("app_config")
          .select("value")
          .eq("key", "sales_open")
          .single();

        if (error) {
          // Se a tabela não existir, assume vendas fechadas (modo seguro)
          console.warn("Erro ao verificar sales_open:", error);
          setSalesOpen(false);
        } else if (data) {
          // O valor está em JSONB, pode ser boolean, string "true"/"false", etc
          const value = data.value;
          // Converter para boolean de forma segura
          if (typeof value === "boolean") {
            setSalesOpen(value);
          } else if (typeof value === "string") {
            setSalesOpen(value.toLowerCase() === "true");
          } else {
            setSalesOpen(false); // Modo seguro: se não conseguir interpretar, fecha
          }
        } else {
          setSalesOpen(false); // Se não encontrar, assume fechado
        }
      } catch (err) {
        console.error("Erro ao verificar sales_open:", err);
        setSalesOpen(false); // Em caso de erro, assume fechado (modo seguro)
      } finally {
        setCheckingSalesOpen(false);
      }
    }
    checkSalesOpen();
  }, []);

  // Verificar se usuário está logado (apenas se as vendas estiverem abertas)
  useEffect(() => {
    if (!salesOpen) return; // Não verifica auth se vendas estiverem fechadas

    async function checkAuth() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setUser(user);
          setEmail(user.email || "");

          // Verificar se já está na lista VIP
          try {
            const { data: vipData } = await supabase
              .from("vip_list")
              .select("*")
              .eq("user_id", user.id)
              .single();

            if (vipData) {
              setAlreadyVip(true);
              setSubmitted(true);
            }
          } catch {
            // Tabela não existe ou não está na lista - continua normalmente
          }

          // Buscar nome do perfil
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .single();

          if (profileData?.full_name) {
            setName(profileData.full_name);
          } else if (user.user_metadata?.full_name) {
            setName(user.user_metadata.full_name);
          }
        }
      } catch (err) {
        console.error("Erro ao verificar autenticação:", err);
      } finally {
        setCheckingAuth(false);
      }
    }
    checkAuth();
  }, [salesOpen]);

  // Verificando se as vendas estão abertas
  if (checkingSalesOpen) {
    return <LoteZeroSkeleton />;
  }

  // Se as vendas não estiverem abertas, mostrar Coming Soon
  if (!salesOpen) {
    return <ComingSoon />;
  }

  // Loading state (apenas se vendas estiverem abertas)
  if (checkingAuth) {
    return <LoteZeroSkeleton />;
  }

  // Estado de sucesso
  if (submitted) {
    return (
      <main className="min-h-screen bg-brand-offwhite flex items-center justify-center px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <svg
              className="w-16 h-16 mx-auto text-brand-green"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-light uppercase tracking-tighter mb-6 text-brand-softblack">
            {alreadyVip
              ? "Você já está na lista VIP!"
              : "Inscrição Confirmada!"}
          </h1>
          <p className="text-brand-softblack/70 text-base font-light leading-relaxed mb-4">
            {alreadyVip
              ? "Você já estava na lista VIP do Lote Zero. Fique atento ao seu e-mail para receber as novidades!"
              : "Parabéns! Você foi adicionado à lista VIP do Lote Zero. Fique atento ao seu e-mail para receber as novidades exclusivas!"}
          </p>
          {!user && (
            <div className="mb-8 p-4 bg-brand-green/10 border border-brand-green/30 rounded-sm max-w-md mx-auto">
              <p className="text-brand-softblack/70 text-sm font-light leading-relaxed mb-3">
                💡 <strong>Dica:</strong> Crie uma conta para acompanhar seu
                pedido e ter acesso exclusivo a futuros lançamentos.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <a
                  href="/register"
                  className="inline-block bg-brand-green text-brand-offwhite px-6 py-2 text-[10px] uppercase tracking-widest hover:bg-brand-green/90 transition-all font-medium"
                >
                  Criar Conta
                </a>
                <a
                  href="/login"
                  className="inline-block border border-brand-softblack px-6 py-2 text-[10px] uppercase tracking-widest text-brand-softblack hover:bg-brand-softblack hover:text-brand-offwhite transition-all font-medium"
                >
                  Fazer Login
                </a>
              </div>
            </div>
          )}
          <div className="flex gap-4 justify-center flex-wrap">
            <a
              href="/"
              className="inline-block border border-brand-softblack px-10 py-4 text-[10px] uppercase tracking-widest text-brand-softblack hover:bg-brand-softblack hover:text-brand-offwhite transition-all font-medium"
            >
              Explorar Produtos
            </a>
          </div>
        </div>
      </main>
    );
  }

  // Renderizar Split Screen quando vendas estiverem abertas
  return (
    <LoteZeroSplitScreen
      user={user}
      email={email}
      name={name}
      onEmailChange={setEmail}
      onNameChange={setName}
      onSuccess={handleSuccess}
      onError={handleError}
      loading={loading}
      setLoading={setLoading}
      error={error}
    />
  );
}
