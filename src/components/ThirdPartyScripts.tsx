'use client';

import Script from 'next/script';

const GA_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ??
  process.env.NEXT_PUBLIC_GA_ID?.trim();

/**
 * Componente para carregar scripts de terceiros de forma otimizada
 * Usa 'afterInteractive' ou 'lazyOnload' para não bloquear a thread principal
 *
 * Google Analytics 4: defina NEXT_PUBLIC_GA_MEASUREMENT_ID ou NEXT_PUBLIC_GA_ID (G-XXXXXXXXXX)
 */
export default function ThirdPartyScripts() {
  return (
    <>
      {GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}');
            `}
          </Script>
        </>
      )}

      {/* Facebook Pixel - Estratégia lazyOnload para carregar apenas quando necessário */}
      {/* 
      {process.env.NEXT_PUBLIC_FB_PIXEL_ID && (
        <Script id="facebook-pixel" strategy="lazyOnload">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${process.env.NEXT_PUBLIC_FB_PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}
      */}
    </>
  );
}
