"use client";

import dynamic from "next/dynamic";

const ProductTestimonialsSection = dynamic(
  () => import("@/components/ProductTestimonialsSection"),
  {
    ssr: false,
    loading: () => (
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24 bg-brand-champagne/30">
        <div className="h-7 w-56 mx-auto bg-stone-200 animate-pulse rounded-sm mb-10" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 bg-white/60 animate-pulse rounded-sm border border-stone-200/80"
              aria-hidden
            />
          ))}
        </div>
      </div>
    ),
  },
);

const EssenceSection = dynamic(() => import("@/components/EssenceSection"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[200px] animate-pulse bg-brand-green/50" aria-hidden />
  ),
});

const AboutSection = dynamic(() => import("@/components/AboutSection"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[240px] animate-pulse bg-brand-offwhite/30" aria-hidden />
  ),
});

export default function HomeBelowFold() {
  return (
    <>
      <ProductTestimonialsSection />
      <EssenceSection />
      <AboutSection
        image={{
          src: "https://gwnegdilmazoobpexlld.supabase.co/storage/v1/object/public/site-assets/laboratorio/laboratorio4.jpg",
          alt: "Laboratório VIOS Labs — desenvolvimento científico",
        }}
      />
    </>
  );
}
