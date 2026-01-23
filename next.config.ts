import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.in',
        pathname: '/storage/v1/object/public/**',
      },
      // Permitir localhost para desenvolvimento
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '3000',
        pathname: '/**',
      },
      // Permitir imagens do próprio domínio (produção)
      {
        protocol: 'https',
        hostname: 'vioslabs.com.br',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.vioslabs.com.br',
        pathname: '/**',
      },
    ],
    // Permitir URLs que começam com / (relativas)
    unoptimized: false,
  },
  // Otimizações de performance
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  // swcMinify removido - SWC é o minificador padrão no Next.js 16+
  
  // Otimizações experimentais para melhor performance (compatível com Turbopack)
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  
  // Configuração vazia do Turbopack para suprimir warning
  // O Turbopack já vem com otimizações excelentes por padrão no Next.js 16
  turbopack: {},
};

export default nextConfig;
