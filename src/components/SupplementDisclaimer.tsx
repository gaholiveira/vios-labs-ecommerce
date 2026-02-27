"use client";

/**
 * Aviso obrigatório para divulgação de suplementos alimentares.
 * Conforme orientações ANVISA: suplementos não substituem alimentação equilibrada;
 * recomenda-se consulta a profissional de saúde.
 */
export default function SupplementDisclaimer({
  variant = "default",
  theme = "light",
  className = "",
}: {
  variant?: "default" | "compact";
  theme?: "light" | "dark";
  className?: string;
}) {
  const text =
    "Suplementos alimentares não substituem uma alimentação equilibrada e variada. Consulte um profissional de saúde.";

  const textClass = theme === "dark" ? "text-white/55" : "text-brand-softblack/55";
  const sizeClass = variant === "compact" ? "text-[9px] tracking-[0.15em]" : "text-[10px] tracking-[0.18em]";

  return (
    <p
      className={`${sizeClass} uppercase ${textClass} leading-relaxed ${className}`}
      role="complementary"
      aria-label="Aviso sobre suplementos alimentares"
    >
      {text}
    </p>
  );
}
