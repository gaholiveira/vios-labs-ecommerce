'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { formatDatabaseError, logDatabaseError } from '@/utils/errorHandler';
import Link from 'next/link';

interface LoteZeroSalesFormProps {
  user: any;
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
  const [whatsapp, setWhatsapp] = useState('');

  // Sincronizar com props quando mudarem (ex: quando user for detectado)
  useEffect(() => {
    if (initialEmail) setLocalEmail(initialEmail);
    if (initialName) setLocalName(initialName);
  }, [initialEmail, initialName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    onError(null as any);

    // Validações básicas
    if (!localName.trim()) {
      onError('Nome completo é obrigatório');
      setLoading(false);
      return;
    }

    if (!localEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(localEmail.trim())) {
      onError('Email válido é obrigatório');
      setLoading(false);
      return;
    }

    try {
      const emailTrimmed = localEmail.trim().toLowerCase();
      const fullNameTrimmed = localName.trim();
      const phoneTrimmed = whatsapp.trim() || null;

      // ========================================================================
      // USAR API ROUTE SERVER-SIDE PARA GARANTIR INSERÇÃO
      // A API route usa service role key e contorna políticas RLS
      // ========================================================================

      console.log('[LOTE ZERO] Enviando dados para API:', {
        email: emailTrimmed,
        user_id: user?.id || null,
        full_name: fullNameTrimmed,
        phone: phoneTrimmed,
      });

      const response = await fetch('/api/vip-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        try {
          result = await response.json();
        } catch (jsonError) {
          console.error('[LOTE ZERO] Erro ao parsear JSON da resposta:', jsonError);
          const text = await response.text();
          console.error('[LOTE ZERO] Resposta da API (texto):', text);
          onError('Erro ao processar resposta do servidor. Tente novamente.');
          setLoading(false);
          return;
        }
      } else {
        // Se não for JSON, tentar ler como texto
        const text = await response.text();
        console.error('[LOTE ZERO] Resposta não é JSON:', text);
        onError('Erro ao processar resposta do servidor. Tente novamente.');
        setLoading(false);
        return;
      }

      // Verificar se houve erro
      if (!response.ok) {
        console.error('[LOTE ZERO] Erro da API:', {
          status: response.status,
          statusText: response.statusText,
          result,
        });
        onError(result?.error || `Erro ${response.status}: ${response.statusText || 'Erro ao processar sua inscrição. Tente novamente.'}`);
        setLoading(false);
        return;
      }

      // Log do resultado para debugging
      console.log('[LOTE ZERO] Resposta da API:', {
        ok: response.ok,
        status: response.status,
        result,
        hasSuccess: 'success' in (result || {}),
        successValue: result?.success,
      });

      // Verificar se result existe e não está vazio
      if (!result || typeof result !== 'object' || Object.keys(result).length === 0) {
        console.error('[LOTE ZERO] Resultado vazio ou inválido:', result);
        onError('Resposta inválida do servidor. Tente novamente.');
        setLoading(false);
        return;
      }

      // Verificar se result.success existe e é true
      if (result.success !== true) {
        console.error('[LOTE ZERO] API retornou sucesso=false:', result);
        onError(result?.error || 'Erro ao processar sua inscrição. Tente novamente.');
        setLoading(false);
        return;
      }

      // Se usuário está logado, também atualizar perfil
      if (user) {
        const supabase = createClient();
        if (localName.trim() || whatsapp.trim()) {
          const { error: profileError } = await supabase
            .from("profiles")
            .upsert({
              id: user.id,
              full_name: fullNameTrimmed || undefined,
              phone: phoneTrimmed || undefined,
              email: emailTrimmed,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: "id"
            });

          if (profileError) {
            console.warn('[LOTE ZERO] Aviso ao atualizar perfil:', profileError);
            // Não bloquear o sucesso se o perfil falhar
          }
        }
      }

      console.log('[LOTE ZERO] ✅ Dados salvos na VIP list com sucesso!', result.data);
      onSuccess();
      setLoading(false);
    } catch (err: any) {
      console.error('[LOTE ZERO] Exceção não tratada:', err);
      logDatabaseError('Exceção ao processar inscrição (Lote Zero)', err);
      onError(err?.message || 'Erro inesperado. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.4 }}
      className="min-h-full bg-stone-50"
    >
      <div className="p-6 sm:p-8 md:p-12 lg:p-24 max-w-2xl mx-auto pb-16 sm:pb-20 md:pb-24">
        {/* Logo VIOS pequena no topo */}
        <div className="mb-6 sm:mb-8 md:mb-12">
          <h2 className="text-[9px] sm:text-[10px] uppercase tracking-[0.4em] sm:tracking-[0.5em] text-brand-softblack font-light">
            VIOS
          </h2>
        </div>

        {/* Header */}
        <div className="mb-6 sm:mb-8 md:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-light uppercase tracking-tighter mb-3 sm:mb-4 text-brand-softblack">
            Inicie sua Jornada.
          </h1>
          <p className="text-xs sm:text-sm md:text-base font-light text-brand-softblack/70 leading-relaxed">
            Preencha seus dados para garantir acesso exclusivo ao primeiro lote de produção.
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
              Logado como: <span className="font-medium break-all">{user.email}</span>
            </p>
            <p className="text-[10px] sm:text-xs text-brand-softblack/60 mt-1">
              Você pode editar seus dados abaixo ou{' '}
              <Link href="/profile" className="underline hover:text-brand-green transition-colors">
                atualizar seu perfil
              </Link>
            </p>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 mb-8 sm:mb-12">
          {/* Nome Completo */}
          <div>
            <label className="text-[9px] sm:text-[10px] uppercase tracking-widest block mb-2 sm:mb-3 text-brand-softblack/60 font-light">
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
            <label className="text-[9px] sm:text-[10px] uppercase tracking-widest block mb-2 sm:mb-3 text-brand-softblack/60 font-light">
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
                user ? 'opacity-70 cursor-not-allowed' : ''
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
            <label className="text-[9px] sm:text-[10px] uppercase tracking-widest block mb-2 sm:mb-3 text-brand-softblack/60 font-light">
              WhatsApp (Opcional)
            </label>
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full bg-transparent border-0 border-b border-gray-300 pb-2 sm:pb-3 focus:border-black outline-none transition-colors font-mono text-sm sm:text-base text-brand-softblack placeholder:text-gray-400"
              placeholder="+55 11 99999-9999"
            />
            <p className="text-[10px] text-brand-softblack/50 mt-1">
              Para receber atualizações exclusivas sobre o Lote Zero
            </p>
          </div>

          {/* Botão de Ação */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-softblack text-brand-offwhite py-3 sm:py-4 uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[11px] sm:text-xs font-medium hover:bg-brand-softblack/90 active:bg-brand-softblack/80 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-6 sm:mt-8"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processando...
              </span>
            ) : (
              'Garantir Meu Acesso'
            )}
          </button>
        </form>

        {/* Mensagem para usuários não logados */}
        {!user && (
          <div className="mb-8 p-4 bg-brand-green/5 border border-brand-green/20 rounded-sm">
            <p className="text-xs sm:text-sm text-brand-softblack/70 mb-2">
              💡 <strong>Dica:</strong> Crie uma conta para acompanhar seu pedido e ter acesso exclusivo a futuros lançamentos.
            </p>
            <Link
              href="/register"
              className="text-[10px] sm:text-xs uppercase tracking-widest text-brand-green hover:underline font-medium"
            >
              Criar conta →
            </Link>
          </div>
        )}

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
    </motion.div>
  );
}
