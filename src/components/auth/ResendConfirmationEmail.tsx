"use client";

import { useState, useEffect } from "react";
import { resendConfirmationEmail } from "@/utils/auth";

interface ResendConfirmationEmailProps {
  email: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export default function ResendConfirmationEmail({
  email,
  onSuccess,
  onError,
  className = "",
}: ResendConfirmationEmailProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resetar loading quando o componente é montado novamente ou quando o usuário volta
  useEffect(() => {
    // Resetar ao montar (caso o usuário tenha voltado)
    setLoading(false);

    // Resetar quando o usuário usa o botão voltar do navegador
    const handlePopState = () => {
      setLoading(false);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleResend = async () => {
    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      const result = await resendConfirmationEmail(email);

      if (result.success) {
        setSuccess(true);
        setError(null);
        onSuccess?.();
        // Esconder mensagem após 8 segundos
        setTimeout(() => setSuccess(false), 8000);
      } else {
        const errorMsg = result.error || "Erro ao reenviar email";
        setError(errorMsg);
        onError?.(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err?.message || "Erro ao reenviar email";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div
        className={`mt-4 p-4 bg-brand-green/10 border border-brand-green/30 text-brand-green text-sm rounded-sm ${className}`}
      >
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
          <div className="flex-1">
            <p className="font-medium mb-1">Email reenviado com sucesso!</p>
            <p className="text-xs opacity-80">
              Verifique sua caixa de entrada e spam. O email pode levar alguns
              minutos para chegar.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-sm ${className}`}
    >
      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
          {error}
        </div>
      )}
      <div className="flex items-start gap-3">
        <svg
          className="w-5 h-5 flex-shrink-0 mt-0.5 text-yellow-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
        <div className="flex-1">
          <p className="text-sm text-yellow-800 mb-2 font-medium">
            Confirme seu email para fazer login
          </p>
          <p className="text-xs text-yellow-700 mb-3">
            Não recebeu o email? Verifique sua caixa de entrada e spam, ou
            solicite um novo email de confirmação.
          </p>
          <button
            type="button"
            onClick={handleResend}
            disabled={loading}
            className="text-xs uppercase tracking-widest text-yellow-800 hover:text-yellow-900 underline font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-3 w-3"
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
                Enviando...
              </span>
            ) : (
              "Reenviar email de confirmação"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
