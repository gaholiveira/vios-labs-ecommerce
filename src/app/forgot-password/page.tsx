"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { formatDatabaseError, logDatabaseError } from "@/utils/errorHandler";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Verificar se há erro na URL (vindo do callback)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const errorParam = params.get("error");
      if (errorParam) {
        setError(decodeURIComponent(errorParam));
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery&next=/reset-password`,
      });

      if (resetError) {
        logDatabaseError('Solicitação de redefinição de senha', resetError);
        const errorMessage = formatDatabaseError(resetError);
        setError(errorMessage);
        setLoading(false);
        return;
      }

      // Sucesso - mostrar mensagem
      setSuccess(true);
      setLoading(false);
    } catch (err) {
      logDatabaseError('Exceção ao solicitar redefinição de senha', err);
      const errorMessage = formatDatabaseError(err);
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-offwhite flex items-center justify-center px-6 pt-24 pb-12">
      <div className="max-w-md w-full bg-white p-12 shadow-sm border border-gray-100">
        <h2 className="text-2xl font-light uppercase tracking-[0.3em] text-center mb-4 text-brand-softblack">
          Redefinir Senha
        </h2>
        
        <p className="text-[10px] uppercase tracking-wider text-center mb-8 opacity-60 text-brand-softblack">
          Digite seu e-mail para receber o link de redefinição
        </p>

        {success && (
          <div className="mb-6 p-4 bg-brand-green/10 border border-brand-green/30 text-brand-green text-sm text-center rounded-sm">
            <div className="flex items-center justify-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>
                Link de redefinição enviado! Verifique seu e-mail.
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-600 text-sm text-center rounded-sm">
            {error}
          </div>
        )}

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-[10px] uppercase tracking-widest block mb-2 opacity-50">
                E-mail <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border-b border-gray-300 py-2 focus:border-brand-green outline-none transition text-brand-softblack"
                placeholder="seu@email.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-green text-brand-offwhite py-4 uppercase text-[10px] tracking-[0.2em] mt-8 hover:opacity-90 transition disabled:opacity-50"
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
                  A enviar...
                </span>
              ) : (
                "Enviar Link de Redefinição"
              )}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <p className="text-sm text-brand-softblack/70">
              Enviamos um e-mail para <strong>{email}</strong> com instruções para redefinir sua senha.
            </p>
            <p className="text-xs text-brand-softblack/50">
              Não recebeu o e-mail? Verifique sua caixa de spam ou tente novamente.
            </p>
          </div>
        )}

        <div className="mt-8 text-center space-y-3">
          <Link
            href="/login"
            className="block text-[10px] uppercase tracking-widest opacity-60 text-brand-softblack hover:opacity-100 transition-opacity"
          >
            ← Voltar para o login
          </Link>
          <p className="text-[10px] uppercase tracking-widest opacity-60 text-brand-softblack">
            Ainda não tem conta?{" "}
            <Link
              href="/register"
              className="font-bold border-b border-brand-green pb-1 hover:text-brand-green transition-colors"
            >
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
