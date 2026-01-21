'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

/**
 * Hook otimizado para obter a altura do viewport no momento do carregamento
 * e mantê-la fixa para evitar layout shift em In-App Browsers (Instagram, Facebook, etc.)
 * 
 * A altura é medida uma vez ao montar e só é atualizada se a largura mudar (rotação do aparelho),
 * ignorando mudanças de altura causadas por barras de navegação que aparecem/somem.
 */
export function useMobileViewportHeight(): number | null {
  const [height, setHeight] = useState<number | null>(null);
  const widthRef = useRef<number | null>(null);

  // Memoizar handler de resize
  const handleResize = useCallback(() => {
    const currentWidth = window.innerWidth;
    
    // Se a largura mudou (rotação), atualizar a altura
    // Se apenas a altura mudou (barras do Instagram), ignorar
    if (widthRef.current !== null && currentWidth !== widthRef.current) {
      setHeight(window.innerHeight);
      widthRef.current = currentWidth;
    }
    // Se apenas a altura mudou, não fazer nada (mantém altura original)
  }, []);

  useEffect(() => {
    // Medir altura e largura iniciais apenas uma vez
    const initialHeight = window.innerHeight;
    const initialWidth = window.innerWidth;
    
    setHeight(initialHeight);
    widthRef.current = initialWidth;

    // Listener apenas para mudanças de LARGURA (rotação do aparelho)
    // Usar passive listener para melhor performance
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]); // Incluir handleResize nas dependências

  return height;
}
