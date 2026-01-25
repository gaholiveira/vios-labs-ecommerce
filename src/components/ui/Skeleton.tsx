import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs));
}

export interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
}

/**
 * Skeleton com tailwind-merge e clsx. Estilo base: animate-pulse, rounded-md, bg-stone-100.
 * Variants: text (h-4), circular (rounded-full), rectangular (rounded-md).
 */
export function Skeleton({
  className,
  variant = "rectangular",
}: SkeletonProps) {
  const variantClasses = {
    text: "h-4 rounded",
    circular: "rounded-full",
    rectangular: "rounded-md",
  };

  return (
    <div
      className={cn(
        "animate-pulse bg-stone-100",
        variantClasses[variant],
        className,
      )}
      aria-hidden="true"
    />
  );
}

export default Skeleton;
