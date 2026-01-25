"use client";

import { useState, useCallback } from "react";
import { Share2 } from "lucide-react";

export interface ShareButtonProps {
  /** Título para navigator.share (ex.: nome do produto). */
  title?: string;
  /** Texto para navigator.share (ex.: descrição curta). */
  text?: string;
  /** URL para compartilhar. Se não informado, usa a URL atual. */
  url?: string;
  /** Classes adicionais no botão. */
  className?: string;
}

export function ShareButton({
  title,
  text,
  url,
  className = "",
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleClick = useCallback(async () => {
    const shareUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");
    const shareTitle = title ?? (typeof document !== "undefined" ? document.title : "");
    const shareText = text ?? "";

    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          await copyToClipboard(shareUrl);
        }
      }
      return;
    }

    await copyToClipboard(shareUrl);
  }, [title, text, url]);

  async function copyToClipboard(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* fallback silencioso */
    }
  }

  const label = copied ? "LINK COPIADO" : "COMPARTILHAR";

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex flex-row items-center gap-2 text-stone-500 hover:text-brand-green transition-colors duration-300 ${className}`.trim()}
      aria-label={label}
    >
      <Share2
        strokeWidth={1.5}
        className="w-4 h-4 shrink-0"
        aria-hidden
      />
      <span className="text-xs uppercase tracking-widest font-light">
        {label}
      </span>
    </button>
  );
}
