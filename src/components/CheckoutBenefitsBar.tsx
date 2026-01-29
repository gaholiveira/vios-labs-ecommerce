import { Truck, CreditCard, Percent } from "lucide-react";

/**
 * Faixa de benefícios de checkout
 * - Frete grátis a partir de R$ 289,90
 * - Cartão em até 3x sem juros
 * - 5% off no PIX
 *
 * Pensada para ser usada em:
 * - Home (acima das grades de produtos/kits)
 * - Páginas de produto
 * - Páginas de kit
 */
const CheckoutBenefitsBar = () => {
  return (
    <div className="w-full border border-brand-green/15 bg-brand-offwhite/70 px-4 py-3 md:px-6 md:py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
          <Truck className="w-3.5 h-3.5" aria-hidden="true" />
        </span>
        <p className="text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-brand-softblack/80 font-light">
          Frete grátis para todo o Brasil a partir de{" "}
          <span className="font-medium text-brand-green">R$ 289,90</span>
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
          <Percent className="w-3.5 h-3.5" aria-hidden="true" />
        </span>
        <p className="text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-brand-softblack/80 font-light">
          <span className="font-medium text-brand-green">5% off</span> no PIX no
          checkout
        </p>
      </div>
      <div className="flex items-center gap-2 md:justify-end">
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-softblack/5 text-brand-softblack/70">
          <CreditCard className="w-3.5 h-3.5" aria-hidden="true" />
        </span>
        <p className="text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-brand-softblack/80 font-light">
          Cartão em até{" "}
          <span className="font-medium text-brand-softblack">3x sem juros</span>{" "}
          no checkout seguro Pagar.me
        </p>
      </div>
    </div>
  );
};

export default CheckoutBenefitsBar;
