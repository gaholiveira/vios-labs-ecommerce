"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import ProductCard from "@/components/ProductCard";
import KitsPreviewCard from "@/components/KitsPreviewCard";
import type { Product } from "@/constants/products";

interface ReviewSummary {
  product_id: string;
  rating: number;
  reviews: number;
}

interface InventoryItem {
  product_id: string;
  available_quantity: number;
}

interface HomeProductsGridProps {
  products: Product[];
}

export default function HomeProductsGrid({ products }: HomeProductsGridProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const prefersReducedMotion = useReducedMotion();
  const [hasMounted, setHasMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary[]>([]);
  const [inventoryStatus, setInventoryStatus] = useState<InventoryItem[]>([]);

  useEffect(() => {
    if (!isInView) return;
    fetch("/api/reviews/summary")
      .then((r) => r.json())
      .then((data) => setReviewSummary(Array.isArray(data) ? data : []))
      .catch(() => setReviewSummary([]));
  }, [isInView]);

  useEffect(() => {
    if (!isInView) return;
    fetch("/api/inventory/status")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setInventoryStatus(
            data
              .filter((d: { product_id?: string }) => d?.product_id)
              .map(
                (d: {
                  product_id: string;
                  available_quantity?: number;
                }) => ({
                  product_id: d.product_id,
                  available_quantity: Number(d.available_quantity) || 0,
                }),
              ),
          );
        }
      })
      .catch(() => setInventoryStatus([]));
  }, [isInView]);

  const productsWithReviews = useMemo(() => {
    const byId = new Map(reviewSummary.map((s) => [s.product_id, s]));
    const invById = new Map(
      inventoryStatus.map((i) => [i.product_id, i.available_quantity]),
    );
    return products.map((p) => {
      const s = byId.get(p.id);
      const avail = invById.get(p.id);
      return {
        ...p,
        rating: s?.rating,
        reviews: s?.reviews,
        availableQuantity: avail,
      };
    });
  }, [products, reviewSummary, inventoryStatus]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setHasMounted(true);
        setReducedMotion(Boolean(prefersReducedMotion));
      });
    });
    return () => cancelAnimationFrame(id);
  }, [prefersReducedMotion]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: reducedMotion ? 0 : 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: {
      opacity: reducedMotion ? 1 : 0,
      y: reducedMotion ? 0 : 20,
    },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reducedMotion ? 0 : 0.5,
        ease: "easeOut" as const,
      },
    },
  };

  const shouldAnimate = hasMounted && isInView;

  return (
    <motion.div
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={shouldAnimate ? "show" : "hidden"}
      className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-x-10 sm:gap-y-16 items-stretch"
    >
      {productsWithReviews.map((product, index) => (
        <motion.div key={product.id} variants={cardVariants} className="h-full">
          {/* Apenas os 2 primeiros cards acima do fold recebem priority */}
          <ProductCard product={product} priority={index < 2} />
        </motion.div>
      ))}
      <motion.div variants={cardVariants} className="h-full">
        <KitsPreviewCard />
      </motion.div>
    </motion.div>
  );
}
