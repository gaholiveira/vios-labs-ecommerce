"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  userId?: string;
}

export default function WaitlistModal({
  isOpen,
  onClose,
  productId,
  productName,
  userId,
}: WaitlistModalProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  // Resetar loading quando o componente é montado novamente ou quando o usuário volta
  useEffect(() => {
    // Resetar ao montar (caso o usuário tenha voltado)
    setIsSubmitting(false);

    // Resetar quando o usuário usa o botão voltar do navegador
    const handlePopState = () => {
      setIsSubmitting(false);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/waitlist/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: productId,
          email: email.toLowerCase().trim(),
          user_id: userId || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao adicionar à lista de espera");
      }

      setIsSuccess(true);
      setEmail("");

      // Fechar modal após 3 segundos
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error("Error adding to waitlist:", err);
      setError(
        err.message || "Erro ao processar sua solicitação. Tente novamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-sm shadow-2xl">
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          {!isSuccess ? (
            <>
              {/* Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-light uppercase tracking-wider text-brand-softblack mb-2">
                  Produto Esgotado
                </h2>
                <p className="text-sm text-gray-600 font-light leading-relaxed">
                  <span className="font-medium">{productName}</span> está
                  temporariamente indisponível. Deixe seu email e avisaremos
                  assim que voltar ao estoque.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="waitlist-email"
                    className="block text-xs uppercase tracking-wider text-gray-600 mb-2 font-medium"
                  >
                    Email
                  </label>
                  <input
                    id="waitlist-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-brand-green transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-sm">
                    <p className="text-xs text-red-700">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !email}
                  className="w-full bg-brand-green text-brand-offwhite px-6 py-3 rounded-sm uppercase tracking-wider text-xs font-medium hover:bg-brand-softblack transition-all duration-300 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Cadastrando..." : "Notifique-me"}
                </button>
              </form>

              {/* Disclaimer */}
              <p className="mt-4 text-xs text-gray-400 text-center">
                Seus dados serão usados apenas para notificá-lo sobre a
                disponibilidade deste produto.
              </p>
            </>
          ) : (
            /* Success State */
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-light uppercase tracking-wider text-brand-softblack mb-2">
                Tudo Pronto!
              </h3>
              <p className="text-sm text-gray-600 font-light">
                Você receberá um email assim que{" "}
                <span className="font-medium">{productName}</span> voltar ao
                estoque.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
