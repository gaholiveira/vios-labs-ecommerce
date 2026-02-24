"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface ProductImageGalleryProps {
  images: string[];
  alt: string;
}

/**
 * Galeria de imagens para página de produto — estilo high-end.
 * - Imagem principal com transição suave (fade)
 * - Thumbnails discretos abaixo
 * - Clique no thumbnail para trocar
 * - Sem setas pesadas, visual minimalista
 */
export default function ProductImageGallery({ images, alt }: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleThumbnailClick = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  if (images.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {/* Imagem principal — transição suave */}
      <div className="relative bg-gray-100 aspect-3/4 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <Image
              src={images[activeIndex]}
              alt={`${alt} — imagem ${activeIndex + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority={activeIndex === 0}
              quality={90}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Thumbnails — strip minimalista */}
      {images.length > 1 && (
        <div className="flex gap-2 justify-center">
          {images.map((src, index) => (
            <button
              key={src}
              type="button"
              onClick={() => handleThumbnailClick(index)}
              className={`relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 overflow-hidden rounded-sm border transition-all duration-300 ${
                activeIndex === index
                  ? "border-brand-softblack ring-1 ring-brand-softblack/20"
                  : "border-brand-softblack/15 hover:border-brand-softblack/40"
              }`}
              aria-label={`Ver imagem ${index + 1}`}
              aria-pressed={activeIndex === index}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
