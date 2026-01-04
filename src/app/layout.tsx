import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import { CartProvider } from '@/context/CartContext';
import './globals.css';
import Footer from '@/components/Footer';
import MobileMenu from '@/components/MobileMenu';
import SearchOverlay from '@/components/SearchOverlay';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br">
      <body className="antialiased bg-white">
        <CartProvider>
          <Navbar />
          <MobileMenu />
          <SearchOverlay />
          <CartDrawer />
          {/* O children é onde o conteúdo da page.tsx será injetado */}
          {children}
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}