import { PRODUCTS } from "@/constants/products";
import HomeHero from "@/components/HomeHero";
import HomeProductsGrid from "@/components/HomeProductsGrid";
import HomeBelowFold from "@/components/HomeBelowFold";
import StatusStories from "@/components/StatusStories";
import TextReveal from "@/components/ui/text-reveal";
import CheckoutBenefitsBar from "@/components/CheckoutBenefitsBar";

const HERO_URL = encodeURIComponent(
  "https://gwnegdilmazoobpexlld.supabase.co/storage/v1/object/public/site-assets/hero-foto.jpg"
);
const HERO_SRCSET = [640, 828, 1080, 1200, 1920]
  .map((w) => `/_next/image?url=${HERO_URL}&w=${w}&q=75 ${w}w`)
  .join(", ");

export default function Home() {
  return (
    <>
      {/* Preload explícito do hero — o browser começa a buscar antes do JS do Client Component */}
      <link
        rel="preload"
        as="image"
        imageSrcSet={HERO_SRCSET}
        imageSizes="100vw"
        fetchPriority="high"
      />
    <main id="main-content" className="relative">
      <HomeHero />

      <StatusStories />

      <section id="produtos" className="max-w-7xl mx-auto px-4 md:px-6 py-24">
        <div className="text-center mb-10 md:mb-12">
          <TextReveal
            text="Nossos Produtos"
            el="h2"
            className="text-3xl md:text-4xl font-light uppercase tracking-tighter text-brand-softblack mb-4"
            delay={0.2}
            duration={0.6}
          />
        </div>

        <div className="mb-12">
          <CheckoutBenefitsBar />
        </div>

        <HomeProductsGrid products={PRODUCTS} />
      </section>

      <HomeBelowFold />
    </main>
    </>
  );
}
