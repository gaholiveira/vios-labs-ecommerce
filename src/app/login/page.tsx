'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link'; // 1. Importação necessária

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // 2. Estado de loading
  const supabase = createClient();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      alert(error.message);
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-brand-offwhite flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white p-12 shadow-sm border border-gray-100">
        <h2 className="text-2xl font-light uppercase tracking-[0.3em] text-center mb-12 text-brand-softblack">
          Entrar
        </h2>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="text-[10px] uppercase tracking-widest block mb-2 opacity-50">E-mail</label>
            <input 
              type="email" 
              className="w-full bg-transparent border-b border-gray-300 py-2 focus:border-brand-green outline-none transition text-brand-softblack"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest block mb-2 opacity-50">Palavra-passe</label>
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
            {loading ? 'A carregar...' : 'Aceder à conta'}
          </button>
        </form>

        {/* 3. O LINK QUE FALTAVA */}
        <div className="mt-8 text-center">
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
  );
}