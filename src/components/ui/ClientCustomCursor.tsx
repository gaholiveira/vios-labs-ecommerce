'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const CustomCursor = dynamic(() => import('@/components/ui/CustomCursor'), {
  ssr: false,
});

/**
 * CustomCursor é carregado apenas após o browser estar idle (requestIdleCallback),
 * mantendo-o fora do caminho crítico de renderização para melhorar o LCP.
 */
export default function ClientCustomCursor() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mount = () => {
      const touch =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        Boolean((navigator as Navigator & { msMaxTouchPoints?: number }).msMaxTouchPoints);
      if (!touch) setReady(true);
    };

    if (typeof requestIdleCallback !== 'undefined') {
      const id = requestIdleCallback(mount, { timeout: 2000 });
      return () => cancelIdleCallback(id);
    }
    const t = setTimeout(mount, 500);
    return () => clearTimeout(t);
  }, []);

  if (!ready) return null;
  return <CustomCursor />;
}
