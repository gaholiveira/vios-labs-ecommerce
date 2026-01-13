'use client';
import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/auth/callback` }
    });

    if (error) {
      alert(error.message);
    } else {
      alert('Verifique o seu e-mail para confirmar o registo!');
      router.push('/login');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-brand-offwhite flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white p-12 shadow-sm border border-gray-100">
        <h2 className="text-2xl font-light uppercase tracking-[0.3em] text-center mb-12 text-brand-softblack">
          Criar Conta
        </h2>
        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label className="text-[10px] uppercase tracking-widest block mb-2 opacity-50">E-mail</label>
            <input 
              type="email" 
              className="w-full bg-transparent border-b border-gray-300 py-2 focus:border-brand-green outline-none transition"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest block mb-2 opacity-50">Palavra-passe</label>
            <input 
              type="password" 
              className="w-full bg-transparent border-b border-gray-300 py-2 focus:border-brand-green outline-none transition"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button 
            disabled={loading}
            className="w-full bg-brand-green text-brand-offwhite py-4 uppercase text-[10px] tracking-[0.2em] mt-8 hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'A processar...' : 'Registar'}
          </button>
        </form>
        <p className="mt-8 text-center text-[10px] uppercase tracking-widest opacity-60">
          Já tem conta? <Link href="/login" className="underline font-bold">Entrar</Link>
        </p>
      </div>
    </div>
  );
}