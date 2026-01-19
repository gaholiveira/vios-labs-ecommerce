'use client';

import dynamic from 'next/dynamic';

// Dynamic import do CustomCursor apenas no cliente (ssr: false)
const CustomCursor = dynamic(() => import('@/components/ui/CustomCursor'), {
  ssr: false,
});

export default function ClientCustomCursor() {
  return <CustomCursor />;
}
