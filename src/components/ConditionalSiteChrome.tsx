"use client";

import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const MobileMenu = dynamic(() => import("@/components/MobileMenu"));
const SearchOverlay = dynamic(() => import("@/components/SiteSearch"));

/**
 * Renderiza Navbar, MobileMenu, SearchOverlay e Footer apenas quando a rota
 * NÃO é checkout. One-page checkout: carrinho = link para /checkout (sem drawer/modal).
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
      {children}
      <Footer className="lote-zero-footer" />
    </>
  );
}
