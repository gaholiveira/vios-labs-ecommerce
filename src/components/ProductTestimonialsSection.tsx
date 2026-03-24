"use client";

import { useEffect, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { PRODUCTS } from "@/constants/products";

interface FeaturedReview {
  id: string;
  product_id: string;
  rating: number;
  text: string;
  author_name: string;
  created_at: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" role="img" aria-label={`${rating} de 5 estrelas`}>
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

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "…";
}

const productNameById = new Map(PRODUCTS.map((p) => [p.id, p.name]));

export default function ProductTestimonialsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const prefersReducedMotion = useReducedMotion();
  const [reviews, setReviews] = useState<FeaturedReview[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/reviews/featured")
      .then((r) => r.json())
      .then((data) => {
        setReviews(Array.isArray(data) ? data : []);
        setLoaded(true);
      })
      .catch(() => {
        setReviews([]);
        setLoaded(true);
      });
  }, []);

  return (
    <section
      ref={ref}
      className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24 bg-brand-champagne/30"
      aria-labelledby="testimonials-heading"
    >
      {loaded && (
        <>
          <motion.h2
            id="testimonials-heading"
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="text-center text-xl md:text-3xl font-light uppercase tracking-[0.15em] md:tracking-[0.2em] text-brand-softblack mb-8 md:mb-12 max-w-md mx-auto md:max-w-none"
          >
            A experiência de quem usa
          </motion.h2>

          {reviews.length > 0 ? (
            <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible md:pb-0 scrollbar-hide">
              {reviews.map((review, index) => {
                const productName = productNameById.get(review.product_id) ?? "Produto";
                return (
                  <motion.article
                    key={review.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{
                      duration: prefersReducedMotion ? 0 : 0.4,
                      delay: prefersReducedMotion ? 0 : index * 0.08,
                    }}
                    className="flex flex-col p-4 md:p-6 lg:p-8 bg-brand-offwhite border border-stone-200/80 rounded-sm shadow-sm shrink-0 w-[85vw] min-w-[280px] md:w-auto md:min-w-0 snap-center"
                  >
                    <div className="mb-2 md:mb-3">
                      <StarRating rating={review.rating} />
                    </div>
                    <blockquote className="text-sm font-light text-brand-softblack/85 leading-relaxed flex-1 line-clamp-4 md:line-clamp-none">
                      &ldquo;{truncateText(review.text, 140)}&rdquo;
                    </blockquote>
                    <footer className="mt-3 pt-3 md:mt-4 md:pt-4 border-t border-stone-200/60 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                      <div className="flex items-center gap-2 md:gap-3">
                        <span
                          className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-brand-green/10 flex items-center justify-center text-[10px] md:text-xs font-medium uppercase tracking-wider text-brand-green shrink-0"
                          aria-hidden
                        >
                          {getInitials(review.author_name)}
                        </span>
                        <cite className="not-italic text-xs uppercase tracking-[0.12em] md:tracking-[0.15em] font-medium text-brand-softblack truncate">
                          {review.author_name}
                        </cite>
                      </div>
                      <span className="text-[11px] md:text-xs uppercase tracking-[0.1em] md:tracking-[0.12em] text-brand-softblack/60">
                        {productName}
                      </span>
                    </footer>
                  </motion.article>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-stone-300 rounded-sm bg-brand-offwhite/50">
              <p className="text-sm uppercase tracking-[0.2em] font-light text-brand-softblack/70">
                Seja o primeiro a compartilhar sua experiência
              </p>
              <p className="mt-2 text-xs text-brand-softblack/50">
                Após sua compra, sua avaliação pode aparecer aqui.
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
