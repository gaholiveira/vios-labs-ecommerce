"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { formatDatabaseError, logDatabaseError } from "@/utils/errorHandler";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Verificar search params apenas no cliente
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("registered") === "true") {
        setSuccess(true);
        setSuccessMessage("Conta criada com sucesso! Verifique seu e-mail para confirmar.");
        // Remove o parâmetro da URL após alguns segundos
        setTimeout(() => {
          router.replace("/login");
        }, 5000);
      }
      if (params.get("password-reset") === "true") {
        setSuccess(true);
        setSuccessMessage("Senha redefinida com sucesso! Você já pode fazer login.");
        // Remove o parâmetro da URL após alguns segundos
        setTimeout(() => {
          router.replace("/login");
        }, 5000);
      }
      if (params.get("error")) {
        const errorMsg = params.get("message") || params.get("error");
        setError(errorMsg || "Erro de autenticação");
      }
      const redirect = params.get("redirect");
      if (redirect) {
        // Salvar redirect para usar após login
        sessionStorage.setItem("redirect", redirect);
      }
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        logDatabaseError('Login', authError);
        const errorMessage = formatDatabaseError(authError);
        setError(errorMessage);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Verificar se há redirect salvo
        const redirect = sessionStorage.getItem("redirect");
        if (redirect) {
          sessionStorage.removeItem("redirect");
          router.push(redirect);
        } else {
          router.push("/");
        }
        router.refresh();
      }
    } catch (err) {
      logDatabaseError('Exceção ao fazer login', err);
      const errorMessage = formatDatabaseError(err);
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-offwhite flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white p-12 shadow-sm border border-gray-100">
        <h2 className="text-2xl font-light uppercase tracking-[0.3em] text-center mb-12 text-brand-softblack">
          Entrar
        </h2>

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
                {successMessage || "Conta criada com sucesso! Verifique seu e-mail para confirmar."}
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-600 text-sm text-center rounded-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="text-[10px] uppercase tracking-widest block mb-2 opacity-50">
              E-mail
            </label>
            <input
              type="email"
              className="w-full bg-transparent border-b border-gray-300 py-2 focus:border-brand-green outline-none transition text-brand-softblack"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest block mb-2 opacity-50">
              Palavra-passe
            </label>
            <input
              type="password"
              className="w-full bg-transparent border-b border-gray-300 py-2 focus:border-brand-green outline-none transition text-brand-softblack"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            disabled={loading}
            className="w-full bg-brand-green text-brand-offwhite py-4 uppercase text-[10px] tracking-[0.2em] mt-8 hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "A carregar..." : "Acessar à conta"}
          </button>
        </form>

        <div className="mt-8 text-center space-y-3">
          <Link
            href="/forgot-password"
            className="block text-[10px] uppercase tracking-widest opacity-60 text-brand-softblack hover:opacity-100 transition-opacity"
          >
            Esqueci minha senha
          </Link>
          <div>
            <p className="text-[10px] uppercase tracking-widest opacity-60 text-brand-softblack">
              Ainda não tem conta?
            </p>
            <Link
              href="/register"
              className="inline-block mt-2 text-[10px] uppercase tracking-widest font-bold border-b border-brand-green pb-1 hover:text-brand-green transition-colors"
            >
              Criar conta agora
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
