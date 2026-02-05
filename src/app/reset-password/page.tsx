'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthPageSkeleton from '@/components/ui/AuthPageSkeleton';

/**
 * Página de redirecionamento - redireciona /reset-password para /update-password
 * Mantida para compatibilidade com links antigos
 */
export default function ResetPasswordPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionar imediatamente para a rota correta
    router.replace('/update-password');
  }, [router]);

  return <AuthPageSkeleton />;
}
