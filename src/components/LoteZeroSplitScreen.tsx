'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import LoteZeroSalesForm from './LoteZeroSalesForm';

interface LoteZeroSplitScreenProps {
  user: any;
  email: string;
  name: string;
  onEmailChange: (email: string) => void;
  onNameChange: (name: string) => void;
  onSuccess: () => void;
  onError: (error: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  error: string | null;
}

export default function LoteZeroSplitScreen({
  user,
  email,
  name,
  onEmailChange,
  onNameChange,
  onSuccess,
  onError,
  loading,
  setLoading,
  error,
}: LoteZeroSplitScreenProps) {
  return (
    <main className="min-h-screen flex flex-col md:flex-row md:h-screen">
      {/* Coluna Esquerda (50%) - Fixa - Fundo Deep Forest Green */}
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="hidden md:flex md:w-1/2 bg-brand-green relative overflow-hidden"
      >
        {/* Imagem do Produto ou Composição Abstrata */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero-foto.jpg"
            alt="Lote Zero"
            fill
            priority
            quality={90}
            sizes="50vw"
            className="object-cover object-center opacity-40"
          />
        </div>

        {/* Overlay escuro para melhor contraste */}
        <div className="absolute inset-0 bg-black/20 z-10"></div>

        {/* Conteúdo centralizado */}
        <div className="relative z-20 flex flex-col items-center justify-center px-12 w-full">
          {/* Texto sobreposto: LOTE ZERO [001/500] */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-7xl font-extralight uppercase tracking-[0.1em] text-brand-offwhite mb-8">
              LOTE ZERO
            </h1>
            <p className="text-2xl md:text-3xl font-light tracking-[0.3em] text-brand-offwhite/80">
              [001/500]
            </p>
          </motion.div>
        </div>

        {/* Rodapé da coluna: Disponibilidade */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="absolute bottom-8 left-0 right-0 z-20 text-center"
        >
          <div className="flex items-center justify-center gap-3">
            {/* Ponto verde pulsando */}
            <div className="relative">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <div className="absolute inset-0 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-75"></div>
            </div>
            <p className="text-xs uppercase tracking-wider text-brand-offwhite/90 font-light">
              Disponibilidade: Imediata
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Versão Mobile: Imagem Hero no topo */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="md:hidden relative h-[50vh] min-h-[300px] bg-brand-green overflow-hidden"
      >
        <div className="absolute inset-0">
          <Image
            src="/images/hero-foto.jpg"
            alt="Lote Zero"
            fill
            priority
            quality={90}
            sizes="100vw"
            className="object-cover object-center opacity-40"
          />
        </div>
        <div className="absolute inset-0 bg-black/20 z-10"></div>
        <div className="relative z-20 flex flex-col items-center justify-center h-full px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center"
          >
            <h1 className="text-3xl sm:text-4xl font-extralight uppercase tracking-[0.08em] text-brand-offwhite mb-3 text-center">
              LOTE ZERO
            </h1>
            <p className="text-lg sm:text-xl font-light tracking-[0.2em] text-brand-offwhite/80 text-center">
              [001/500]
            </p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2 px-4"
          >
            <div className="relative">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <div className="absolute inset-0 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-75"></div>
            </div>
            <p className="text-[10px] sm:text-xs uppercase tracking-wider text-brand-offwhite/90 font-light text-center">
              Disponibilidade: Imediata
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Coluna Direita (50%) - Scrollável - Fundo Off-White */}
      <div 
        className="md:w-1/2 w-full md:h-screen md:overflow-y-auto md:overflow-x-hidden flex-1 md:flex-none"
        data-lenis-prevent="true"
        style={{ 
          scrollBehavior: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <LoteZeroSalesForm
          user={user}
          email={email}
          name={name}
          onEmailChange={onEmailChange}
          onNameChange={onNameChange}
          onSuccess={onSuccess}
          onError={onError}
          loading={loading}
          setLoading={setLoading}
          error={error}
        />
      </div>
    </main>
  );
}
