'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { formatDatabaseError, logDatabaseError } from '@/utils/errorHandler';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showEmailConfirmed, setShowEmailConfirmed] = useState(false);
  const router = useRouter();
  const { showToast } = useCart();

  useEffect(() => {
    // Verificar search params apenas no cliente
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      
      if (params.get('registered') === 'true') {
        const message = params.get('message') || 'Conta criada com sucesso! Verifique seu e-mail para confirmar.';
        showToast(message);
        router.replace('/login');
      }
      
      if (params.get('password-reset') === 'true') {
        showToast('Senha redefinida com sucesso! Você já pode fazer login.');
        router.replace('/login');
      }
      
      // Tratar caso de email já confirmado (link já usado/expirado mas email confirmado)
      if (params.get('email-confirmed') === 'true') {
        const message = params.get('message') || 'Seu email já está confirmado! Faça login com suas credenciais para continuar.';
        // Mostrar como mensagem de sucesso (não erro) mas destacada
        setError(null); // Limpar erros
        setShowEmailConfirmed(true); // Mostrar banner
        showToast(message);
        router.replace('/login'); // Limpar URL após alguns segundos
        // Esconder banner após 8 segundos
        setTimeout(() => {
          setShowEmailConfirmed(false);
        }, 8000);
      }
      
      if (params.get('error')) {
        const errorMsg = params.get('message') || params.get('error');
        // Não mostrar como erro se for sobre email confirmado
        if (!errorMsg.includes('confirmado') && !errorMsg.includes('email')) {
          setError(errorMsg || 'Erro de autenticação');
        }
      }
      
      const redirect = params.get('redirect');
      if (redirect) {
        sessionStorage.setItem('redirect', redirect);
      }
    }
  }, [router, showToast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        logDatabaseError('Login', authError);
        const errorMessage = formatDatabaseError(authError);
        
        // Usar toast para erros de login
        if (errorMessage.includes('Invalid') || errorMessage.includes('credenciais') || errorMessage.includes('inválida')) {
          showToast('Credenciais inválidas');
        } else {
          showToast(errorMessage);
        }
        
        setLoading(false);
        return;
      }

      if (data.user) {
        // Associar pedidos de guest checkout ao usuário (se houver)
        try {
          await supabase.rpc('associate_my_guest_orders');
        } catch (assocError) {
          // Silenciosamente ignora erros de associação (pode não existir pedidos)
        }

        // Verificar se há redirect salvo
        const redirect = sessionStorage.getItem('redirect');
        if (redirect) {
          sessionStorage.removeItem('redirect');
          router.push(redirect);
        } else {
          router.push('/');
        }
        router.refresh();
      }
    } catch (err) {
      logDatabaseError('Exceção ao fazer login', err);
      const errorMessage = formatDatabaseError(err);
      showToast(errorMessage || 'Erro ao fazer login');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-offwhite flex items-center justify-center px-4 md:px-6 py-24">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-light uppercase tracking-widest mb-4 text-brand-softblack">
            Acessar Conta
          </h1>
          <p className="text-sm font-light text-brand-softblack/60 leading-relaxed">
            Entre para acessar o seu histórico e pedidos.
          </p>
        </div>

        {/* Formulário */}
        <div className="bg-white p-8 md:p-12 shadow-sm border border-gray-100">
          {/* Banner de email confirmado */}
          {showEmailConfirmed && (
            <div className="mb-6 p-4 bg-brand-green/10 border border-brand-green/30 text-brand-green text-sm text-center rounded-sm animate-fadeIn">
              <div className="flex items-center justify-center gap-2">
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="text-left">
                  <p className="font-medium mb-1">Email já confirmado! ✅</p>
                  <p className="text-xs opacity-90">
                    Seu email já está confirmado. Faça login com suas credenciais abaixo para continuar.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-600 text-sm text-center rounded-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-8">
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
                    ? 'border-red-400 focus:border-red-500' 
                    : 'border-gray-300 focus:border-brand-green'
                }`}
                placeholder="seu@email.com"
                required
                autoComplete="email"
              />
            </div>

            {/* Senha */}
            <div>
              <label 
                htmlFor="password"
                className="text-[10px] uppercase tracking-widest block mb-3 opacity-70 font-medium text-brand-softblack"
              >
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  className={`w-full bg-transparent border-b py-3 pr-12 focus:outline-none transition text-brand-softblack placeholder:text-gray-400 font-light font-mono ${
                    error 
                      ? 'border-red-400 focus:border-red-500' 
                      : 'border-gray-300 focus:border-brand-green'
                  }`}
                  placeholder="Sua senha"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-brand-softblack transition"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>A acessar...</span>
                </span>
              ) : (
                'Acessar'
              )}
            </button>
          </form>

          {/* Links Secundários */}
          <div className="mt-8 pt-6 border-t border-gray-200 space-y-3">
            <Link
              href="/forgot-password"
              className="block text-center text-[10px] uppercase tracking-widest opacity-60 text-brand-softblack hover:text-brand-green transition-colors"
            >
              Esqueci minha senha
            </Link>
            <p className="text-center text-[10px] uppercase tracking-widest opacity-60 text-brand-softblack">
              Ainda não tem conta?{' '}
              <Link href="/register" className="underline font-medium hover:text-brand-green transition">
                Criar conta
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
