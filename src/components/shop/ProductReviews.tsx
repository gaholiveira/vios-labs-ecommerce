"use client";

import { memo, useMemo, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import ReviewForm from "@/components/shop/ReviewForm";

interface ProductReviewsProps {
  /** ID do produto (prod_1, prod_2...) */
  productId?: string;
  /** ID do kit — se informado, mostra testemunhos do kit ou dos produtos do kit */
  kitId?: string;
  /** IDs dos produtos do kit (para buscar testemunhos dos produtos incluídos) */
  kitProductIds?: string[];
}

interface DbReview {
  id: string;
  product_id: string;
  rating: number;
  text: string;
  author_name: string;
  created_at: string;
  image_url: string | null;
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

interface ReviewDisplay {
  id: string;
  text: string;
  author: string;
  rating: number;
  imageUrl: string | null;
}

function ReviewImageModal({
  url,
  author,
  onClose,
}: {
  url: string;
  author: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-brand-softblack/80 backdrop-blur-sm p-4 md:p-8"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label={`Foto da avaliação de ${author}`}
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.94, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar imagem"
            className="absolute -top-3 -right-3 z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center text-brand-softblack/70 hover:text-brand-softblack shadow-md transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
              aria-hidden="true"
            >
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>

          <div className="relative w-full aspect-4/3 rounded-sm overflow-hidden bg-gray-100">
            <Image
              src={url}
              alt={`Foto da avaliação de ${author}`}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 512px"
            />
          </div>

          <p className="text-center text-[10px] uppercase tracking-[0.2em] text-white/60 mt-3">
            {author}
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ReviewCard({
  review,
  index,
}: {
  review: ReviewDisplay;
  index: number;
}) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.4, delay: index * 0.08 }}
        className="flex flex-col bg-brand-offwhite/50 border border-gray-200/80 rounded-sm overflow-hidden"
      >
        {review.imageUrl && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="relative w-full aspect-4/3 shrink-0 group focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
            aria-label={`Ver foto de ${review.author}`}
          >
            <Image
              src={review.imageUrl}
              alt={`Foto da avaliação de ${review.author}`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              loading="lazy"
            />
            <span className="absolute inset-0 bg-brand-softblack/0 group-hover:bg-brand-softblack/10 transition-colors duration-300" />
            <span className="absolute bottom-2 right-2 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                className="w-3.5 h-3.5 text-brand-softblack"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
                />
              </svg>
            </span>
          </button>
        )}

        <div className="flex flex-col flex-1 p-5 md:p-6">
          <div className="mb-3">
            <StarRating rating={review.rating} />
          </div>
          <blockquote className="text-sm md:text-base font-light text-brand-softblack/85 leading-relaxed flex-1">
            &ldquo;{review.text}&rdquo;
          </blockquote>
          <footer className="mt-4 pt-4 border-t border-gray-200/60">
            <cite className="not-italic text-xs uppercase tracking-[0.15em] font-medium text-brand-softblack">
              {review.author}
            </cite>
          </footer>
        </div>
      </motion.article>

      {modalOpen && review.imageUrl && (
        <ReviewImageModal
          url={review.imageUrl}
          author={review.author}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
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

const EMPTY_IDS: string[] = [];

function ProductReviews({
  productId,
  kitId: _kitId,
  kitProductIds,
}: ProductReviewsProps) {
  const [dbReviews, setDbReviews] = useState<DbReview[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);

  const idsToFetch = productId
    ? [productId]
    : (kitProductIds?.length ? kitProductIds : EMPTY_IDS);

  const fetchReviews = useCallback(async () => {
    if (idsToFetch.length === 0) {
      setIsLoadingReviews(false);
      return;
    }
    try {
      const results = await Promise.all(
        idsToFetch.map((id) =>
          fetch(`/api/reviews?product_id=${encodeURIComponent(id)}`).then(
            (r) => r.json() as Promise<DbReview[]>,
          ),
        ),
      );
      setDbReviews(results.flat());
    } catch {
      setDbReviews([]);
    } finally {
      setIsLoadingReviews(false);
    }
  }, [productId ?? "", kitProductIds?.join(",") ?? ""]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const allReviews: ReviewDisplay[] = useMemo(
    () =>
      dbReviews.map((r) => ({
        id: r.id,
        text: r.text,
        author: r.author_name,
        rating: r.rating,
        imageUrl: r.image_url ?? null,
      })),
    [dbReviews],
  );

  const hasReviews = allReviews.length > 0;
  const showForm = !!productId;

  return (
    <section className="w-full max-w-7xl mx-auto px-6 py-16 md:py-20 border-t border-gray-200">
      <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-brand-softblack/65 mb-2">
        VIOS LABS
      </p>
      <h2 className="text-xl md:text-2xl font-light uppercase tracking-widest text-brand-softblack mb-10">
        Avaliações
      </h2>

      {showForm && (
        <div className="mb-10">
          <ReviewForm productId={productId} onSuccess={fetchReviews} />
        </div>
      )}

      {isLoadingReviews && !hasReviews ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 bg-gray-100 animate-pulse rounded-sm"
              aria-hidden
            />
          ))}
        </div>
      ) : hasReviews ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allReviews.map((review, index) => (
            <ReviewCard key={review.id} review={review} index={index} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </section>
  );
}

export default memo(ProductReviews);
