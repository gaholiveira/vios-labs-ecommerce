import { CartProvider } from "@/context/CartContext";
import SkipLink from "@/components/SkipLink";
import "./globals.css";
import SmoothScrolling from "@/components/SmoothScrolling";
import ThirdPartyScripts from "@/components/ThirdPartyScripts";
import ClientCustomCursor from "@/components/ui/ClientCustomCursor";
import ClientToastContainer from "@/components/ui/ClientToastContainer";
import ConditionalSiteChrome from "@/components/ConditionalSiteChrome";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

// Permite zoom por pinch no mobile; evita sensação de zoom instável ao não restringir o usuário
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  userScalable: true,
  themeColor: "#0a3323",
};

// Configuração otimizada da fonte Inter: display: 'optional' evita bloqueio de renderização (LCP)
// O texto é exibido imediatamente com fallback; a fonte customizada só é aplicada se carregar em ~100ms
const inter = Inter({
  subsets: ["latin"],
  display: "optional",
  variable: "--font-inter",
  preload: true,
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vioslabs.com.br";
const siteName = "VIOS LABS";
const siteDescription =
  "Descubra os suplementos premium da VIOS LABS. Produtos desenvolvidos com ciência para sua melhor versão.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} | A Ciência da Longevidade`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    "suplementos",
    "saúde",
    "bem-estar",
    "vios labs",
    "nutrição",
    "longevidade",
    "performance",
    "ciência",
  ],
  authors: [{ name: "VIOS LABS" }],
  creator: "VIOS LABS",
  publisher: "VIOS LABS",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: siteUrl,
    siteName,
    title: `${siteName} | A Ciência da Longevidade`,
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} | A Ciência da Longevidade`,
    description: siteDescription,
  },
  alternates: {
    canonical: siteUrl,
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: siteName,
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className={`${inter.className} antialiased bg-white`}>
        <SkipLink />
        <SmoothScrolling>
          <CartProvider>
            <ConditionalSiteChrome>{children}</ConditionalSiteChrome>
            <ClientToastContainer />
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
