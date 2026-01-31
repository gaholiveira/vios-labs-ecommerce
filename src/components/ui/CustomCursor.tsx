'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useSpring } from 'framer-motion';

export default function CustomCursor() {
  const [isTouchDevice, setIsTouchDevice] = useState(true); // Começar como true para evitar flash
  const [isHovering, setIsHovering] = useState(false);
  const [isOverInput, setIsOverInput] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const hasInitializedRef = useRef(false);

  // Spring animation rápida e responsiva (magnética, mas ágil)
  // Ajustado para ser mais responsivo e menos "magnético"
  const springConfig = { damping: 30, stiffness: 600, mass: 0.25 };
  const cursorX = useSpring(0, springConfig);
  const cursorY = useSpring(0, springConfig);

  useEffect(() => {
    // Detectar se é dispositivo touch
    const checkTouchDevice = () => {
      return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore
        (navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 0)
      );
    };

    const touchDevice = checkTouchDevice();
    setIsTouchDevice(touchDevice);

    // Se for touch device, não fazer nada
    if (touchDevice) return;

    // Função para verificar se elemento é um input/textarea/editável
    const isInputElement = (element: HTMLElement | null): boolean => {
      if (!element) return false;

      // Verificar tag
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        return true;
      }

      // Verificar contenteditable
      if (element.hasAttribute('contenteditable') && element.getAttribute('contenteditable') !== 'false') {
        return true;
      }

      // Verificar se está dentro de um input/textarea
      if (element.closest('input, textarea, [contenteditable="true"]')) {
        return true;
      }

      return false;
    };

    const cursorCache = new WeakMap<Element, string>();

    // Função para verificar se elemento é clicável/interativo
    const isInteractiveElement = (element: HTMLElement | null): boolean => {
      if (!element || element === document.body || element === document.documentElement) {
        return false;
      }

      // Ignorar elementos do próprio cursor customizado
      if (element.closest('[data-custom-cursor]')) {
        return false;
      }

      // Percorrer a árvore DOM até encontrar um elemento interativo
      let current: HTMLElement | null = element;
      let depth = 0;
      const maxDepth = 10; // Limite de profundidade para evitar loops infinitos

      while (current && depth < maxDepth) {
        // Ignorar elementos do próprio cursor
        if (current.hasAttribute('data-custom-cursor')) {
          current = current.parentElement;
          depth++;
          continue;
        }

        // Verificar tags HTML interativas (exceto INPUT/TEXTAREA que são tratados separadamente)
        const interactiveTags = ['A', 'BUTTON', 'SELECT', 'LABEL'];
        if (interactiveTags.includes(current.tagName)) {
          // Verificar se não está desabilitado
          if (current.hasAttribute('disabled') || current.getAttribute('aria-disabled') === 'true') {
            current = current.parentElement;
            depth++;
            continue;
          }
          return true;
        }

        // Verificar role interativo
        const role = current.getAttribute('role');
        if (role && ['button', 'link', 'menuitem', 'tab', 'option'].includes(role)) {
          return true;
        }

        // Verificar cursor pointer (cache para evitar reflow forçado por getComputedStyle)
        try {
          let cursorValue = cursorCache.get(current);
          if (cursorValue === undefined) {
            cursorValue = window.getComputedStyle(current).cursor;
            cursorCache.set(current, cursorValue);
          }
          if (cursorValue === 'none') {
            current = current.parentElement;
            depth++;
            continue;
          }
          if (cursorValue === 'pointer' || cursorValue === 'grab') {
            if (current.hasAttribute('disabled') || current.getAttribute('aria-disabled') === 'true') {
              current = current.parentElement;
              depth++;
              continue;
            }
            return true;
          }
        } catch {
          // Ignorar erros de estilo computado
        }

        // Verificar atributos interativos
        if (
          current &&
          (
            current.hasAttribute('onclick') ||
            current.hasAttribute('href') ||
            (current.hasAttribute('tabindex') && current.getAttribute('tabindex') !== '-1')
          )
        ) {
          // Verificar se não está desabilitado
          if (current.hasAttribute('disabled') || current.getAttribute('aria-disabled') === 'true') {
            current = current.parentElement;
            depth++;
            continue;
          }
          return true;
        }

        // Verificar se é um elemento clicável por classe
        const interactiveClasses = ['cursor-pointer', 'btn', 'button', 'link', 'clickable'];
        if (current && current.classList) {
          for (const className of interactiveClasses) {
            if (current.classList.contains(className)) {
              return true;
            }
          }
        }

        // Continuar subindo na árvore DOM
        if (current) {
          current = current.parentElement;
          depth++;
        } else {
          break;
        }
      }

      return false;
    };

    // Rastrear posição do mouse e detectar hover
    const handleMouseMove = (e: MouseEvent) => {
      // Atualizar posição do cursor diretamente (useSpring já lida com a suavidade)
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      
      // Mostrar cursor na primeira vez que o mouse se move
      if (!hasInitializedRef.current) {
        hasInitializedRef.current = true;
        setIsVisible(true);
      }

      // Detectar elemento diretamente
      try {
        // Verificar elemento sob o cursor (funciona mesmo em elementos com z-index alto)
        const elementUnderCursor = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
        
        // Verificar se o elemento é válido e não é o próprio cursor
        if (
          !elementUnderCursor || 
          elementUnderCursor === document.body || 
          elementUnderCursor === document.documentElement ||
          elementUnderCursor.closest('[data-custom-cursor]')
        ) {
          if (isHovering) {
            setIsHovering(false);
          }
          if (isOverInput) {
            setIsOverInput(false);
          }
          return;
        }

        // PRIMEIRO: Verificar se é input/textarea/editável (prioridade)
        const isInput = isInputElement(elementUnderCursor);
        if (isInput) {
          if (!isOverInput) {
            setIsOverInput(true);
          }
          if (isHovering) {
            setIsHovering(false);
          }
          return;
        } else {
          if (isOverInput) {
            setIsOverInput(false);
          }
        }

        // Verificar se é interativo (a função já percorre a árvore DOM)
        const isInteractive = isInteractiveElement(elementUnderCursor);

        if (isInteractive) {
          if (!isHovering) {
            setIsHovering(true);
          }
        } else {
          if (isHovering) {
            setIsHovering(false);
          }
        }
      } catch {
        // Em caso de erro (elemento removido do DOM, etc), resetar para estado normal
        if (isHovering) {
          setIsHovering(false);
        }
        if (isOverInput) {
          setIsOverInput(false);
        }
      }
    };

    // Adicionar listeners - usar capture para garantir que funcione em todos os elementos
    document.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Detectar mouse leave na janela para resetar
    const handleMouseLeave = () => {
      setIsVisible(false);
      if (isHovering) {
        setIsHovering(false);
      }
      if (isOverInput) {
        setIsOverInput(false);
      }
    };

    // Detectar mouse enter na janela para mostrar cursor
    const handleMouseEnter = () => {
      if (hasInitializedRef.current) {
        setIsVisible(true);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    document.addEventListener('mouseenter', handleMouseEnter, { passive: true });

    // NÃO inicializar no centro - isso causa o "puxar ao centro"
    // O cursor aparecerá apenas quando o mouse se mover pela primeira vez

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [cursorX, cursorY, isHovering, isOverInput, isVisible]);

  // Se for touch device, não renderizar
  if (isTouchDevice) return null;

  return (
    <motion.div
      data-custom-cursor
      className="fixed top-0 left-0 pointer-events-none z-[9999]"
      style={{
        x: cursorX,
        y: cursorY,
      }}
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: isOverInput ? 0 : (isVisible ? 1 : 0),
      }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <div
        style={{
          transform: 'translate(-50%, -50%)',
        }}
      >
        {/* Estado Normal: Dot Sólido Metallic Gold - 12px */}
        <motion.div
          className="w-3 h-3 rounded-full"
          style={{
            backgroundColor: '#C9A961',
            boxShadow: '0 0 8px rgba(201, 169, 97, 0.4), 0 0 4px rgba(201, 169, 97, 0.6)',
          }}
          animate={{
            scale: isHovering ? 0 : 1,
            opacity: isHovering ? 0 : 1,
          }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        />

        {/* Estado Hover: Anel Metallic Gold Oco (Mira) - 44px - Centralizado */}
        <motion.div
          className="absolute rounded-full border bg-transparent"
          style={{
            width: '44px',
            height: '44px',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            borderColor: '#C9A961',
            borderWidth: '1.5px',
            boxShadow: '0 0 12px rgba(201, 169, 97, 0.3), 0 0 6px rgba(201, 169, 97, 0.5)',
          }}
          animate={{
            scale: isHovering ? 1 : 0,
            opacity: isHovering ? 1 : 0,
          }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}
