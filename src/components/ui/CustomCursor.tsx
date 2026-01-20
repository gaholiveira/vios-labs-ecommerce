'use client';

import { useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

export default function CustomCursor() {
  const [isTouchDevice, setIsTouchDevice] = useState(true); // Começar como true para evitar flash
  const [isHovering, setIsHovering] = useState(false);
  const [isOverInput, setIsOverInput] = useState(false);

  // Spring animation rápida e responsiva (magnética, mas ágil)
  const springConfig = { damping: 28, stiffness: 500, mass: 0.3 };
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

    // Função para verificar se elemento é clicável/interativo
    // Verifica o elemento e todos os seus ancestrais para garantir detecção precisa
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

        // Verificar cursor pointer (verificar estilo computado)
        try {
          const computedStyle = window.getComputedStyle(current);
          if (computedStyle.cursor === 'pointer' || computedStyle.cursor === 'grab') {
            // Verificar se não está desabilitado
            if (current.hasAttribute('disabled') || current.getAttribute('aria-disabled') === 'true') {
              current = current.parentElement;
              depth++;
              continue;
            }
            return true;
          }
        } catch (e) {
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
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);

      // Detectar elemento diretamente
      try {
        // Verificar elemento sob o cursor (funciona mesmo em elementos com z-index alto)
        const elementUnderCursor = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
        
        if (!elementUnderCursor) {
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
      } catch (error) {
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
      if (isHovering) {
        setIsHovering(false);
      }
      if (isOverInput) {
        setIsOverInput(false);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    // Inicializar posição no centro da tela para garantir visibilidade
    if (typeof window !== 'undefined') {
      cursorX.set(window.innerWidth / 2);
      cursorY.set(window.innerHeight / 2);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [cursorX, cursorY, isHovering, isOverInput]);

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
      initial={{ opacity: 1 }}
      animate={{ 
        opacity: isOverInput ? 0 : 1,
      }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
    >
      <div
        style={{
          transform: 'translate(-50%, -50%)',
        }}
      >
        {/* Estado Normal: Dot Sólido Verde - 8px */}
        <motion.div
          className="w-2 h-2 rounded-full"
          style={{
            backgroundColor: '#082f1e',
          }}
          animate={{
            scale: isHovering ? 0 : 1,
            opacity: isHovering ? 0 : 1,
          }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        />

        {/* Estado Hover: Anel Verde Oco (Mira) - 32px - Centralizado */}
        <motion.div
          className="absolute rounded-full border bg-transparent"
          style={{
            width: '32px',
            height: '32px',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            borderColor: '#082f1e',
            borderWidth: '1px',
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
