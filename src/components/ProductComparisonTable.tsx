"use client";

import { motion } from "framer-motion";
import type { ProductComparison } from "@/constants/product-comparisons";

interface ProductComparisonTableProps {
  comparison: ProductComparison;
  productName: string;
}

export default function ProductComparisonTable({
  comparison,
  productName,
}: ProductComparisonTableProps) {
  return (
    <section className="w-full py-12 md:py-16 border-t border-gray-200">
      <h2 className="text-xl font-light uppercase tracking-[0.2em] text-brand-softblack mb-8 text-center px-4">
        VIOS vs produto comum de farmácia
      </h2>

      <div className="max-w-4xl mx-auto px-6">
        {/* Mobile: cards empilhados por critério */}
        <div className="md:hidden space-y-4">
          {comparison.rows.map((row, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-20px" }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="border border-stone-200/80 rounded-sm overflow-hidden bg-white"
            >
              <div className="px-4 py-3 bg-brand-offwhite/50 border-b border-stone-200/80">
                <span className="text-xs font-medium uppercase tracking-[0.1em] text-brand-softblack/80">
                  {row.criterion}
                </span>
              </div>
              <div className="divide-y divide-stone-100">
                <div className="flex items-start gap-3 px-4 py-3">
                  <span
                    className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-green"
                    aria-hidden
                  />
                  <div>
                    <span className="text-xs uppercase tracking-wider text-brand-green font-light block mb-0.5">
                      {productName}
                    </span>
                    <span className="text-sm text-brand-softblack/80">
                      {row.viosValue}
                    </span>
                  </div>
                </div>
                <div className="px-4 py-3">
                  <span className="text-xs uppercase tracking-wider text-brand-softblack/50 font-light block mb-0.5">
                    {comparison.pharmacyProductName}
                  </span>
                  <span className="text-sm text-brand-softblack/50 font-light">
                    {row.pharmacyValue}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Desktop: tabela */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="hidden md:block border border-stone-200/80 rounded-sm overflow-hidden"
        >
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200/80 bg-brand-offwhite/50">
                <th className="py-4 px-4 md:px-6 font-light uppercase tracking-[0.15em] text-brand-softblack/80 w-1/4 min-w-[120px]">
                  Critério
                </th>
                <th className="py-4 px-4 md:px-6 font-light uppercase tracking-[0.15em] text-brand-green">
                  {productName}
                </th>
                <th className="py-4 px-4 md:px-6 font-light uppercase tracking-[0.15em] text-brand-softblack/60">
                  {comparison.pharmacyProductName}
                </th>
              </tr>
            </thead>
            <tbody>
              {comparison.rows.map((row, index) => (
                <tr
                  key={index}
                  className="border-b border-stone-200/50 last:border-b-0 hover:bg-stone-50/50 transition-colors"
                >
                  <td className="py-4 px-4 md:px-6 font-medium text-brand-softblack/90">
                    {row.criterion}
                  </td>
                  <td className="py-4 px-4 md:px-6 text-brand-softblack/80">
                    <span className="flex items-start gap-2">
                      <span
                        className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-green"
                        aria-hidden
                      />
                      {row.viosValue}
                    </span>
                  </td>
                  <td className="py-4 px-4 md:px-6 text-brand-softblack/50 font-light">
                    {row.pharmacyValue}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        <p className="mt-4 text-xs text-center text-brand-softblack/50 font-light uppercase tracking-wider">
          Comparativo informativo. Produtos de farmácia variam conforme fabricante.
        </p>
      </div>
    </section>
  );
}
