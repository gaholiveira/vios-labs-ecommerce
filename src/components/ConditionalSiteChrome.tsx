"use client";

import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";

const MobileMenu = dynamic(() => import("@/components/MobileMenu"));
const SearchOverlay = dynamic(() => import("@/components/SiteSearch"));
const CartDrawer = dynamic(() => import("@/components/cart/CartDrawer"));
const WhatsAppButton = dynamic(() => import("@/components/WhatsAppButton"), {
  ssr: false,
});
const Footer = dynamic(() => import("@/components/Footer"), { ssr: false });

/**
 * Renderiza Navbar, MobileMenu, SearchOverlay e Footer apenas quando a rota
 * NÃO é checkout. One-page checkout: sacola = link para /checkout (drawer lateral).
 */
export default function ConditionalSiteChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isCheckoutRoute =
    pathname === "/checkout" || pathname?.startsWith("/checkout/");

  if (isCheckoutRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <MobileMenu />
      <SearchOverlay />
      <CartDrawer />
      <WhatsAppButton />
      <div id="main-content" tabIndex={-1}>
        {children}
      </div>
      <Footer className="lote-zero-footer" />
    </>
  );
}
