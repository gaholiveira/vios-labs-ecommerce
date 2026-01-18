"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { formatDatabaseError, logDatabaseError } from "@/utils/errorHandler";
import { useMobileViewportHeight } from "@/hooks/useMobileViewportHeight";

export default function LoteZeroPage() {
  const viewportHeight = useMobileViewportHeight();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyVip, setAlreadyVip] = useState(false);
  const router = useRouter();

  // Verificar se usuário está logado
  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
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
          } catch (vipErr) {
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
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Se usuário já está logado, apenas adicionar à lista VIP
      if (user) {
        // Adicionar à lista VIP
        try {
          const { error: vipError } = await supabase
            .from("vip_list")
            .upsert({
              email: user.email,
              user_id: user.id,
              full_name: name || user.user_metadata?.full_name || "",
              created_at: new Date().toISOString(),
            }, {
              onConflict: "user_id"
            });

          if (vipError && !vipError.message.includes("duplicate") && !vipError.message.includes("relation")) {
            logDatabaseError('Inserção na lista VIP (usuário logado)', vipError);
          } else {
            setAlreadyVip(true);
            setSubmitted(true);
            setLoading(false);
            return;
          }
        } catch (vipErr) {
          console.log("Tabela vip_list não encontrada (opcional)");
        }

        // Se chegou aqui, apenas confirma sucesso
        setSubmitted(true);
        setLoading(false);
        return;
      }

      // Se não está logado, criar conta
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: name,
            vip_list: true,
          },
        },
      });

      if (authError) {
        logDatabaseError('Criação de usuário (Auth - Lote Zero)', authError);
        const errorMessage = formatDatabaseError(authError);
        setError(errorMessage);
        setLoading(false);
        return;
      }

      // Verificar se o usuário foi criado
      if (!authData.user) {
        setError('Não foi possível criar a conta. Tente novamente.');
        setLoading(false);
        return;
      }

      // Criar/atualizar perfil
      // O trigger do banco cria o perfil automaticamente, mas vamos garantir que os dados estejam completos
      if (authData.user) {
        // Aguardar um pouco para o trigger do banco processar
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({
            id: authData.user.id,
            full_name: name.trim(),
            address_country: "Brasil",
            updated_at: new Date().toISOString(),
          }, {
            onConflict: "id"
          });

        if (profileError) {
          logDatabaseError('Atualização de perfil (Lote Zero)', profileError);
          // Não bloqueia o processo, mas mostra aviso
          const errorMessage = formatDatabaseError(profileError);
          setError(`Aviso: ${errorMessage}. O perfil será atualizado quando você acessar sua conta.`);
        }

        // Adicionar à lista VIP
        try {
          const { error: vipError } = await supabase
            .from("vip_list")
            .upsert({
              email: email,
              user_id: authData.user.id,
              full_name: name,
              created_at: new Date().toISOString(),
            }, {
              onConflict: "user_id"
            });

          if (vipError && !vipError.message.includes("duplicate") && !vipError.message.includes("relation")) {
            logDatabaseError('Inserção na lista VIP (novo usuário)', vipError);
          }
        } catch (vipErr) {
          console.log("Tabela vip_list não encontrada (opcional)");
        }
      }

      setLoading(false);
      setSubmitted(true);
    } catch (err) {
      logDatabaseError('Exceção ao processar inscrição (Lote Zero)', err);
      const errorMessage = formatDatabaseError(err);
      setError(errorMessage);
      setLoading(false);
    }
  };

  // Loading state
  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-brand-offwhite flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 mx-auto text-brand-softblack mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-[10px] uppercase tracking-wider text-brand-softblack/60">A verificar...</p>
        </div>
      </main>
    );
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
            {user ? (alreadyVip ? "Você já está na lista VIP!" : "Você está na lista VIP!") : "Conta Criada com Sucesso!"}
          </h1>
          <p className="text-brand-softblack/70 text-base font-light leading-relaxed mb-4">
            {user 
              ? (alreadyVip 
                  ? "Você já estava na lista VIP do Lote Zero. Fique atento ao seu e-mail para receber as novidades!"
                  : "Você foi adicionado à lista VIP do Lote Zero. Fique atento ao seu e-mail!")
              : "Você está na lista VIP do Lote Zero e sua conta foi criada."
            }
          </p>
          {!user && (
            <p className="text-brand-softblack/60 text-sm font-light leading-relaxed mb-8">
              Verifique seu e-mail para confirmar sua conta e começar a comprar.
            </p>
          )}
          <div className="flex gap-4 justify-center flex-wrap">
            <a
              href="/"
              className="inline-block border border-brand-softblack px-10 py-4 text-[10px] uppercase tracking-widest text-brand-softblack hover:bg-brand-softblack hover:text-brand-offwhite transition-all font-medium"
            >
              Explorar Produtos
            </a>
            {!user && (
              <a
                href="/login"
                className="inline-block bg-brand-green text-brand-offwhite px-10 py-4 text-[10px] uppercase tracking-widest hover:bg-brand-green/90 transition-all font-medium"
              >
                Fazer Login
              </a>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-brand-offwhite">
      {/* Hero Section */}
      <section 
        className="relative w-full flex items-center justify-center overflow-hidden bg-brand-softblack"
        style={{ 
          height: viewportHeight ? `${viewportHeight}px` : '100svh' 
        }}
      >
        <div className="absolute inset-0 transform-gpu will-change-transform">
          <Image
            src="/images/hero-foto.jpg"
            alt="Lote Zero VIP"
            fill
            priority
            quality={85}
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>

        <div className="absolute inset-0 bg-black/40 z-[1]" />

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <span className="uppercase tracking-[0.5em] text-[10px] mb-4 block text-brand-offwhite opacity-80">
            Acesso Exclusivo
          </span>
          <h1 className="text-5xl md:text-7xl font-extralight mb-6 uppercase tracking-tighter text-brand-offwhite">
            Lote Zero
          </h1>
          <p className="text-brand-offwhite/90 text-lg md:text-xl font-light tracking-wide mb-8 max-w-2xl mx-auto">
            Seja o primeiro a ter acesso aos nossos produtos com condições especiais de lançamento
          </p>
          <div className="flex items-center justify-center gap-2 text-brand-offwhite/80 text-sm font-light">
            <svg
              className="w-5 h-5 text-brand-green"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Edição Limitada</span>
            <span className="mx-2">•</span>
            <span>Preço Especial</span>
            <span className="mx-2">•</span>
            <span>Entrega Prioritária</span>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
          <svg
            className="w-6 h-6 text-brand-offwhite/60"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </section>

      {/* Benefícios */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <span className="text-brand-green uppercase tracking-[0.4em] text-[10px] font-semibold mb-6 block">
            Por que se inscrever?
          </span>
          <h2 className="text-brand-softblack text-3xl md:text-4xl font-light uppercase tracking-tighter leading-tight mb-8">
            Vantagens Exclusivas
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          <div className="text-center">
            <div className="mb-6 text-brand-green">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-12 h-12 mx-auto"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-brand-softblack text-lg font-medium uppercase tracking-[0.2em] mb-4">
              Preço Especial
            </h3>
            <p className="text-brand-softblack/60 text-sm font-light leading-relaxed">
              Acesso ao melhor preço de lançamento, exclusivo para membros da lista VIP
            </p>
          </div>

          <div className="text-center">
            <div className="mb-6 text-brand-green">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-12 h-12 mx-auto"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
            </div>
            <h3 className="text-brand-softblack text-lg font-medium uppercase tracking-[0.2em] mb-4">
              Acesso Prioritário
            </h3>
            <p className="text-brand-softblack/60 text-sm font-light leading-relaxed">
              Seja notificado primeiro quando o Lote Zero estiver disponível
            </p>
          </div>

          <div className="text-center">
            <div className="mb-6 text-brand-green">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-12 h-12 mx-auto"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
            </div>
            <h3 className="text-brand-softblack text-lg font-medium uppercase tracking-[0.2em] mb-4">
              Garantia de Qualidade
            </h3>
            <p className="text-brand-softblack/60 text-sm font-light leading-relaxed">
              Produtos testados e aprovados, com garantia de satisfação
            </p>
          </div>
        </div>

        {/* Social Proof */}
        <div className="bg-white py-12 px-8 border border-brand-softblack/10">
          <div className="flex items-center justify-center gap-8 flex-wrap">
            <div className="text-center">
              <p className="text-3xl font-light text-brand-softblack mb-2">500+</p>
              <p className="text-[10px] uppercase tracking-wider text-brand-softblack/50">
                Já Inscritos
              </p>
            </div>
            <div className="h-12 w-px bg-brand-softblack/20"></div>
            <div className="text-center">
              <p className="text-3xl font-light text-brand-softblack mb-2">24h</p>
              <p className="text-[10px] uppercase tracking-wider text-brand-softblack/50">
                Para o Lançamento
              </p>
            </div>
            <div className="h-12 w-px bg-brand-softblack/20"></div>
            <div className="text-center">
              <p className="text-3xl font-light text-brand-softblack mb-2">50</p>
              <p className="text-[10px] uppercase tracking-wider text-brand-softblack/50">
                Unidades Restantes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Formulário de Inscrição */}
      <section className="bg-brand-softblack py-24 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-brand-offwhite text-3xl md:text-4xl font-light uppercase tracking-tighter leading-tight mb-6">
              {user ? "Garanta seu Acesso VIP" : "Crie sua Conta e Garanta Acesso VIP"}
            </h2>
            <p className="text-brand-offwhite/70 text-base font-light leading-relaxed">
              {user 
                ? "Confirme sua entrada na lista VIP do Lote Zero"
                : "Crie sua conta agora e tenha acesso prioritário ao Lote Zero"
              }
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 text-red-200 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {user && (
              <div className="mb-6 p-4 bg-brand-green/10 border border-brand-green/30 rounded-sm">
                <p className="text-brand-offwhite text-sm text-center">
                  Você está logado como <span className="font-medium">{user.email}</span>
                </p>
              </div>
            )}

            <div>
              <label className="text-[10px] uppercase tracking-widest block mb-3 text-brand-offwhite/80">
                Nome Completo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-transparent border-b border-brand-offwhite/30 py-3 focus:border-brand-green outline-none transition text-brand-offwhite placeholder:text-brand-offwhite/40"
                placeholder="Seu nome completo"
                required
              />
            </div>

            {!user && (
              <>
                <div>
                  <label className="text-[10px] uppercase tracking-widest block mb-3 text-brand-offwhite/80">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent border-b border-brand-offwhite/30 py-3 focus:border-brand-green outline-none transition text-brand-offwhite placeholder:text-brand-offwhite/40"
                    placeholder="seu@email.com"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest block mb-3 text-brand-offwhite/80">
                    Palavra-passe
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent border-b border-brand-offwhite/30 py-3 focus:border-brand-green outline-none transition text-brand-offwhite placeholder:text-brand-offwhite/40"
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                    required
                  />
                  <p className="text-[9px] text-brand-offwhite/50 mt-2">
                    Sua senha deve ter pelo menos 6 caracteres
                  </p>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-green text-brand-offwhite py-4 uppercase text-[10px] tracking-[0.2em] mt-8 hover:bg-brand-green/90 transition disabled:opacity-50 font-medium"
            >
              {loading 
                ? (user ? "A adicionar à lista VIP..." : "A criar conta...") 
                : (user ? "Confirmar Entrada na Lista VIP" : "Criar Conta e Garantir Acesso VIP")
              }
            </button>

            <p className="text-center text-[9px] uppercase tracking-wider text-brand-offwhite/50 mt-6">
              {user 
                ? "Ao confirmar, você será adicionado à lista VIP do Lote Zero"
                : "Ao criar sua conta, você automaticamente entra na lista VIP do Lote Zero"
              }
            </p>

            {!user && (
              <div className="pt-6 border-t border-brand-offwhite/10">
                <p className="text-center text-[10px] uppercase tracking-wider text-brand-offwhite/60 mb-3">
                  Já tem conta?
                </p>
                <a
                  href="/login"
                  className="block text-center text-brand-offwhite text-sm font-light hover:text-brand-green transition underline"
                >
                  Fazer Login
                </a>
              </div>
            )}
          </form>
        </div>
      </section>

      {/* Urgência */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="bg-brand-green/10 border border-brand-green/20 p-8 text-center">
          <p className="text-brand-softblack text-sm md:text-base font-light leading-relaxed mb-4">
            <span className="font-medium">Lembre-se:</span> O Lote Zero é uma edição limitada.
            As vagas são preenchidas por ordem de inscrição.
          </p>
          <p className="text-brand-softblack/60 text-xs uppercase tracking-wider">
            Não perca esta oportunidade exclusiva
          </p>
        </div>
      </section>
    </main>
  );
}
