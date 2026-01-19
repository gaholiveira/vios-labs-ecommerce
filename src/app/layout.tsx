import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import { CartProvider } from '@/context/CartContext';
import './globals.css';
import Footer from '@/components/Footer';
import MobileMenu from '@/components/MobileMenu';
import SearchOverlay from '@/components/SearchOverlay';
import SmoothScrolling from '@/components/SmoothScrolling';
import ToastContainer from '@/components/ToastContainer';
import ThirdPartyScripts from '@/components/ThirdPartyScripts';
import ClientCustomCursor from '@/components/ui/ClientCustomCursor';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

// Configuração otimizada da fonte Inter com display: 'swap' para melhor performance
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
});

export const metadata: Metadata = {
  title: 'VIOS LABS | A ciência da melhor versão',
  description: 'Descubra os suplementos premium da VIOS LABS. Produtos desenvolvidos com ciência para sua melhor versão.',
  keywords: 'suplementos, saúde, bem-estar, vios labs, nutrição',
  openGraph: {
    title: 'VIOS LABS | A ciência da melhor versão',
    description: 'Descubra os suplementos premium da VIOS LABS.',
    type: 'website',
    locale: 'pt_BR',
  },
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/apple-icon.png',
    other: [
      {
        rel: 'apple-touch-icon-precomposed',
        url: '/apple-touch-icon-precomposed.png',
      },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className={`${inter.className} antialiased bg-white`}>
        <SmoothScrolling>
          <CartProvider>
            <Navbar />
            <MobileMenu />
            <SearchOverlay />
            <CartDrawer />
            <ToastContainer />
            {/* O children é onde o conteúdo da page.tsx será injetado */}
            {children}
            <Footer className="lote-zero-footer" />
          </CartProvider>
        </SmoothScrolling>
        {/* Scripts de terceiros carregados de forma otimizada */}
        <ThirdPartyScripts />
        {/* CustomCursor deve ser o ÚLTIMO elemento antes de fechar o body */}
        {/* Client Component wrapper que faz dynamic import com ssr: false */}
        <ClientCustomCursor />
      </body>
    </html>
  );
}