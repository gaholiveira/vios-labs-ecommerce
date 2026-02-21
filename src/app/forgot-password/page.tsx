"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { requestPasswordReset } from "@/actions/reset-password-action";
import Link from "next/link";
import { Mail } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    // Verificar se há erro na URL (vindo do callback ou home page)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const errorParam = params.get("error");
      if (errorParam) {
        const decodedError = decodeURIComponent(errorParam);
        setError(decodedError);
        // Limpar a URL após capturar o erro
        window.history.replaceState({}, "", "/forgot-password");
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const result = await requestPasswordReset(email.trim());

    if (result.success) {
      setSuccess(true);
      showToast("Senha temporária enviada! Verifique seu e-mail e faça login.");
    } else {
      setError(result.error ?? "Não foi possível processar. Tente novamente.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-brand-offwhite flex items-center justify-center px-6 py-24">
      <div className="max-w-md w-full">
        <AnimatePresence mode="wait">
          {!success ? (
            // Formulário de Solicitação
            <motion.div
              key="form"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header */}
              <div className="text-center mb-12">
                <h1 className="text-3xl md:text-4xl font-light uppercase tracking-widest mb-4 text-brand-softblack">
                  Recuperar Acesso
                </h1>
                <p className="text-sm font-light text-brand-softblack/60 leading-relaxed">
                  Digite seu e-mail para receber uma senha temporária. Faça login
                  e altere-a em Perfil.
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
                  {/* E-mail */}
                  <div>
                    <label
                      htmlFor="email"
                      className="text-[10px] uppercase tracking-widest block mb-3 opacity-70 font-medium text-brand-softblack"
                    >
                      E-mail
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError(null);
                      }}
                      className={`w-full bg-transparent border-b py-3 focus:outline-none transition text-brand-softblack placeholder:text-gray-400 font-light ${
                        error
                          ? "border-red-400 focus:border-red-500"
                          : "border-gray-300 focus:border-brand-green"
                      }`}
                      placeholder="seu@email.com"
                      required
                      autoComplete="email"
                    />
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
                        <span>A enviar...</span>
                      </span>
                    ) : (
                      "Enviar Senha Temporária"
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
              {/* Ícone de E-mail */}
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
                <Mail
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
                E-mail Enviado
              </motion.h2>

              {/* Mensagem */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-sm font-light text-brand-softblack/70 leading-relaxed mb-8"
              >
                Enviamos uma senha temporária para{" "}
                <span className="font-medium text-brand-softblack">
                  {email}
                </span>
                . Faça login e altere sua senha em Perfil.
                <br />
                <span className="text-xs text-brand-softblack/50 mt-2 block">
                  Não recebeu? Verifique sua pasta de spam.
                </span>
              </motion.p>

              {/* Ações */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col gap-4"
              >
                <button
                  onClick={() => {
                    setSuccess(false);
                    setEmail("");
                  }}
                  className="text-brand-softblack text-xs uppercase tracking-[0.2em] font-medium border-b border-brand-softblack/30 hover:border-brand-green hover:text-brand-green transition-colors pb-1"
                >
                  Enviar Novamente
                </button>
                <Link
                  href="/login"
                  className="text-brand-softblack text-xs uppercase tracking-[0.2em] font-medium border-b border-brand-softblack/30 hover:border-brand-green hover:text-brand-green transition-colors pb-1"
                >
                  Voltar para o Login
                </Link>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
