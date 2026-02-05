"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { formatDatabaseError, logDatabaseError } from "@/utils/errorHandler";
import { formatPhone } from "@/utils/format";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";

interface LoteZeroSalesFormProps {
  user: User | null;
  email: string;
  name: string;
  onEmailChange: (email: string) => void;
  onNameChange: (name: string) => void;
  onSuccess: () => void;
  onError: (error: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  error?: string | null;
}

export default function LoteZeroSalesForm({
  user,
  email: initialEmail,
  name: initialName,
  onEmailChange,
  onNameChange,
  onSuccess,
  onError,
  loading,
  setLoading,
  error,
}: LoteZeroSalesFormProps) {
  const [localEmail, setLocalEmail] = useState(initialEmail);
  const [localName, setLocalName] = useState(initialName);
  const [whatsapp, setWhatsapp] = useState("");
  const [isVip, setIsVip] = useState(false);
  const [checkingVip, setCheckingVip] = useState(false);

  // Sincronizar com props quando mudarem (ex: quando user for detectado)
  useEffect(() => {
    if (initialEmail) setLocalEmail(initialEmail);
    if (initialName) setLocalName(initialName);
  }, [initialEmail, initialName]);

  // Verificar se usuário logado está na lista VIP
  useEffect(() => {
    async function checkVipStatus() {
      if (!user) {
        setIsVip(false);
        return;
      }

      setCheckingVip(true);
      try {
        const supabase = createClient();
        const { data: vipData, error: vipError } = await supabase
          .from("vip_list")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (vipData && !vipError) {
          setIsVip(true);
        } else {
          setIsVip(false);
        }
      } catch (err) {
        console.error("[LOTE ZERO] Erro ao verificar status VIP:", err);
        setIsVip(false);
      } finally {
        setCheckingVip(false);
      }
    }

    checkVipStatus();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    onError("");

    // Validações básicas
    if (!localName.trim()) {
      onError("Nome completo é obrigatório");
      setLoading(false);
      return;
    }

    if (
      !localEmail.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(localEmail.trim())
    ) {
      onError("Email válido é obrigatório");
      setLoading(false);
      return;
    }

    try {
      const emailTrimmed = localEmail.trim().toLowerCase();
      const fullNameTrimmed = localName.trim();
      // Remove formatação do telefone antes de enviar (apenas números)
      const phoneTrimmed = whatsapp.trim() ? whatsapp.replace(/\D/g, '') : null;

      // ========================================================================
      // USAR API ROUTE SERVER-SIDE PARA GARANTIR INSERÇÃO
      // A API route usa service role key e contorna políticas RLS
      // ========================================================================

      if (process.env.NODE_ENV === 'development') {
        console.log("[LOTE ZERO] Enviando dados para API:", {
          email: emailTrimmed,
          user_id: user?.id || null,
          full_name: fullNameTrimmed,
          phone: phoneTrimmed,
        });
      }

      const response = await fetch("/api/vip-list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailTrimmed,
          user_id: user?.id || null,
          full_name: fullNameTrimmed,
          phone: phoneTrimmed,
        }),
      });

      // Verificar se a resposta é JSON válido
      let result;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        try {
          result = await response.json();
        } catch (jsonError) {
          console.error(
            "[LOTE ZERO] Erro ao parsear JSON da resposta:",
            jsonError,
          );
          const text = await response.text();
          console.error("[LOTE ZERO] Resposta da API (texto):", text);
          onError("Erro ao processar resposta do servidor. Tente novamente.");
          setLoading(false);
          return;
        }
      } else {
        // Se não for JSON, tentar ler como texto
        const text = await response.text();
        console.error("[LOTE ZERO] Resposta não é JSON:", text);
        onError("Erro ao processar resposta do servidor. Tente novamente.");
        setLoading(false);
        return;
      }

      // Verificar se houve erro
      if (!response.ok) {
        console.error("[LOTE ZERO] Erro da API:", {
          status: response.status,
          statusText: response.statusText,
          result,
        });
        onError(
          result?.error ||
            `Erro ${response.status}: ${response.statusText || "Erro ao processar sua inscrição. Tente novamente."}`,
        );
        setLoading(false);
        return;
      }

