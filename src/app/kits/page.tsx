"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import KitCard from "@/components/KitCard";
import { KITS } from "@/constants/kits";
import CheckoutBenefitsBar from "@/components/CheckoutBenefitsBar";
export default function KitsPage() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const reducedMotion = useReducedMotion();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: reducedMotion ? 0 : 0.15,
      },
    },
  };

  const cardVariants = {
    hidden: {
      opacity: reducedMotion ? 1 : 0,
      y: reducedMotion ? 0 : 30,
      scale: reducedMotion ? 1 : 0.95,
    },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: reducedMotion ? 0 : 0.6,
        ease: "easeOut" as const,
      },
    },
  };

  const shouldAnimate = hasMounted && isInView;

  return (
    <main className="min-h-screen bg-brand-offwhite">
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24">
        <div className="text-center mb-10 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-light uppercase tracking-tighter text-brand-softblack mb-4">
            Protocolos & Kits
          </h1>
          <p className="text-brand-softblack/70 text-sm md:text-base font-light tracking-wide max-w-2xl mx-auto mt-4">
            Combinações científicas desenvolvidas para sinergia máxima
          </p>
        </div>

        <div className="mb-12">
          <CheckoutBenefitsBar />
        </div>

        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={shouldAnimate ? "show" : "hidden"}
          className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-x-10 sm:gap-y-16"
        >
          {KITS.map((kit) => (
            <motion.div key={kit.id} variants={cardVariants}>
              <KitCard kit={kit} />
            </motion.div>
          ))}
        </motion.div>
      </section>
    </main>
  );
}
