"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import ComingSoon from "@/components/ComingSoon";
import LoteZeroSplitScreen from "@/components/LoteZeroSplitScreen";
import TextReveal from "@/components/ui/text-reveal";

export default function LoteZeroPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [salesOpen, setSalesOpen] = useState<boolean | null>(null);
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
      const footer = document.querySelector('.lote-zero-footer') as HTMLElement;
      if (footer) {
        footer.style.display = 'none';
      }
    }, 0);

    return () => {
      clearTimeout(timer);
      const footer = document.querySelector('.lote-zero-footer') as HTMLElement;
      if (footer) {
        footer.style.display = '';
      }
    };
  }, []);

  // Verificar tudo em paralelo: vendas abertas + auth
  useEffect(() => {
    async function initializePage() {
      const supabase = createClient();
      
      try {
        // Executar verificações em paralelo
        const [salesResult, authResult] = await Promise.all([
          // 1. Verificar se vendas estão abertas
          supabase.from('app_config').select('value').eq('key', 'sales_open').single(),
          // 2. Verificar autenticação
          supabase.auth.getUser()
        ]);

        // Processar resultado de vendas
        let isSalesOpen = false;
        if (!salesResult.error && salesResult.data) {
          const value = salesResult.data.value;
          if (typeof value === 'boolean') {
            isSalesOpen = value;
          } else if (typeof value === 'string') {
            isSalesOpen = value.toLowerCase() === 'true';
          }
        }
        setSalesOpen(isSalesOpen);

        // Se vendas não estão abertas, não precisa continuar
        if (!isSalesOpen) {
          setInitialLoading(false);
          return;
        }

        // Processar resultado de auth
        const currentUser = authResult.data?.user;
        if (currentUser) {
          setUser(currentUser);
          setEmail(currentUser.email || "");

          // Buscar dados adicionais em paralelo
          const [vipResult, profileResult] = await Promise.all([
            supabase.from("vip_list").select("*").eq("user_id", currentUser.id).single(),
            supabase.from("profiles").select("full_name").eq("id", currentUser.id).single()
          ]);

          // Verificar VIP
          if (vipResult.data && !vipResult.error) {
            setAlreadyVip(true);
          }

          // Buscar nome
          if (profileResult.data?.full_name) {
            setName(profileResult.data.full_name);
          } else if (currentUser.user_metadata?.full_name) {
            setName(currentUser.user_metadata.full_name);
          }
        }
      } catch (err) {
        console.error("Erro ao inicializar página:", err);
        setSalesOpen(false);
      } finally {
        setInitialLoading(false);
      }
    }

    initializePage();
  }, []);

  // Loading inicial - tela única sem piscada
  if (initialLoading) {
    return (
      <main className="min-h-screen bg-brand-green flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <svg className="animate-spin h-8 w-8 mx-auto text-brand-offwhite mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-[10px] uppercase tracking-wider text-brand-offwhite/60">Carregando...</p>
        </motion.div>
      </main>
    );
  }

  // Se as vendas não estiverem abertas, mostrar Coming Soon
  if (!salesOpen) {
    return <ComingSoon />;
  }

  // Estado de sucesso
  if (submitted) {
    return (
      <main className="min-h-screen bg-brand-offwhite flex items-center justify-center px-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center"
        >
          {/* Ícone animado de sucesso */}
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 200 }}
            className="mb-8"
          >
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
          </motion.div>
          
          {/* Título com TextReveal */}
          <TextReveal
            text={alreadyVip ? "Você já está na lista VIP!" : "Inscrição Confirmada!"}
            el="h1"
            className="text-3xl md:text-4xl font-light uppercase tracking-tighter mb-6 text-brand-softblack"
            delay={0.3}
            duration={0.6}
          />
          
          {/* Instrução sobre o Grupo VIP */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mb-6"
          >
            <p className="text-brand-softblack/80 text-base font-light leading-relaxed mb-4 text-center max-w-md mx-auto">
              Junte-se ao nosso grupo exclusivo no WhatsApp para receber atualizações em tempo real, participar de discussões e ter acesso prioritário a novos lançamentos.
            </p>
          </motion.div>
          
          {/* Botão Principal: Acessar Grupo VIP - High-end e intuitivo */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mb-8"
          >
            <motion.a
              href="https://chat.whatsapp.com/CvWE3TkcMgpGot3wkEtMhJ"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center justify-center gap-3 bg-brand-green text-brand-offwhite px-10 py-4 text-[10px] uppercase tracking-[0.2em] hover:bg-brand-softblack transition-all duration-300 font-medium shadow-sm hover:shadow-md group"
            >
              <svg
                className="w-5 h-5 transition-transform group-hover:scale-110"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              <span>Entrar no Grupo VIP</span>
            </motion.a>
          </motion.div>
          
          {/* Link discreto de Login/Criar Conta para usuários não logados */}
          {!user && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1 }}
              className="mb-8 text-center"
            >
              <p className="text-xs sm:text-sm text-stone-400">
                Já faz parte da Vios?{' '}
                <a href="/login" className="font-medium text-stone-600 hover:text-brand-green transition-colors underline">
                  Faça Login
                </a>
                {' ou '}
                <a href="/register" className="font-medium text-stone-600 hover:text-brand-green transition-colors underline">
                  crie uma conta
                </a>
                {' para acompanhar seu pedido.'}
              </p>
            </motion.div>
          )}
          
          {/* Botão Secundário: Explorar Produtos */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.1 }}
            className="flex justify-center"
          >
            <motion.a
              href="/"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-block border border-brand-softblack px-10 py-4 text-[10px] uppercase tracking-[0.2em] text-brand-softblack hover:bg-brand-softblack hover:text-brand-offwhite transition-all duration-300 font-medium"
            >
              Explorar Produtos
            </motion.a>
          </motion.div>
        </motion.div>
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
