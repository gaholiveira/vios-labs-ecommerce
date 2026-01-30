import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [414, 640, 750, 828, 1080, 1200, 1920, 2048, 3840],
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
  // ============================================================================
  // OTIMIZAÇÕES DE PERFORMANCE
  // ============================================================================
  compress: true, // Gzip/Brotli compression
  poweredByHeader: false, // Remover header X-Powered-By (segurança)
  reactStrictMode: true, // Detectar problemas comuns
  
  // ============================================================================
  // OTIMIZAÇÕES DE BUILD
  // ============================================================================
  // swcMinify removido - SWC é o minificador padrão no Next.js 16+
  ...(process.env.NODE_ENV === "production" && {
    compiler: { 
      removeConsole: { exclude: ["error", "warn"] }, // Remove console.log em produção
    },
  }),

  // ============================================================================
  // OTIMIZAÇÕES EXPERIMENTAIS
  // ============================================================================
  experimental: {
    // Otimizar imports de pacotes grandes (tree-shaking melhorado)
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  
  // ============================================================================
  // HEADERS DE SEGURANÇA E PERFORMANCE
  // ============================================================================
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Segurança
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Performance
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        // Cache otimizado para assets estáticos
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache para fontes
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // ============================================================================
  // CONFIGURAÇÃO TURBOPACK
  // ============================================================================
  // Configuração vazia do Turbopack para suprimir warning
  // O Turbopack já vem com otimizações excelentes por padrão no Next.js 16
  turbopack: {},
};

export default nextConfig;
