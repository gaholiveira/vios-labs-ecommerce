'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    phone: '',
    address_street: '',
    address_city: '',
    address_postcode: ''
  });

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) setProfile({
        full_name: data.full_name || '',
        phone: data.phone || '',
        address_street: data.address_street || '',
        address_city: data.address_city || '',
        address_postcode: data.address_postcode || ''
      });
      setLoading(false);
    }
    loadProfile();
  }, [router, supabase]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user?.id,
        ...profile,
        updated_at: new Date().toISOString(),
      });

    if (error) alert(error.message);
    else alert('Perfil atualizado com sucesso!');
    setUpdating(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-brand-offwhite flex items-center justify-center">
      <span className="text-[10px] uppercase tracking-[0.4em] animate-pulse">A carregar perfil...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-offwhite flex items-center justify-center px-6 pt-24 pb-12">
      <div className="max-w-xl w-full bg-white p-12 shadow-sm border border-gray-100">
        <h2 className="text-2xl font-light uppercase tracking-[0.3em] text-center mb-12 text-brand-softblack">
          O Meu Perfil
        </h2>
        
        <form onSubmit={handleUpdate} className="space-y-10">
          {/* Dados Pessoais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="flex flex-col">
              <label className="text-[10px] uppercase tracking-widest block mb-3 opacity-50">Nome Completo</label>
              <input 
                type="text"
                className="w-full bg-transparent border-b border-gray-300 py-2 focus:border-brand-green outline-none transition text-brand-softblack"
                value={profile.full_name}
                onChange={e => setProfile({...profile, full_name: e.target.value})}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] uppercase tracking-widest block mb-3 opacity-50">Telemóvel</label>
              <input 
                type="tel"
                className="w-full bg-transparent border-b border-gray-200 py-2 focus:border-brand-green outline-none transition text-brand-softblack"
                value={profile.phone}
                onChange={e => setProfile({...profile, phone: e.target.value})}
              />
            </div>
          </div>

          {/* Endereço */}
          <div className="pt-4">
            <h3 className="text-[11px] uppercase tracking-[0.2em] mb-8 font-medium border-l-2 border-brand-green pl-4">
              Endereço de Entrega
            </h3>
            
            <div className="space-y-10">
              <div className="flex flex-col">
                <label className="text-[10px] uppercase tracking-widest block mb-3 opacity-50">Rua e Número</label>
                <input 
                  type="text"
                  className="w-full bg-transparent border-b border-gray-200 py-2 focus:border-brand-green outline-none transition text-brand-softblack"
                  value={profile.address_street}
                  onChange={e => setProfile({...profile, address_street: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="flex flex-col">
                  <label className="text-[10px] uppercase tracking-widest block mb-3 opacity-50">Cidade</label>
                  <input 
                    type="text"
                    className="w-full bg-transparent border-b border-gray-200 py-2 focus:border-brand-green outline-none transition text-brand-softblack"
                    value={profile.address_city}
                    onChange={e => setProfile({...profile, address_city: e.target.value})}
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] uppercase tracking-widest block mb-3 opacity-50">Código Postal</label>
                  <input 
                    type="text"
                    className="w-full bg-transparent border-b border-gray-200 py-2 focus:border-brand-green outline-none transition text-brand-softblack"
                    value={profile.address_postcode}
                    onChange={e => setProfile({...profile, address_postcode: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>

          <button 
            disabled={updating}
            className="w-full bg-brand-green text-brand-offwhite py-4 uppercase text-[10px] tracking-[0.2em] mt-12 hover:opacity-90 transition disabled:opacity-50 shadow-md"
          >
            {updating ? 'A atualizar...' : 'Guardar Alterações'}
          </button>
        </form>
      </div>
    </div>
  );
}