"use client";

import { useState } from "react";
import Image from "next/image";
import { STATUS_ITEMS } from "@/constants/status";
import type { StatusItem } from "@/constants/status";
import StatusStoriesOverlay from "./StatusStoriesOverlay";

export default function StatusStories() {
  const [activeItem, setActiveItem] = useState<StatusItem | null>(null);

  if (STATUS_ITEMS.length === 0) return null;

  return (
    <>
      <section className="w-full bg-white border-b border-brand-softblack/5 py-4">
        <div
          className="flex gap-4 overflow-x-auto scroll-smooth scrollbar-hide px-4 md:px-6 max-w-7xl mx-auto"
        >
          {STATUS_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveItem(item)}
              className="shrink-0 flex flex-col items-center gap-2 group text-left"
            >
            {/* Círculo com borda gradiente (estilo Instagram) */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full p-[3px] bg-gradient-to-br from-brand-gold via-brand-green to-brand-softblack">
              <div className="w-full h-full rounded-full overflow-hidden bg-white p-[2px]">
                <div className="relative w-full h-full rounded-full overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="80px"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                </div>
              </div>
            </div>
            <span className="text-[10px] sm:text-xs font-light text-brand-softblack/80 uppercase tracking-wider max-w-[72px] sm:max-w-[80px] truncate text-center">
              {item.title}
            </span>
          </button>
        ))}
      </div>
    </section>

    <StatusStoriesOverlay item={activeItem} onClose={() => setActiveItem(null)} />
    </>
  );
}
