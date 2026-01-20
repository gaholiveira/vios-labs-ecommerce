import Navbar from '@/components/Navbar';
import { CartProvider } from '@/context/CartContext';
import './globals.css';
import Footer from '@/components/Footer';
import SmoothScrolling from '@/components/SmoothScrolling';
import ToastContainer from '@/components/ToastContainer';
import ThirdPartyScripts from '@/components/ThirdPartyScripts';
import ClientCustomCursor from '@/components/ui/ClientCustomCursor';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import dynamic from 'next/dynamic';

// Lazy load de componentes pesados que não são críticos para o primeiro render
// Removido ssr: false pois esses componentes já são Client Components
const CartDrawer = dynamic(() => import('@/components/CartDrawer'));

const MobileMenu = dynamic(() => import('@/components/MobileMenu'));

const SearchOverlay = dynamic(() => import('@/components/SearchOverlay'));

// Configuração otimizada da fonte Inter com display: 'swap' para melhor performance
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vioslabs.com.br';
const siteName = 'VIOS LABS';
const siteDescription = 'Descubra os suplementos premium da VIOS LABS. Produtos desenvolvidos com ciência para sua melhor versão.';
const ogImage = `${siteUrl}/images/og-image.jpg`; // Certifique-se de criar este arquivo (1200x630px)

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} | A Ciência da Longevidade`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: ['suplementos', 'saúde', 'bem-estar', 'vios labs', 'nutrição', 'longevidade', 'performance', 'ciência'],
  authors: [{ name: 'VIOS LABS' }],
  creator: 'VIOS LABS',
  publisher: 'VIOS LABS',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: siteUrl,
    siteName,
    title: `${siteName} | A Ciência da Longevidade`,
    description: siteDescription,
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: 'VIOS LABS - A Ciência da Longevidade',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteName} | A Ciência da Longevidade`,
    description: siteDescription,
    images: [ogImage],
  },
  alternates: {
    canonical: siteUrl,
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