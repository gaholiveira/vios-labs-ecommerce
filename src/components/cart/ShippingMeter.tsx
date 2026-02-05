'use client';

import { useMemo } from 'react';
import { formatPrice } from '@/utils/format';
import { FREE_SHIPPING_THRESHOLD } from '@/lib/checkout-config';

interface ShippingMeterProps {
  currentSubtotal: number;
}

export default function ShippingMeter({ currentSubtotal }: ShippingMeterProps) {
  const { percentage, remaining, isAchieved } = useMemo(() => {
    const percentage = Math.min((currentSubtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
    const remaining = Math.max(FREE_SHIPPING_THRESHOLD - currentSubtotal, 0);
    const isAchieved = currentSubtotal >= FREE_SHIPPING_THRESHOLD;

    return { percentage, remaining, isAchieved };
  }, [currentSubtotal]);

  return (
    <div className="w-full mb-6">
      {/* Barra de Progresso */}
      <div className="relative h-[2px] w-full bg-stone-200 overflow-hidden">
        <div
          className={`h-[2px] transition-all duration-500 ease-out ${
            isAchieved ? 'bg-[#082f1e]' : 'bg-[#082f1e]'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Texto */}
      <div className="mt-2 flex items-center justify-end gap-2">
        {isAchieved ? (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-3.5 h-3.5 text-[#082f1e]"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
            <p className="font-mono text-xs text-[#082f1e] uppercase tracking-wide">
              Frete Grátis Conquistado.
            </p>
          </>
        ) : (
          <p className="font-mono text-xs text-stone-500 uppercase tracking-wide text-right">
            Faltam {formatPrice(remaining)} para Frete Grátis.
          </p>
        )}
      </div>
    </div>
  );
}