      // Log do resultado para debugging (apenas em desenvolvimento)
      if (process.env.NODE_ENV === 'development') {
        console.log("[LOTE ZERO] Resposta da API:", {
          ok: response.ok,
          status: response.status,
          result,
          hasSuccess: "success" in (result || {}),
          successValue: result?.success,
        });
      }

      // Verificar se result existe e não está vazio
      if (
        !result ||
        typeof result !== "object" ||
        Object.keys(result).length === 0
      ) {
        console.error("[LOTE ZERO] Resultado vazio ou inválido:", result);
        onError("Resposta inválida do servidor. Tente novamente.");
        setLoading(false);
        return;
      }

      // Verificar se result.success existe e é true
      if (result.success !== true) {
        console.error("[LOTE ZERO] API retornou sucesso=false:", result);
        onError(
          result?.error || "Erro ao processar sua inscrição. Tente novamente.",
        );
        setLoading(false);
        return;
      }

      // Se usuário está logado, também atualizar perfil
      if (user) {
        const supabase = createClient();
        if (localName.trim() || whatsapp.trim()) {
          const { error: profileError } = await supabase
            .from("profiles")
            .upsert(
              {
                id: user.id,
                full_name: fullNameTrimmed || undefined,
                phone: phoneTrimmed || undefined,
                email: emailTrimmed,
                updated_at: new Date().toISOString(),
              },
              {
                onConflict: "id",
              },
            );

          if (profileError) {
            console.warn(
              "[LOTE ZERO] Aviso ao atualizar perfil:",
              profileError,
            );
            // Não bloquear o sucesso se o perfil falhar
          }
        }
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(
          "[LOTE ZERO] ✅ Dados salvos na VIP list com sucesso!",
          result.data,
        );
      }
      onSuccess();
      setLoading(false);
    } catch (err) {
      console.error("[LOTE ZERO] Exceção não tratada:", err);
      logDatabaseError("Exceção ao processar inscrição (Lote Zero)", err);
      const errorMessage = err instanceof Error ? err.message : "Erro inesperado. Tente novamente.";
      onError(errorMessage);
      setLoading(false);
    }
  };

  // Loading state enquanto verifica status VIP
  if (checkingVip) {
    return (
      <div className="min-h-full bg-stone-50 flex flex-col items-center justify-center px-6 py-12 md:py-24">
        <div className="w-full max-w-md space-y-8">
          {/* Skeleton do título */}
          <div className="space-y-4 text-center">
            <div className="h-8 w-48 bg-stone-200 rounded-sm mx-auto animate-pulse" />
            <div className="h-4 w-64 bg-stone-200/60 rounded-sm mx-auto animate-pulse" />
          </div>

          {/* Skeleton do formulário */}
          <div className="space-y-6">
            {/* Campo Nome */}
            <div className="space-y-2">
              <div className="h-3 w-16 bg-stone-200/60 rounded-sm animate-pulse" />
              <div className="h-12 w-full bg-stone-200 rounded-sm animate-pulse" />
            </div>

            {/* Campo Email */}
            <div className="space-y-2">
              <div className="h-3 w-20 bg-stone-200/60 rounded-sm animate-pulse" />
              <div className="h-12 w-full bg-stone-200 rounded-sm animate-pulse" />
            </div>

            {/* Botão */}
            <div className="h-12 w-full bg-stone-200 rounded-sm animate-pulse" />
          </div>

          {/* Skeleton de informações adicionais */}
          <div className="space-y-4 pt-8">
            <div className="h-px w-full bg-stone-200" />
            <div className="space-y-2">
              <div className="h-3 w-full bg-stone-200/60 rounded-sm animate-pulse" />
              <div className="h-3 w-3/4 bg-stone-200/60 rounded-sm animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Se usuário está logado e já está na lista VIP, mostrar card de status
  if (user && isVip) {
    return (
      <div className="min-h-full bg-stone-50">
        <div className="p-6 sm:p-8 md:p-12 lg:p-24 max-w-2xl mx-auto pb-16 sm:pb-20 md:pb-24">
          {/* Logo VIOS pequena no topo */}
          <div className="mb-6 sm:mb-8 md:mb-12">
            <h2 className="text-[9px] sm:text-[10px] uppercase tracking-[0.4em] sm:tracking-[0.5em] text-brand-gold font-light">
              VIOS
            </h2>
          </div>

          {/* Card de Status VIP */}
          <div className="mb-8 sm:mb-12">
            <div className="bg-white border border-brand-green/20 rounded-sm p-6 sm:p-8 shadow-sm">
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-brand-green/10 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-brand-green"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                    />
                  </svg>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-light uppercase tracking-tighter mb-3 sm:mb-4 text-brand-softblack text-center">
                  Olá, {localName || user.email?.split("@")[0] || "Membro VIP"}.
                </h1>
                <p className="text-xs sm:text-sm md:text-base font-light text-brand-softblack/70 leading-relaxed text-center mb-6">
                  Você já está na lista prioritária.
                </p>
              </div>

              <a
                href="https://chat.whatsapp.com/CvWE3TkcMgpGot3wkEtMhJ"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-brand-green text-brand-offwhite py-3 sm:py-4 uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[11px] sm:text-xs font-medium hover:bg-brand-softblack transition-all duration-300 flex items-center justify-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                Acessar Grupo VIP
              </a>
            </div>
          </div>

          {/* Elementos de Confiança */}
          <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8 pb-8 sm:pb-12 md:pb-16 border-t border-gray-200">
            <div className="flex items-start gap-2 sm:gap-3">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-brand-green shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
              <p className="text-xs sm:text-sm font-light text-brand-softblack/70 leading-relaxed">
                Envio Prioritário
              </p>
            </div>

            <div className="flex items-start gap-2 sm:gap-3">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-brand-green shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
              <p className="text-xs sm:text-sm font-light text-brand-softblack/70 leading-relaxed">
                Embalagem de Colecionador
              </p>
            </div>

            <div className="flex items-start gap-2 sm:gap-3">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-brand-green shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
              <p className="text-xs sm:text-sm font-light text-brand-softblack/70 leading-relaxed">
                Acesso vitalício à comunidade VIOS
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-stone-50">
      <div className="p-6 sm:p-8 md:p-12 lg:p-24 max-w-2xl mx-auto pb-16 sm:pb-20 md:pb-24">
        {/* Logo VIOS pequena no topo */}
        <div className="mb-6 sm:mb-8 md:mb-12">
          <h2 className="text-[9px] sm:text-[10px] uppercase tracking-[0.4em] sm:tracking-[0.5em] text-brand-gold font-light">
            VIOS
          </h2>
        </div>

        {/* Header */}
        <div className="mb-6 sm:mb-8 md:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-light uppercase tracking-tighter mb-3 sm:mb-4 text-brand-softblack">
            Inicie sua Jornada.
          </h1>
          <p className="text-xs sm:text-sm md:text-base font-light text-brand-softblack/70 leading-relaxed">
            Preencha seus dados para garantir acesso exclusivo a esta edição
            limitada.
          </p>
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div className="mb-6 sm:mb-8 p-3 sm:p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs sm:text-sm">
            {error}
          </div>
        )}

        {/* Info se usuário está logado */}
        {user && (
          <div className="mb-6 p-3 sm:p-4 bg-brand-green/10 border border-brand-green/20 rounded-sm">
            <p className="text-xs sm:text-sm text-brand-softblack/80">
              Logado como:{" "}
              <span className="font-medium break-all">{user.email}</span>
            </p>
            <p className="text-[10px] sm:text-xs text-brand-softblack/60 mt-1">
              Você pode editar seus dados abaixo ou{" "}
              <Link
                href="/profile"
                className="underline hover:text-brand-green transition-colors"
              >
                atualizar seu perfil
              </Link>
            </p>
          </div>
        )}

        {/* Formulário */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6 sm:space-y-8 mb-8 sm:mb-12"
        >
          {/* Nome Completo */}
          <div>
            <label className="text-[9px] sm:text-[10px] uppercase tracking-widest block mb-2 sm:mb-3 text-brand-gold font-light">
              Nome Completo
            </label>
            <input
              type="text"
              value={localName}
              onChange={(e) => {
                setLocalName(e.target.value);
                onNameChange(e.target.value);
              }}
              className="w-full bg-transparent border-0 border-b border-gray-300 pb-2 sm:pb-3 focus:border-black outline-none transition-colors font-mono text-sm sm:text-base text-brand-softblack placeholder:text-gray-400"
              placeholder="Seu nome completo"
              required
            />
          </div>

          {/* E-mail */}
          <div>
            <label className="text-[9px] sm:text-[10px] uppercase tracking-widest block mb-2 sm:mb-3 text-brand-gold font-light">
              E-mail
            </label>
            <input
              type="email"
              value={localEmail}
              onChange={(e) => {
                setLocalEmail(e.target.value);
                onEmailChange(e.target.value);
              }}
              disabled={!!user} // Desabilitar se estiver logado
              className={`w-full bg-transparent border-0 border-b border-gray-300 pb-2 sm:pb-3 focus:border-black outline-none transition-colors font-mono text-sm sm:text-base text-brand-softblack placeholder:text-gray-400 ${
                user ? "opacity-70 cursor-not-allowed" : ""
              }`}
              placeholder="seu@email.com"
              required
            />
            {user && (
              <p className="text-[10px] text-brand-softblack/50 mt-1">
                O email não pode ser alterado enquanto estiver logado
              </p>
            )}
          </div>

          {/* WhatsApp */}
          <div>
            <label className="text-[9px] sm:text-[10px] uppercase tracking-widest block mb-2 sm:mb-3 text-brand-gold font-light">
              WhatsApp (Opcional)
            </label>
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => {
                const formatted = formatPhone(e.target.value);
                setWhatsapp(formatted);
              }}
              className="w-full bg-transparent border-0 border-b border-gray-300 pb-2 sm:pb-3 focus:border-black outline-none transition-colors font-mono text-sm sm:text-base text-brand-softblack placeholder:text-gray-400"
              placeholder="(11) 99999-9999"
            />
            <p className="text-[10px] text-brand-softblack/50 mt-1">
              Para receber atualizações exclusivas sobre o Lote Zero
            </p>
          </div>

          {/* Botão de Ação */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-green text-brand-offwhite py-3 sm:py-4 uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[11px] sm:text-xs font-medium hover:bg-brand-softblack transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-6 sm:mt-8"
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
                Processando...
              </span>
            ) : (
              "Garantir Meu Acesso"
            )}
          </button>

          {/* Link de Login e Criar Conta - Apenas para usuários não logados */}
          {!user && (
            <div className="mt-4 text-center">
              <p className="text-xs sm:text-sm text-stone-400">
                Já faz parte da Vios?{" "}
                <Link
                  href="/login"
                  className="font-medium text-stone-600 hover:text-brand-green transition-colors underline"
                >
                  Faça Login
                </Link>
                {" ou "}
                <Link
                  href="/register"
                  className="font-medium text-stone-600 hover:text-brand-green transition-colors underline"
                >
                  crie uma conta
                </Link>
                {" para acompanhar seu pedido e ter acesso exclusivo a futuros lançamentos."}
              </p>
            </div>
          )}
        </form>

        {/* Elementos de Confiança */}
        <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8 pb-8 sm:pb-12 md:pb-16 border-t border-gray-200">
          <div className="flex items-start gap-2 sm:gap-3">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-brand-green shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
            <p className="text-xs sm:text-sm font-light text-brand-softblack/70 leading-relaxed">
              Envio Prioritário
            </p>
          </div>

          <div className="flex items-start gap-2 sm:gap-3">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-brand-green shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
            <p className="text-xs sm:text-sm font-light text-brand-softblack/70 leading-relaxed">
              Embalagem de Colecionador
            </p>
          </div>

          <div className="flex items-start gap-2 sm:gap-3">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-brand-green shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
            <p className="text-xs sm:text-sm font-light text-brand-softblack/70 leading-relaxed">
              Acesso vitalício à comunidade VIOS
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
