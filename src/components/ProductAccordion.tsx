"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface AccordionItem {
  title: string;
  content: string | ReactNode;
}

interface ProductAccordionProps {
  items: AccordionItem[];
}

export default function ProductAccordion({ items }: ProductAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="w-full border-t border-gray-200 mt-8">
      {items.map((item, index) => (
        <div key={index} className="border-b border-gray-200">
          {/* Cabeçalho do Accordion */}
          <button
            onClick={() => toggleItem(index)}
            className="w-full flex justify-between items-center py-4 text-left min-h-[44px] active:opacity-70 md:hover:opacity-70 transition-opacity"
            aria-expanded={openIndex === index}
            aria-controls={`accordion-content-${index}`}
          >
            <h3 className="text-sm uppercase tracking-[0.1em] font-light text-brand-softblack">
              {item.title}
            </h3>
            <motion.div
              animate={{ rotate: openIndex === index ? 45 : 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex-shrink-0 ml-4"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 text-brand-softblack"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
            </motion.div>
          </button>

          {/* Conteúdo do Accordion */}
          <AnimatePresence initial={false}>
            {openIndex === index && (
              <motion.div
                id={`accordion-content-${index}`}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="pb-4 text-sm font-light text-brand-softblack/70 leading-relaxed">
                  {item.content}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
