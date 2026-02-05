'use client';

import { memo, useMemo } from 'react';
import Image from 'next/image';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function Avatar({ 
  src, 
  alt = 'Avatar', 
  name, 
  size = 'md',
  className = ''
}: AvatarProps) {
  // Função para obter iniciais do nome - Memoizada
  const initials = useMemo(() => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [name]);

  // Memoizar classes de tamanho
  const sizeClasses = useMemo(() => ({
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-20 h-20 text-2xl',
  }), []);

  const sizeClass = sizeClasses[size];

  if (src) {
    return (
      <div className={`relative ${sizeClass} rounded-full overflow-hidden border-2 border-gray-200 ${className}`}>
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div className={`${sizeClass} rounded-full bg-stone-100 text-stone-600 font-medium flex items-center justify-center border-2 border-gray-200 ${className}`}>
      {initials}
    </div>
  );
}

// Memoizar componente Avatar
export default memo(Avatar);
