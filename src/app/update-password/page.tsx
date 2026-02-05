"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { formatDatabaseError, logDatabaseError } from "@/utils/errorHandler";
import Link from "next/link";
import { Lock, CheckCircle2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import AuthPageSkeleton from "@/components/ui/AuthPageSkeleton";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const { showToast } = useCart();

  // Resetar loading quando o componente é montado novamente ou quando o usuário volta
  useEffect(() => {
    // Resetar ao montar (caso o usuário tenha voltado)
    setLoading(false);

    // Resetar quando o usuário usa o botão voltar do navegador
    const handlePopState = () => {
      setLoading(false);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    // Verificar se o usuário tem uma sessão válida de recovery
    async function checkSession() {
      try {
        const supabase = createClient();

        // Aguardar um momento para garantir que cookies foram propagados
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Tentar múltiplas vezes (sessão pode demorar para propagar)
        let attempts = 0;
        const maxAttempts = 3;
        let sessionFound = false;

        while (attempts < maxAttempts && !sessionFound) {
          // Verificar sessão atual
          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.getSession();

          if (sessionError) {
            if (process.env.NODE_ENV === "development") {
              console.error(
                `❌ Erro ao verificar sessão (tentativa ${attempts + 1}):`,
                sessionError,
              );
            }
            attempts++;
            if (attempts < maxAttempts) {
              await new Promise((resolve) => setTimeout(resolve, 500));
              continue;
            }
            setError("Sessão inválida. Solicite um novo link de redefinição.");
            setCheckingSession(false);
            return;
          }

          if (session) {
            // Verificar se o usuário existe
            const {
              data: { user },
              error: userError,
            } = await supabase.auth.getUser();

            if (userError || !user) {
              if (process.env.NODE_ENV === "development") {
                console.error("❌ Erro ao verificar usuário:", userError);
              }
              setError(
                "Usuário não encontrado. Solicite um novo link de redefinição.",
              );
              setCheckingSession(false);
              return;
            }

            // Sessão válida - usuário pode prosseguir
            if (process.env.NODE_ENV === "development") {
              console.log(
                "✅ Sessão válida encontrada para recovery (tentativa",
                attempts + 1,
                ")",
              );
            }
            setHasValidSession(true);
            setCheckingSession(false);
            sessionFound = true;
            return;
          }

          attempts++;
          if (attempts < maxAttempts) {
            if (process.env.NODE_ENV === "development") {
              console.log(
                `⚠️ Sessão não encontrada (tentativa ${attempts}), tentando novamente...`,
              );
            }
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }

        // Se chegou aqui, não encontrou sessão após todas as tentativas
        if (process.env.NODE_ENV === "development") {
          console.error(
            "❌ Nenhuma sessão encontrada após",
            maxAttempts,
            "tentativas",
          );
        }
        setError(
          "Link inválido ou expirado. Solicite um novo link de redefinição.",
        );
        setCheckingSession(false);
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error("❌ Exceção ao verificar sessão:", err);
        }
        setError(
          "Erro ao verificar autenticação. Solicite um novo link de redefinição.",
        );
        setCheckingSession(false);
      }
    }
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validações
    if (!password) {
      setError("Senha é obrigatória");
      return;
    }

    if (password.length < 8) {
      setError("Senha deve ter pelo menos 8 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        logDatabaseError("Atualização de senha", updateError);
        const errorMessage = formatDatabaseError(updateError);
        setError(errorMessage);
        setLoading(false);
        return;
      }

      // Sucesso
      setSuccess(true);
      setLoading(false);
      showToast("Senha atualizada com sucesso! Você já pode fazer login.");

      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        router.push("/login?password-reset=true");
      }, 2000);
    } catch (err) {
      logDatabaseError("Exceção ao atualizar senha", err);
      const errorMessage = formatDatabaseError(err);
      setError(errorMessage);
      setLoading(false);
    }
  };

  // Loading state enquanto verifica sessão
  if (checkingSession) {
    return <AuthPageSkeleton />;
  }

  // Erro de sessão inválida
  if (!hasValidSession && error) {
    return (
      <div className="min-h-screen bg-brand-offwhite flex items-center justify-center px-6 py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="max-w-md w-full bg-white p-8 md:p-12 shadow-sm border border-gray-100 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 0.2,
              type: "spring",
              stiffness: 200,
              damping: 15,
            }}
            className="flex justify-center mb-8"
          >
            <Lock className="w-20 h-20 text-red-500" strokeWidth={1.5} />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl md:text-3xl font-light uppercase tracking-widest mb-6 text-brand-softblack"
          >
            Link Inválido
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-sm font-light text-brand-softblack/70 leading-relaxed mb-8"
          >
            {error}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col gap-4"
          >
            <Link
              href="/forgot-password"
              className="w-full bg-brand-green text-brand-offwhite py-4 uppercase text-xs tracking-[0.2em] hover:bg-brand-softblack transition-all duration-500 font-medium text-center"
            >
              Solicitar Novo Link
            </Link>
            <Link
              href="/login"
              className="text-brand-softblack text-xs uppercase tracking-[0.2em] font-medium border-b border-brand-softblack/30 hover:border-brand-green hover:text-brand-green transition-colors pb-1 text-center"
            >
              Voltar para o Login
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-offwhite flex items-center justify-center px-6 py-24">
      <div className="max-w-md w-full">
        <AnimatePresence mode="wait">
          {!success ? (
            // Formulário de Nova Senha
            <motion.div
              key="form"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header */}
              <div className="text-center mb-12">
                <h1 className="text-3xl md:text-4xl font-light uppercase tracking-widest mb-4 text-brand-softblack">
                  Nova Senha
                </h1>
                <p className="text-sm font-light text-brand-softblack/60 leading-relaxed">
                  Digite sua nova senha para continuar.
                </p>
              </div>

              {/* Formulário */}
              <div className="bg-white p-8 md:p-12 shadow-sm border border-gray-100">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-600 text-sm text-center rounded-sm"
                  >
                    {error}
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Nova Senha */}
                  <div>
                    <label
                      htmlFor="password"
                      className="text-[10px] uppercase tracking-widest block mb-3 opacity-70 font-medium text-brand-softblack"
                    >
                      Nova Senha
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (error) setError(null);
                        }}
                        className={`w-full bg-transparent border-b py-3 pr-12 focus:outline-none transition text-brand-softblack placeholder:text-gray-400 font-light font-mono ${
                          error
                            ? "border-red-400 focus:border-red-500"
                            : "border-gray-300 focus:border-brand-green"
                        }`}
                        placeholder="Mínimo 8 caracteres"
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-brand-softblack transition"
                        aria-label={
                          showPassword ? "Ocultar senha" : "Mostrar senha"
                        }
                      >
                        {showPassword ? (
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.242 4.242L9.88 9.88"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirmar Senha */}
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="text-[10px] uppercase tracking-widest block mb-3 opacity-70 font-medium text-brand-softblack"
                    >
                      Confirmar Senha
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (error) setError(null);
                        }}
                        className={`w-full bg-transparent border-b py-3 pr-12 focus:outline-none transition text-brand-softblack placeholder:text-gray-400 font-light font-mono ${
                          error
                            ? "border-red-400 focus:border-red-500"
                            : "border-gray-300 focus:border-brand-green"
                        }`}
                        placeholder="Digite a senha novamente"
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-brand-softblack transition"
                        aria-label={
                          showConfirmPassword
                            ? "Ocultar senha"
                            : "Mostrar senha"
                        }
                      >
                        {showConfirmPassword ? (
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.242 4.242L9.88 9.88"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Botão de Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brand-green text-brand-offwhite py-4 uppercase text-xs tracking-[0.2em] mt-8 hover:bg-brand-softblack transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="animate-spin h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        <span>A salvar...</span>
                      </span>
                    ) : (
                      "Salvar Nova Senha"
                    )}
                  </button>
                </form>

                {/* Link para Login */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <Link
                    href="/login"
                    className="block text-center text-[10px] uppercase tracking-widest opacity-60 text-brand-softblack hover:text-brand-green transition-colors"
                  >
                    ← Voltar para o login
                  </Link>
                </div>
              </div>
            </motion.div>
          ) : (
            // Estado de Sucesso
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="bg-white p-8 md:p-12 shadow-sm border border-gray-100 text-center"
            >
              {/* Ícone de Sucesso */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  delay: 0.2,
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                }}
                className="flex justify-center mb-8"
              >
                <CheckCircle2
                  className="w-20 h-20 text-brand-green"
                  strokeWidth={1.5}
                />
              </motion.div>

              {/* Título */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl md:text-3xl font-light uppercase tracking-widest mb-6 text-brand-softblack"
              >
                Senha Atualizada
              </motion.h2>

              {/* Mensagem */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-sm font-light text-brand-softblack/70 leading-relaxed mb-8"
              >
                Sua senha foi atualizada com sucesso.
                <br />
                Redirecionando para o login...
              </motion.p>

              {/* Ação */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Link
                  href="/login"
                  className="inline-block text-brand-softblack text-xs uppercase tracking-[0.2em] font-medium border-b border-brand-softblack/30 hover:border-brand-green hover:text-brand-green transition-colors pb-1"
                >
                  Ir para o Login →
                </Link>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
