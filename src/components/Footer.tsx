'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import TextReveal from '@/components/ui/text-reveal';

interface FooterProps {
  className?: string;
}

function Footer({ className = '' }: FooterProps) {
  return (
    <footer className={`bg-brand-softblack text-brand-offwhite py-16 px-6 ${className}`}>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.4 }}
        className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12"
      >
        <div>
          <h4 className="text-[10px] uppercase tracking-[0.3em] mb-6 font-bold">Menu</h4>
          <ul className="space-y-4 text-xs font-light tracking-widest opacity-80">
            <li><Link href="/" className="hover:opacity-100 transition">Produtos</Link></li>
            <li><Link href="/sobre" className="hover:opacity-100 transition">Sobre Nós</Link></li>
            <li><Link href="/contato" className="hover:opacity-100 transition">Contato</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-[10px] uppercase tracking-[0.3em] mb-6 font-bold">Ajuda</h4>
          <ul className="space-y-4 text-xs font-light tracking-widest opacity-80">
            <li><Link href="/trocas" className="hover:opacity-100 transition">Envios e Devoluções</Link></li>
            <li><Link href="/contato" className="hover:opacity-100 transition">Central de Atendimento</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-[10px] uppercase tracking-[0.3em] mb-6 font-bold">Newsletter</h4>
          <p className="text-xs font-light tracking-widest mb-4 opacity-80">Subscreve para receber novidades.</p>
          <input 
            type="email" 
            placeholder="O TEU E-MAIL" 
            className="bg-transparent border-b border-brand-offwhite/30 w-full py-2 text-[10px] focus:outline-none focus:border-brand-offwhite transition"
          />
        </div>
      </motion.div>
      
      {/* Links Legais - Fade-in simples */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="max-w-7xl mx-auto mt-12 pt-8 border-t border-brand-offwhite/10"
      >
        <div className="flex flex-wrap justify-center gap-6 text-[10px] font-light tracking-wider opacity-70">
          <Link href="/termos" className="hover:opacity-100 transition">
            Termos de Uso
          </Link>
          <Link href="/privacidade" className="hover:opacity-100 transition">
            Política de Privacidade
          </Link>
          <Link href="/trocas" className="hover:opacity-100 transition">
            Envios e Devoluções
          </Link>
        </div>
      </motion.div>

      {/* Copyright com TextReveal como assinatura final */}
      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-white/10">
        <TextReveal
          text="© 2026 VIOS LABS. Todos os direitos reservados."
          el="p"
          className="text-[10px] text-white/40 text-center font-light"
          delay={0.2}
          duration={0.6}
        />
      </div>

      {/* Dados Legais Obrigatórios - Stripe - Fade-in simples */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="max-w-7xl mx-auto mt-6 pt-6 border-t border-white/10 py-6"
      >
        {/* Desktop: Linha única com separadores */}
        <div className="hidden md:block">
          <div className="text-[10px] font-mono text-white/40 text-center leading-relaxed">
            <span>Isadora Matos Ferreira LTDA</span>
            <span className="mx-2">•</span>
            <span>CNPJ: 62.463.131/0001-62</span>
            <span className="mx-2">•</span>
            <span>Rua Cassiano Ricardo, 441 - Nova Franca, Franca - SP, CEP 14409-214</span>
            <span className="mx-2">•</span>
            <span>atendimento@vioslabs.com.br</span>
            <span className="mx-2">|</span>
            <span>(11) 95213-6713</span>
          </div>
        </div>

        {/* Mobile: Linhas quebradas e centralizadas */}
        <div className="md:hidden">
          <div className="text-[10px] font-mono text-white/40 text-center space-y-2 leading-relaxed">
            <p>Isadora Matos Ferreira LTDA</p>
            <p>CNPJ: 62.463.131/0001-62</p>
            <p>Rua Cassiano Ricardo, 441 - Nova Franca, Franca - SP, CEP 14409-214</p>
            <p>
              <span>atendimento@vioslabs.com.br</span>
              <span className="mx-2">|</span>
              <span>(11) 95213-6713</span>
            </p>
          </div>
        </div>
      </motion.div>
    </footer>
  );
}

// Memoizar Footer pois raramente muda
export default memo(Footer);