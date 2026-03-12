'use client';

import Script from 'next/script';

const GA_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ??
  process.env.NEXT_PUBLIC_GA_ID?.trim();

const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID?.trim();

/**
 * Google Analytics 4 — usa o snippet padrão do Google
 * Variáveis: NEXT_PUBLIC_GA_MEASUREMENT_ID ou NEXT_PUBLIC_GA_ID (ex: G-XXXXXXXXXX)
 * lazyOnload = carrega em idle, fora do caminho crítico (evita bloquear LCP)
 */
export default function ThirdPartyScripts() {
  return (
    <>
      {GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="lazyOnload"
          />
          <Script id="google-analytics" strategy="lazyOnload">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}');
            `}
          </Script>
        </>
      )}

      {/* Meta Pixel — lazyOnload para não bloquear LCP */}
      {/* Variável: NEXT_PUBLIC_FB_PIXEL_ID (ex: 123456789012345) */}
      {FB_PIXEL_ID && (
        <Script id="meta-pixel" strategy="lazyOnload">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${FB_PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}
    </>
  );
}
