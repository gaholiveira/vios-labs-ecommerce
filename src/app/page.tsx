import { PRODUCTS } from "@/constants/products";
import HomeHero from "@/components/HomeHero";
import HomeProductsGrid from "@/components/HomeProductsGrid";
import HomeBelowFold from "@/components/HomeBelowFold";
import StatusStories from "@/components/StatusStories";
import TextReveal from "@/components/ui/text-reveal";
import CheckoutBenefitsBar from "@/components/CheckoutBenefitsBar";

export default function Home() {
  return (
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
  );
}
