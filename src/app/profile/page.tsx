'use client';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { formatDatabaseError, logDatabaseError } from '@/utils/errorHandler';
import Image from 'next/image';
import { Lock } from 'lucide-react';
import Skeleton from '@/components/ui/Skeleton';
import { useCart } from '@/context/CartContext';

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useCart();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    full_name: '',
    avatar_url: '',
    email: '',
  });
  const [fullNameError, setFullNameError] = useState<string | null>(null);

  // Função para obter iniciais do nome - Memoizada
  const getInitials = useCallback((name: string): string => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, []);

  useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        // Buscar perfil na tabela profiles
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code === 'PGRST116') {
          // Perfil não existe, usar dados dos metadados
          const userMetadata = user.user_metadata || {};
          setProfile({
            full_name: userMetadata.full_name || '',
            avatar_url: userMetadata.avatar_url || '',
            email: user.email || '',
          });
        } else if (profileData) {
          // Perfil existe, usar dados
          setProfile({
            full_name: profileData.full_name || '',
            avatar_url: profileData.avatar_url || '',
            email: profileData.email || user.email || '',
          });
        } else {
          // Fallback: usar dados dos metadados
          const userMetadata = user.user_metadata || {};
          setProfile({
            full_name: userMetadata.full_name || '',
            avatar_url: userMetadata.avatar_url || '',
            email: user.email || '',
          });
        }
      } catch (err) {
        console.error('Erro ao carregar perfil:', err);
        setError('Erro ao carregar dados do perfil');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [router]);

  // Função para fazer upload do avatar - Otimizada com useCallback
  const handleAvatarUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione uma imagem válida (JPG, PNG, etc.)');
      return;
    }

    // Validar tamanho (max 2MB) com mensagem detalhada
    const maxSize = 2 * 1024 * 1024; // 2MB em bytes
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    
    if (file.size > maxSize) {
      setError(`A imagem é muito grande (${fileSizeMB} MB). O tamanho máximo permitido é 2 MB. Por favor, reduza o tamanho da imagem.`);
      return;
    }

    // Validar tamanho mínimo (100KB)
    const minSize = 100 * 1024; // 100KB
    if (file.size < minSize) {
      setError('A imagem é muito pequena. Selecione uma imagem maior que 100 KB.');
      return;
    }

    setUploadingAvatar(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Usuário não autenticado');
        setUploadingAvatar(false);
        return;
      }

      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      // IMPORTANTE: Não incluir 'avatars/' no filePath, pois o Supabase já adiciona o nome do bucket
      // O caminho deve ser apenas: {userId}/{fileName}
      const filePath = `${user.id}/${fileName}`;

      // Fazer upload para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        logDatabaseError('Upload de avatar', uploadError);
        console.error('Detalhes do erro de upload:', {
          message: uploadError.message,
          name: uploadError.name,
          fileSize: file.size,
          fileName: file.name,
          fileType: file.type,
          fileSizeMB: fileSizeMB,
        });
        
        // Mensagem de erro específica baseada no código do erro
        let errorMessage = 'Erro ao fazer upload da imagem';
        
        if (uploadError.message) {
          const msg = uploadError.message.toLowerCase();
          
          // Tratar erros comuns do Storage
          if (msg.includes('new row violates row-level security') || msg.includes('row-level security')) {
            errorMessage = 'Erro de permissão. Verifique se o bucket está configurado corretamente e as políticas RLS estão ativas.';
          } else if (msg.includes('bucket not found')) {
            errorMessage = 'Bucket de avatares não encontrado. Verifique se o bucket "avatars" foi criado no Storage.';
          } else if (msg.includes('the resource already exists') || msg.includes('already exists')) {
            // Tentar novamente com upsert (que já está ativo)
            errorMessage = 'Erro ao substituir imagem. Tente novamente.';
          } else if (msg.includes('file too large') || msg.includes('size limit') || msg.includes('exceeds')) {
            errorMessage = `A imagem é muito grande (${fileSizeMB} MB). Reduza o tamanho para menos de 2 MB.`;
          } else if (msg.includes('invalid file type') || msg.includes('mime type')) {
            errorMessage = 'Tipo de arquivo não permitido. Use apenas imagens (JPG, PNG, etc.).';
          } else if (msg.includes('permission denied') || msg.includes('forbidden')) {
            errorMessage = 'Permissão negada. Verifique se você está logado e se as políticas do Storage estão configuradas.';
          } else {
            // Usar a mensagem formatada do erro ou a mensagem original
            const formattedError = formatDatabaseError(uploadError);
            errorMessage = formattedError || `Erro ao fazer upload: ${uploadError.message}`;
          }
        }
        
        setError(errorMessage);
        setUploadingAvatar(false);
        return;
      }

      // Obter URL pública da imagem
      // IMPORTANTE: Usar o mesmo filePath (sem 'avatars/' no início)
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath);

      // Atualizar perfil com a nova URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: publicUrl,
        })
        .eq('id', user.id);

      if (updateError) {
        logDatabaseError('Atualização de avatar', updateError);
        setError('Erro ao atualizar avatar');
        setUploadingAvatar(false);
        return;
      }

      // Atualizar estado local
      setProfile({ ...profile, avatar_url: publicUrl });
      setSuccess(true);
      showToast('Foto atualizada com sucesso');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      logDatabaseError('Exceção ao fazer upload de avatar', err);
      setError('Erro ao processar imagem');
    } finally {
      setUploadingAvatar(false);
      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [profile, showToast]);

  const handleUpdate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setFullNameError(null);

    // Validação
    if (!profile.full_name.trim()) {
      setFullNameError('Nome completo é obrigatório');
      return;
    }

    if (profile.full_name.trim().length < 3) {
      setFullNameError('Nome deve ter pelo menos 3 caracteres');
      return;
    }

    setUpdating(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Usuário não autenticado');
        setUpdating(false);
        return;
      }

      // Atualizar apenas full_name, avatar_url e updated_at (via trigger)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name.trim(),
          // avatar_url já foi atualizado no upload, não precisa atualizar aqui
        })
        .eq('id', user.id);

      if (updateError) {
        logDatabaseError('Atualização de perfil', updateError);
        const errorMessage = formatDatabaseError(updateError);
        setError(errorMessage);
      } else {
        setSuccess(true);
        showToast('Perfil atualizado com sucesso');
        setTimeout(() => setSuccess(false), 5000);
      }
    } catch (err) {
      logDatabaseError('Exceção ao atualizar perfil', err);
      const errorMessage = formatDatabaseError(err);
      setError(errorMessage);
    } finally {
      setUpdating(false);
    }
  }, [profile.full_name, showToast]);

  const handleLogout = useCallback(async () => {
    try {
      // Importar e usar função centralizada de logout
      const { handleLogout: logout } = await import('@/utils/auth');
      await logout();
      // Não precisa de router.push pois o logout já faz window.location.href
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
      setError('Erro ao sair da conta');
      // Mesmo com erro, tentar redirecionar
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  }, []);

  // Memoizar iniciais do perfil
  const profileInitials = useMemo(() => {
    return getInitials(profile.full_name);
  }, [profile.full_name, getInitials]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-offwhite py-24 px-4 md:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <Skeleton className="h-10 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
          <div className="bg-white p-8 md:p-12 shadow-sm border border-gray-100">
            <div className="flex flex-col items-center space-y-4 mb-10">
              <Skeleton className="w-24 h-24 rounded-full" variant="circular" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="space-y-8">
              <div>
                <Skeleton className="h-3 w-32 mb-3" />
                <Skeleton className="h-12 w-full" />
              </div>
              <div>
                <Skeleton className="h-3 w-24 mb-3" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
            <Skeleton className="h-12 w-full mt-10" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-offwhite py-24 px-4 md:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-light uppercase tracking-widest mb-2 text-brand-softblack">
            Seus Dados
          </h1>
          <p className="text-sm font-light text-brand-softblack/60">
            Gerencie suas informações pessoais
          </p>
        </div>

        {/* Formulário */}
        <div className="bg-white p-8 md:p-12 shadow-sm border border-gray-100">
          {/* Mensagens de Feedback */}
          {success && (
            <div className="mb-6 p-4 bg-brand-green/10 border border-brand-green/30 text-brand-green text-sm text-center rounded-sm">
              <div className="flex items-center justify-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Alterações salvas com sucesso!</span>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-600 text-sm text-center rounded-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-10">
            {/* Seção de Avatar */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                {profile.avatar_url ? (
                  <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200">
                    <Image
                      src={profile.avatar_url}
                      alt="Avatar"
                      fill
                      className="object-cover"
                      onError={(e) => {
                        // Se a imagem falhar, mostrar iniciais
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-stone-200 border-2 border-gray-200 flex items-center justify-center">
                    <span className="text-2xl font-serif text-brand-softblack/70">
                      {profileInitials}
                    </span>
                  </div>
                )}
                
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <svg
                      className="animate-spin h-6 w-6 text-white"
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
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                id="avatar-upload"
              />
              <label
                htmlFor="avatar-upload"
                className="text-[10px] uppercase tracking-widest opacity-70 hover:opacity-100 cursor-pointer transition-opacity underline"
              >
                {uploadingAvatar ? 'Enviando...' : 'Alterar Foto'}
              </label>
            </div>

            {/* Dados Pessoais */}
            <div className="space-y-8">
              {/* Nome Completo */}
              <div>
                <label
                  htmlFor="full_name"
                  className="text-[10px] uppercase tracking-widest block mb-3 opacity-70 font-medium text-brand-softblack"
                >
                  Nome Completo
                </label>
                <input
                  id="full_name"
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => {
                    setProfile({ ...profile, full_name: e.target.value });
                    if (fullNameError) setFullNameError(null);
                  }}
                  className={`w-full bg-transparent border-b py-3 focus:outline-none transition text-brand-softblack placeholder:text-gray-400 font-light ${
                    fullNameError
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-gray-300 focus:border-brand-green'
                  }`}
                  placeholder="Seu nome completo"
                  required
                />
                {fullNameError && (
                  <p className="text-[10px] text-red-500 mt-2">{fullNameError}</p>
                )}
              </div>

              {/* E-mail (Readonly) */}
              <div>
                <label
                  htmlFor="email"
                  className="text-[10px] uppercase tracking-widest flex items-center gap-2 mb-3 opacity-70 font-medium text-brand-softblack"
                >
                  E-mail
                  <Lock className="w-3 h-3 opacity-50" />
                </label>
                <input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full bg-transparent border-b border-gray-200 py-3 focus:outline-none text-brand-softblack/50 font-light cursor-not-allowed"
                  placeholder="seu@email.com"
                />
                <p className="text-[9px] text-gray-400 mt-2 italic">
                  O e-mail não pode ser alterado por aqui
                </p>
              </div>
            </div>

            {/* Botão Salvar */}
            <button
              type="submit"
              disabled={updating}
              className="w-full bg-brand-green text-brand-offwhite py-4 uppercase text-xs tracking-[0.2em] hover:bg-brand-softblack transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {updating ? (
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
                  <span>A salvar...</span>
                </span>
              ) : (
                'Salvar Alterações'
              )}
            </button>
          </form>

          {/* Separador */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            {/* Botão Logout */}
            <button
              type="button"
              onClick={handleLogout}
              className="w-full bg-transparent border border-gray-300 text-gray-600 py-4 uppercase text-xs tracking-[0.2em] hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Sair da Conta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
