import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import { CartProvider } from '@/context/CartContext';
import './globals.css';
import Footer from '@/components/Footer';
import MobileMenu from '@/components/MobileMenu';
import SearchOverlay from '@/components/SearchOverlay';
import SmoothScrolling from '@/components/SmoothScrolling';
import ToastContainer from '@/components/ToastContainer';
import type { Metadata } from 'next';

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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="antialiased bg-white">
        <SmoothScrolling>
          <CartProvider>
            <Navbar />
            <MobileMenu />
            <SearchOverlay />
            <CartDrawer />
            <ToastContainer />
            {/* O children é onde o conteúdo da page.tsx será injetado */}
            {children}
            <Footer />
          </CartProvider>
        </SmoothScrolling>
      </body>
    </html>
  );
}