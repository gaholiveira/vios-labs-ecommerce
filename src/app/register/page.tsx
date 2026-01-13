'use client';
import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface FormErrors {
  full_name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
}

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    newsletter: false,
    terms: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  // Máscara de telefone
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
  };

  // Validação de senha
  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    return {
      valid: minLength && hasUpperCase && hasLowerCase && hasNumber,
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumber
    };
  };

  // Validação do formulário
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Nome completo é obrigatório';
    } else if (formData.full_name.trim().length < 3) {
      newErrors.full_name = 'Nome deve ter pelo menos 3 caracteres';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }

    if (formData.phone) {
      const phoneNumbers = formData.phone.replace(/\D/g, '');
      if (phoneNumbers.length < 10) {
        newErrors.phone = 'Telefone inválido';
      }
    }

    const passwordValidation = validatePassword(formData.password);
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (!passwordValidation.valid) {
      newErrors.password = 'Senha não atende aos requisitos';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }

    if (!formData.terms) {
      newErrors.terms = 'Você deve aceitar os termos e condições';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: formData.full_name.trim(),
            phone: formData.phone.replace(/\D/g, ''),
            newsletter: formData.newsletter,
          },
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      // Criar perfil na tabela profiles
      if (authData.user) {
        const phoneNumbers = formData.phone.replace(/\D/g, '');
        
        // Tentar criar o perfil
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            full_name: formData.full_name.trim(),
            phone: phoneNumbers || null,
            updated_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          }, {
            onConflict: 'id'
          });

        // Se houver erro, tentar novamente após um delay
        if (profileError) {
          console.error('Erro ao criar perfil (primeira tentativa):', profileError);
          
          // Aguardar e tentar novamente
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const { error: retryError } = await supabase
            .from('profiles')
            .upsert({
              id: authData.user.id,
              full_name: formData.full_name.trim(),
              phone: phoneNumbers || null,
              updated_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
            }, {
              onConflict: 'id'
            });

          if (retryError) {
            console.error('Erro ao criar perfil (segunda tentativa):', retryError);
            // Mesmo com erro, continua o processo - o perfil será criado quando o usuário acessar a página de perfil
          }
        }
      }

      router.push('/login?registered=true');
    } catch (err) {
      setError('Ocorreu um erro inesperado. Tente novamente.');
      setLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData({ ...formData, phone: formatted });
    if (errors.phone) {
      setErrors({ ...errors, phone: undefined });
    }
  };

  const passwordValidation = validatePassword(formData.password);

  return (
    <div className="min-h-screen bg-brand-offwhite flex items-center justify-center px-6 pt-24 pb-12">
      <div className="max-w-lg w-full bg-white p-8 md:p-12 shadow-sm border border-gray-100">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-light uppercase tracking-[0.3em] mb-3 text-brand-softblack">
            Criar Conta
          </h2>
          <p className="text-[10px] uppercase tracking-wider text-brand-softblack/60">
            Junte-se à comunidade VIOS
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-600 text-sm text-center rounded-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome Completo */}
          <div>
            <label 
              htmlFor="full_name"
              className="text-[10px] uppercase tracking-widest block mb-3 opacity-70 font-medium text-brand-softblack"
            >
              Nome Completo <span className="text-red-500">*</span>
            </label>
            <input
              id="full_name"
              type="text"
              value={formData.full_name}
              onChange={(e) => {
                setFormData({ ...formData, full_name: e.target.value });
                if (errors.full_name) {
                  setErrors({ ...errors, full_name: undefined });
                }
              }}
              className={`w-full bg-transparent border-b py-2 focus:outline-none transition text-brand-softblack placeholder:text-gray-400 ${
                errors.full_name 
                  ? 'border-red-400 focus:border-red-500' 
                  : 'border-gray-300 focus:border-brand-green'
              }`}
              placeholder="Seu nome completo"
              required
            />
            {errors.full_name && (
              <p className="text-[10px] text-red-500 mt-1">{errors.full_name}</p>
            )}
          </div>

          {/* E-mail */}
          <div>
            <label 
              htmlFor="email"
              className="text-[10px] uppercase tracking-widest block mb-3 opacity-70 font-medium text-brand-softblack"
            >
              E-mail <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (errors.email) {
                  setErrors({ ...errors, email: undefined });
                }
              }}
              className={`w-full bg-transparent border-b py-2 focus:outline-none transition text-brand-softblack placeholder:text-gray-400 ${
                errors.email 
                  ? 'border-red-400 focus:border-red-500' 
                  : 'border-gray-300 focus:border-brand-green'
              }`}
              placeholder="seu@email.com"
              required
            />
            {errors.email && (
              <p className="text-[10px] text-red-500 mt-1">{errors.email}</p>
            )}
          </div>

          {/* Telefone */}
          <div>
            <label 
              htmlFor="phone"
              className="text-[10px] uppercase tracking-widest block mb-3 opacity-70 font-medium text-brand-softblack"
            >
              Telefone
            </label>
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={handlePhoneChange}
              className={`w-full bg-transparent border-b py-2 focus:outline-none transition text-brand-softblack placeholder:text-gray-400 ${
                errors.phone 
                  ? 'border-red-400 focus:border-red-500' 
                  : 'border-gray-300 focus:border-brand-green'
              }`}
              placeholder="(00) 00000-0000"
              maxLength={15}
            />
            {errors.phone && (
              <p className="text-[10px] text-red-500 mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Senha */}
          <div>
            <label 
              htmlFor="password"
              className="text-[10px] uppercase tracking-widest block mb-3 opacity-70 font-medium text-brand-softblack"
            >
              Senha <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  if (errors.password) {
                    setErrors({ ...errors, password: undefined });
                  }
                }}
                className={`w-full bg-transparent border-b py-2 pr-10 focus:outline-none transition text-brand-softblack placeholder:text-gray-400 ${
                  errors.password 
                    ? 'border-red-400 focus:border-red-500' 
                    : 'border-gray-300 focus:border-brand-green'
                }`}
                placeholder="Mínimo 8 caracteres"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-brand-softblack transition"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-[10px] text-red-500 mt-1">{errors.password}</p>
            )}
            {formData.password && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-2 text-[9px]">
                  <span className={passwordValidation.minLength ? 'text-green-600' : 'text-gray-400'}>
                    {passwordValidation.minLength ? '✓' : '○'} Mínimo 8 caracteres
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[9px]">
                  <span className={passwordValidation.hasUpperCase && passwordValidation.hasLowerCase ? 'text-green-600' : 'text-gray-400'}>
                    {passwordValidation.hasUpperCase && passwordValidation.hasLowerCase ? '✓' : '○'} Letras maiúsculas e minúsculas
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[9px]">
                  <span className={passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-400'}>
                    {passwordValidation.hasNumber ? '✓' : '○'} Pelo menos um número
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Confirmar Senha */}
          <div>
            <label 
              htmlFor="confirmPassword"
              className="text-[10px] uppercase tracking-widest block mb-3 opacity-70 font-medium text-brand-softblack"
            >
              Confirmar Senha <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => {
                  setFormData({ ...formData, confirmPassword: e.target.value });
                  if (errors.confirmPassword) {
                    setErrors({ ...errors, confirmPassword: undefined });
                  }
                }}
                className={`w-full bg-transparent border-b py-2 pr-10 focus:outline-none transition text-brand-softblack placeholder:text-gray-400 ${
                  errors.confirmPassword 
                    ? 'border-red-400 focus:border-red-500' 
                    : 'border-gray-300 focus:border-brand-green'
                }`}
                placeholder="Digite a senha novamente"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-brand-softblack transition"
                aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showConfirmPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-[10px] text-red-500 mt-1">{errors.confirmPassword}</p>
            )}
            {formData.confirmPassword && formData.password === formData.confirmPassword && (
              <p className="text-[10px] text-green-600 mt-1">✓ Senhas coincidem</p>
            )}
          </div>

          {/* Newsletter */}
          <div className="flex items-start gap-3 pt-2">
            <input
              id="newsletter"
              type="checkbox"
              checked={formData.newsletter}
              onChange={(e) => setFormData({ ...formData, newsletter: e.target.checked })}
              className="mt-1 w-4 h-4 border-gray-300 rounded focus:ring-brand-green text-brand-green"
            />
            <label htmlFor="newsletter" className="text-[10px] uppercase tracking-wider text-brand-softblack/70 font-light leading-relaxed">
              Desejo receber novidades e ofertas exclusivas por e-mail
            </label>
          </div>

          {/* Termos e Condições */}
          <div className="flex items-start gap-3 pt-2">
            <input
              id="terms"
              type="checkbox"
              checked={formData.terms}
              onChange={(e) => {
                setFormData({ ...formData, terms: e.target.checked });
                if (errors.terms) {
                  setErrors({ ...errors, terms: undefined });
                }
              }}
              className={`mt-1 w-4 h-4 border-gray-300 rounded focus:ring-brand-green text-brand-green ${
                errors.terms ? 'border-red-400' : ''
              }`}
              required
            />
            <label htmlFor="terms" className="text-[10px] uppercase tracking-wider text-brand-softblack/70 font-light leading-relaxed">
              Aceito os <Link href="/termos" className="underline hover:text-brand-green transition">Termos e Condições</Link> e a <Link href="/privacidade" className="underline hover:text-brand-green transition">Política de Privacidade</Link> <span className="text-red-500">*</span>
            </label>
          </div>
          {errors.terms && (
            <p className="text-[10px] text-red-500 mt-1 ml-7">{errors.terms}</p>
          )}

          {/* Botão de Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-green text-brand-offwhite py-4 uppercase text-[10px] tracking-[0.2em] mt-8 hover:bg-brand-green/90 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                A criar conta...
              </span>
            ) : (
              'Criar Conta'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-center text-[10px] uppercase tracking-widest opacity-60">
            Já tem conta? <Link href="/login" className="underline font-bold hover:text-brand-green transition">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
}