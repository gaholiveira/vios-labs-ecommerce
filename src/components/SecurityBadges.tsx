"use client";

import { Shield, Lock, CreditCard } from "lucide-react";

interface SecurityBadgesProps {
  /** Layout: horizontal (footer) ou compact (checkout) */
  variant?: "horizontal" | "compact";
  /** Tema: dark (footer) ou light (checkout) */
  theme?: "dark" | "light";
  className?: string;
}

const BADGES = [
  {
    icon: Lock,
    label: "Site Seguro",
    sublabel: "SSL criptografado",
  },
  {
    icon: Shield,
    label: "Compra Protegida",
    sublabel: "Dados protegidos",
  },
  {
    icon: CreditCard,
    label: "Pagamento Seguro",
    sublabel: "Pagar.me certificado",
  },
] as const;

export default function SecurityBadges({
  variant = "horizontal",
  theme = "light",
  className = "",
}: SecurityBadgesProps) {
  const isDark = theme === "dark";
  const textClass = isDark ? "text-brand-offwhite/90" : "text-brand-softblack/80";
  const subtextClass = isDark ? "text-brand-offwhite/60" : "text-brand-softblack/60";
  const iconClass = isDark ? "text-brand-gold/80" : "text-brand-green/80";

  if (variant === "compact") {
    return (
      <div
        className={`flex flex-wrap items-center justify-center gap-4 md:gap-6 ${className}`}
      >
        {BADGES.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-2"
            title={label}
          >
            <Icon
              className={`w-4 h-4 shrink-0 ${iconClass}`}
              strokeWidth={1.5}
              aria-hidden
            />
            <span className={`text-[10px] uppercase tracking-[0.15em] font-light ${textClass}`}>
              {label}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-6 md:gap-8 ${className}`}
    >
      {BADGES.map(({ icon: Icon, label, sublabel }) => (
        <div
          key={label}
          className="flex items-center gap-3"
          title={`${label} — ${sublabel}`}
        >
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              isDark ? "bg-brand-offwhite/10" : "bg-brand-green/10"
            }`}
          >
            <Icon
              className={`w-4 h-4 ${iconClass}`}
              strokeWidth={1.5}
              aria-hidden
            />
          </span>
          <div>
            <p className={`text-[10px] uppercase tracking-[0.2em] font-medium ${textClass}`}>
              {label}
            </p>
            <p className={`text-[9px] uppercase tracking-wider ${subtextClass}`}>
              {sublabel}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
