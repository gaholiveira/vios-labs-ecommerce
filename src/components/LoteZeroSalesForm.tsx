'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { formatDatabaseError, logDatabaseError } from '@/utils/errorHandler';

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
  email,
  name,
  onEmailChange,
  onNameChange,
  onSuccess,
  onError,
  loading,
  setLoading,
  error,
}: LoteZeroSalesFormProps) {
  const [password, setPassword] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    onError(null as any);

    try {
      const supabase = createClient();

      // ========================================================================
      // CENÁRIO 1: USUÁRIO JÁ ESTÁ LOGADO
      // ========================================================================
      if (user) {
        console.log('[LOTE ZERO] Usuário logado, adicionando à VIP list:', user.id);

        // Atualizar perfil primeiro
        if (name) {
          const { error: profileError } = await supabase
            .from("profiles")
            .upsert({
              id: user.id,
              full_name: name.trim(),
              email: user.email,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: "id"
            });

          if (profileError) {
            console.warn('[LOTE ZERO] Erro ao atualizar perfil:', profileError);
          }
        }

        // Adicionar à lista VIP (upsert para evitar duplicatas)
        const { error: vipError } = await supabase
          .from("vip_list")
          .upsert({
            email: user.email,
            user_id: user.id,
            full_name: name?.trim() || user.user_metadata?.full_name || null,
          }, {
            onConflict: "user_id"
          });

        if (vipError) {
          console.error('[LOTE ZERO] Erro ao adicionar à VIP list:', vipError);
          logDatabaseError('Inserção na lista VIP (usuário logado)', vipError);
          onError('Erro ao processar sua inscrição. Tente novamente.');
          setLoading(false);
          return;
        }

        console.log('[LOTE ZERO] ✅ Usuário adicionado à VIP list com sucesso!');
        onSuccess();
        setLoading(false);
        return;
      }

      // ========================================================================
      // CENÁRIO 2: USUÁRIO NÃO ESTÁ LOGADO - CRIAR CONTA E ADICIONAR À VIP
      // ========================================================================
      console.log('[LOTE ZERO] Criando nova conta para:', email);

      // 1. Criar conta no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: name.trim(),
            phone: whatsapp || null,
            vip_list: true,
          },
        },
      });

      if (authError) {
        console.error('[LOTE ZERO] Erro ao criar conta:', authError);
        logDatabaseError('Criação de usuário (Auth - Lote Zero)', authError);
        
        // Mensagens de erro mais amigáveis
        if (authError.message.includes('already registered')) {
          onError('Este email já está cadastrado. Faça login para continuar.');
        } else if (authError.message.includes('Password')) {
          onError('A senha deve ter no mínimo 6 caracteres.');
        } else {
          onError(formatDatabaseError(authError));
        }
        
        setLoading(false);
        return;
      }

      if (!authData.user) {
        console.error('[LOTE ZERO] Nenhum usuário retornado após signUp');
        onError('Não foi possível criar a conta. Tente novamente.');
        setLoading(false);
        return;
      }

      console.log('[LOTE ZERO] ✅ Conta criada com sucesso! User ID:', authData.user.id);

      // 2. Aguardar um momento para garantir que o Auth processou
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 3. Criar perfil
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: authData.user.id,
          full_name: name.trim(),
          email: email.trim().toLowerCase(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "id"
        });

      if (profileError) {
        console.warn('[LOTE ZERO] Aviso ao criar perfil:', profileError);
        logDatabaseError('Criação de perfil (Lote Zero)', profileError);
        // Não bloquear o fluxo se o perfil falhar
      } else {
        console.log('[LOTE ZERO] ✅ Perfil criado com sucesso!');
      }

      // 4. Adicionar à lista VIP (GARANTIDO)
      const { error: vipError } = await supabase
        .from("vip_list")
        .insert({
          email: email.trim().toLowerCase(),
          user_id: authData.user.id,
          full_name: name.trim(),
        });

      if (vipError) {
        console.error('[LOTE ZERO] Erro ao adicionar à VIP list:', vipError);
        logDatabaseError('Inserção na lista VIP (novo usuário)', vipError);
        
        // Se falhar, tentar novamente com upsert
        const { error: vipRetryError } = await supabase
          .from("vip_list")
          .upsert({
            email: email.trim().toLowerCase(),
            user_id: authData.user.id,
            full_name: name.trim(),
          }, {
            onConflict: "user_id"
          });

        if (vipRetryError) {
          console.error('[LOTE ZERO] Erro ao adicionar à VIP list (retry):', vipRetryError);
          onError('Conta criada, mas não foi possível adicionar à lista VIP. Entre em contato com o suporte.');
          setLoading(false);
          return;
        }
      }

      console.log('[LOTE ZERO] ✅ Usuário adicionado à VIP list com sucesso!');

      // 5. Fazer login automático após criar conta
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) {
        console.warn('[LOTE ZERO] Aviso: não foi possível fazer login automático:', signInError);
        // Não bloquear o sucesso se o login automático falhar
      } else {
        console.log('[LOTE ZERO] ✅ Login automático realizado com sucesso!');
      }

      // 6. Sucesso!
      setLoading(false);
      onSuccess();
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

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 mb-8 sm:mb-12">
          {/* Nome Completo */}
          <div>
            <label className="text-[9px] sm:text-[10px] uppercase tracking-widest block mb-2 sm:mb-3 text-brand-softblack/60 font-light">
              Nome Completo
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              className="w-full bg-transparent border-0 border-b border-gray-300 pb-2 sm:pb-3 focus:border-black outline-none transition-colors font-mono text-sm sm:text-base text-brand-softblack placeholder:text-gray-400"
              placeholder="Seu nome completo"
              required
            />
          </div>

          {/* E-mail */}
          {!user && (
            <div>
              <label className="text-[9px] sm:text-[10px] uppercase tracking-widest block mb-2 sm:mb-3 text-brand-softblack/60 font-light">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                className="w-full bg-transparent border-0 border-b border-gray-300 pb-2 sm:pb-3 focus:border-black outline-none transition-colors font-mono text-sm sm:text-base text-brand-softblack placeholder:text-gray-400"
                placeholder="seu@email.com"
                required
              />
            </div>
          )}

          {user && (
            <div className="p-3 sm:p-4 bg-brand-green/5 border border-brand-green/20 rounded-sm">
              <p className="text-xs sm:text-sm text-brand-softblack/80">
                Logado como: <span className="font-medium break-all">{user.email}</span>
              </p>
            </div>
          )}

          {/* Senha (apenas se não estiver logado) */}
          {!user && (
            <div>
              <label className="text-[9px] sm:text-[10px] uppercase tracking-widest block mb-2 sm:mb-3 text-brand-softblack/60 font-light">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border-0 border-b border-gray-300 pb-2 sm:pb-3 focus:border-black outline-none transition-colors font-mono text-sm sm:text-base text-brand-softblack placeholder:text-gray-400"
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                required
              />
            </div>
          )}

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
          </div>

          {/* Botão de Ação */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-softblack text-brand-offwhite py-3 sm:py-4 uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[11px] sm:text-xs font-medium hover:bg-brand-softblack/90 active:bg-brand-softblack/80 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-6 sm:mt-8"
          >
            {loading ? 'Processando...' : 'Garantir Meu Acesso'}
          </button>
        </form>

        {/* Elementos de Confiança */}
        <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8 pb-8 sm:pb-12 md:pb-16 border-t border-gray-200">
          <div className="flex items-start gap-2 sm:gap-3">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-brand-green flex-shrink-0 mt-0.5"
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
              className="w-4 h-4 sm:w-5 sm:h-5 text-brand-green flex-shrink-0 mt-0.5"
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
              className="w-4 h-4 sm:w-5 sm:h-5 text-brand-green flex-shrink-0 mt-0.5"
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
