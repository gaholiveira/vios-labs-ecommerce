'use client';
import Image from 'next/image';
import { useState } from 'react';

interface FounderImageProps {
  src: string;
  alt: string;
  initials: string;
  objectPosition?: string;
}

export default function FounderImage({ src, alt, initials, objectPosition = 'center' }: FounderImageProps) {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return (
      <div className="w-full h-full bg-brand-green/10 rounded-full flex items-center justify-center">
        <span className="text-6xl font-extralight text-brand-softblack/30">{initials}</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="192px"
      className="object-cover"
      style={{ objectPosition }}
      onError={() => setImageError(true)}
      loading="lazy"
      quality={85}
    />
  );
}
