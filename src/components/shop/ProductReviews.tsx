"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { TESTIMONIALS } from "@/constants/testimonials";
import type { Testimonial } from "@/types/reviews";

interface ProductReviewsProps {
  /** ID do produto (prod_1, prod_2...) */
  productId?: string;
  /** ID do kit — se informado, mostra testemunhos do kit ou dos produtos do kit */
  kitId?: string;
  /** IDs dos produtos do kit (para buscar testemunhos dos produtos incluídos) */
  kitProductIds?: string[];
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill={star <= rating ? "currentColor" : "none"}
          stroke={star <= rating ? "currentColor" : "currentColor"}
          strokeWidth={1}
          className="w-4 h-4 text-brand-gold"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function TestimonialCard({
  testimonial,
  index,
}: {
  testimonial: Testimonial;
  index: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="flex flex-col p-6 md:p-8 bg-brand-offwhite/50 border border-gray-200/80 rounded-sm"
    >
      {testimonial.rating !== undefined && (
        <div className="mb-3">
          <StarRating rating={testimonial.rating} />
        </div>
      )}
      <blockquote className="text-sm md:text-base font-light text-brand-softblack/85 leading-relaxed flex-1">
        &ldquo;{testimonial.text}&rdquo;
      </blockquote>
      <footer className="mt-4 pt-4 border-t border-gray-200/60">
        <cite className="not-italic text-xs uppercase tracking-[0.15em] font-medium text-brand-softblack">
          {testimonial.author}
        </cite>
        {testimonial.context && (
          <span className="block text-[10px] uppercase tracking-wider text-brand-gold/90 font-light mt-0.5">
            {testimonial.context}
          </span>
        )}
      </footer>
    </motion.article>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-12 md:py-16 px-6 text-center border border-dashed border-gray-300 rounded-sm bg-brand-offwhite/30"
    >
      <div className="w-12 h-12 rounded-full border border-brand-gold/40 flex items-center justify-center mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1}
          stroke="currentColor"
          className="w-6 h-6 text-brand-gold"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
          />
        </svg>
      </div>
      <h3 className="text-sm uppercase tracking-[0.2em] font-light text-brand-softblack mb-2">
        Seja o primeiro a avaliar
      </h3>
      <p className="text-xs font-light text-brand-softblack/65 leading-relaxed max-w-sm">
        Após sua compra, compartilhe sua experiência e ajude outros clientes a
        conhecer os benefícios da VIOS.
      </p>
    </motion.div>
  );
}

function ProductReviews({
  productId,
  kitId,
  kitProductIds = [],
}: ProductReviewsProps) {
  const testimonials = useMemo(() => {
    return TESTIMONIALS.filter((t) => {
      if (t.kitId && kitId && t.kitId === kitId) return true;
      if (t.productId && productId && t.productId === productId) return true;
      if (t.productId && kitProductIds.includes(t.productId)) return true;
      return false;
    });
  }, [productId, kitId, kitProductIds]);

  const hasTestimonials = testimonials.length > 0;

  return (
    <section className="w-full max-w-7xl mx-auto px-6 py-16 md:py-20 border-t border-gray-200">
      <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-brand-softblack/50 mb-2">
        VIOS LABS
      </p>
      <h2 className="text-xl md:text-2xl font-light uppercase tracking-widest text-brand-softblack mb-10">
        Avaliações
      </h2>

      {hasTestimonials ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={testimonial.id}
              testimonial={testimonial}
              index={index}
            />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </section>
  );
}

export default memo(ProductReviews);
