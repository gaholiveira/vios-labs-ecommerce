'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const CustomCursor = dynamic(() => import('@/components/ui/CustomCursor'), {
  ssr: false,
});

export default function ClientCustomCursor() {
  const [isTouch, setIsTouch] = useState(true);

  useEffect(() => {
    const touch =
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      Boolean((navigator as Navigator & { msMaxTouchPoints?: number }).msMaxTouchPoints);
    setIsTouch(touch);
  }, []);

  if (isTouch) return null;
  return <CustomCursor />;
}
