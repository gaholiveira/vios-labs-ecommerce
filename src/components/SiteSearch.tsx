"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Command,
  Home,
  BookOpen,
  Sparkles,
  User,
  Package,
  X,
} from "lucide-react";
import { PRODUCTS, Product } from "@/constants/products";
import { formatPrice } from "@/utils/format";
import Image from "next/image";
import Link from "next/link";

// Palavras-chave adicionais para cada produto
const productKeywords: Record<string, string[]> = {
  prod_1: [
    "pele",
    "brilho",
    "estética",
    "cabelos",
    "unhas",
    "cápsulas",
    "dérmica",
    "hair",
    "skin",
    "nails",
  ],
  prod_2: [
    "sono",
    "melatonina",
    "repouso",
    "maracujá",
    "relaxamento",
    "circadiano",
    "descanso",
    "dormir",
  ],
  prod_3: [
    "magnésio",
    "equilíbrio",
    "ossos",
    "neuromuscular",
    "homeostase",
    "mineral",
    "ósssea",
  ],
  prod_4: [
    "energia",
    "performance",
    "foco",
    "termogênese",
    "atividade física",
    "resistência",
    "estimulante",
    "cognitiva",
  ],
  prod_5: [
    "mobilidade",
    "articulações",
    "músculos",
    "movimento",
    "inflamação",
    "lubrificação",
    "estrutural",
    "articular",
  ],
};

// Função de busca
function searchProducts(query: string): Product[] {
  if (!query.trim()) return [];

  const searchTerm = query.toLowerCase().trim();
  const searchWords = searchTerm.split(/\s+/);

  return PRODUCTS.filter((product) => {
    const nameMatch = product.name.toLowerCase().includes(searchTerm);
    const descriptionMatch = product.description
      .toLowerCase()
      .includes(searchTerm);
    const keywords = productKeywords[product.id] || [];
    const keywordMatch = keywords.some(
      (keyword) =>
        keyword.toLowerCase().includes(searchTerm) ||
        searchWords.some((word) => keyword.toLowerCase().includes(word)),
    );
    const wordMatch = searchWords.every(
      (word) =>
        product.name.toLowerCase().includes(word) ||
        product.description.toLowerCase().includes(word) ||
        keywords.some((keyword) => keyword.toLowerCase().includes(word)),
    );

    return nameMatch || descriptionMatch || keywordMatch || wordMatch;
  });
}

// Links de navegação rápida
const quickLinks = [
  { href: "/", label: "Início", icon: Home },
  { href: "/sobre", label: "Sobre Nós", icon: BookOpen },
  { href: "/kits", label: "Kits", icon: Package },
  { href: "/profile", label: "Minha Conta", icon: User },
  { href: "/orders", label: "Meus Pedidos", icon: Package },
];

export default function SiteSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  // Buscar produtos
  const searchResults = useMemo(() => {
    return searchProducts(query);
  }, [query]);

  // Atalho de teclado CMD+K / CTRL+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CMD+K no Mac, CTRL+K no Windows/Linux
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      // ESC para fechar
      if (e.key === "Escape" && open) {
        setOpen(false);
        setQuery("");
      }
    };

    window.addEventListener("keydown", handleKeyDown, { passive: true });
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Resetar query ao fechar
  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  const handleSelect = (href: string) => {
    router.push(href);
    setOpen(false);
    setQuery("");
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    // No mobile, não fechar ao clicar no backdrop (full screen)
    // Apenas no desktop com backdrop visível
    if (e.target === e.currentTarget && window.innerWidth >= 768) {
      setOpen(false);
      setQuery("");
    }
  };

  const isMac =
    typeof window !== "undefined" &&
    navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const cmdKey = isMac ? "⌘" : "Ctrl";

  return (
    <>
      {/* Botão Trigger - Desktop */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-4 py-1.5 text-xs uppercase tracking-[0.15em] font-light text-brand-softblack hover:opacity-60 transition-opacity"
        aria-label="Buscar (Cmd+K)"
      >
        <Search className="w-3.5 h-3.5" strokeWidth={1.5} />
        <span className="hidden lg:inline-flex items-center gap-1">
          <span>Buscar</span>
          <kbd className="hidden xl:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono bg-white border border-brand-softblack/10 rounded text-brand-softblack/60">
            <Command className="w-3 h-3" />
            <span>K</span>
          </kbd>
        </span>
      </button>

      {/* Botão Trigger - Mobile */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center p-2 active:opacity-70 transition-opacity"
        aria-label="Pesquisar"
      >
        <Search className="w-5 h-5 text-brand-softblack" strokeWidth={1.5} />
      </button>

      {/* Command Palette Overlay */}
      {open && (
        <div
          data-command-palette
          className="fixed inset-0 z-[100] flex items-start justify-center pt-0 md:pt-[15vh] px-0 md:px-4"
          onClick={handleBackdropClick}
        >
          {/* Backdrop - Apenas desktop */}
          <div className="hidden md:block fixed inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Command Palette Container - Full Screen Mobile, Centralizado Desktop */}
          <div className="relative flex flex-col w-screen h-screen md:w-full md:h-auto md:max-w-2xl md:max-h-[80vh] bg-[#faf9f6] md:border md:border-[#082f1e]/10 md:shadow-sm rounded-none md:rounded-lg overflow-hidden translate-y-0 md:translate-y-0">
            {/* Header com Input */}
            <div className="flex items-center gap-3 px-4 py-4 md:py-3 border-b border-[#082f1e]/10">
              <Search
                className="w-4 h-4 md:w-4 text-[#082f1e] shrink-0"
                strokeWidth={1.5}
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar produtos, páginas..."
                className="flex-1 bg-transparent outline-none text-base md:text-sm text-[#082f1e] placeholder:text-stone-400"
                autoFocus
              />
              {/* Botão Fechar - Apenas Mobile */}
              <button
                onClick={() => {
                  setOpen(false);
                  setQuery("");
                }}
                className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center text-[#082f1e] active:opacity-70 transition-opacity"
                aria-label="Fechar busca"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
              {/* KBD Atalho - Apenas Desktop */}
              <kbd className="hidden md:flex items-center gap-1 px-2 py-1 text-[10px] font-mono bg-white border border-[#082f1e]/10 rounded text-[#082f1e]/60">
                <Command className="w-3 h-3" />
                <span>K</span>
              </kbd>
            </div>

            {/* Results Container */}
            <div className="flex-1 md:max-h-[60vh] overflow-y-auto">
              {/* Quick Links - Sempre visíveis quando não há query */}
              {!query.trim() && (
                <div className="px-2 py-3 border-b border-[#082f1e]/10">
                  <div className="px-2 py-1.5 text-[10px] uppercase tracking-widest text-[#082f1e]/70 font-medium mb-2">
                    Navegação Rápida
                  </div>
                  <div className="space-y-1">
                    {quickLinks.map((link) => {
                      const IconComponent = link.icon;
                      return (
                        <button
                          key={link.href}
                          onClick={() => handleSelect(link.href)}
                          className="group w-full flex items-center gap-3 px-3 py-3 md:py-2 text-left text-sm text-stone-600 hover:bg-[#082f1e]/5 hover:text-[#082f1e] rounded-sm transition-all duration-200 border-l-2 border-transparent hover:border-[#082f1e]"
                        >
                          <IconComponent
                            className="w-4 h-4 text-[#082f1e] group-hover:text-[#082f1e]"
                            strokeWidth={1.5}
                          />
                          <span>{link.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Produtos - Quando há query */}
              {query.trim() && (
                <div className="px-2 py-3">
                  {searchResults.length > 0 ? (
                    <>
                      <div className="px-2 py-1.5 text-[10px] uppercase tracking-widest text-[#082f1e]/70 font-medium mb-2">
                        Produtos ({searchResults.length})
                      </div>
                      <div className="space-y-1">
                        {searchResults.map((product) => (
                          <Link
                            key={product.id}
                            href={`/produto/${product.id}`}
                            onClick={() => {
                              setOpen(false);
                              setQuery("");
                            }}
                            className="group flex items-center gap-3 px-3 py-3 md:py-2 text-left hover:bg-[#082f1e]/5 rounded-sm transition-all duration-200 border-l-2 border-transparent hover:border-[#082f1e]"
                          >
                            <div className="relative w-12 h-12 shrink-0 rounded-sm overflow-hidden border border-[#082f1e]/10">
                              <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-stone-600 group-hover:text-[#082f1e] transition-colors">
                                {product.name}
                              </div>
                              <div className="text-xs text-stone-400 line-clamp-1">
                                {product.description.substring(0, 60)}...
                              </div>
                            </div>
                            <div className="text-sm font-light text-[#082f1e] shrink-0">
                              {formatPrice(product.price)}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="px-3 py-8 text-center">
                      <p className="text-sm text-stone-600 mb-2">
                        Nenhum resultado encontrado para &quot;{query}&quot;
                      </p>
                      <p className="text-xs text-stone-400">
                        Tente buscar por: pele, sono, magnésio, energia,
                        mobilidade
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Sugestões quando não há query */}
              {!query.trim() && (
                <div className="px-2 py-3 border-t border-[#082f1e]/10">
                  <div className="px-2 py-1.5 text-[10px] uppercase tracking-widest text-[#082f1e]/70 font-medium mb-2">
                    Sugestões de Busca
                  </div>
                  <div className="flex flex-wrap gap-2 px-2">
                    {["pele", "sono", "magnésio", "energia", "mobilidade"].map(
                      (suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => setQuery(suggestion)}
                          className="px-3 py-1 text-xs uppercase tracking-wider border border-[#082f1e]/20 text-[#082f1e] bg-transparent hover:bg-[#082f1e] hover:text-white transition-colors rounded-sm"
                        >
                          {suggestion}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer - Apenas Desktop */}
            <div className="hidden md:block px-4 py-2 border-t border-[#082f1e]/10 bg-white/30">
              <div className="flex items-center justify-between text-[10px] text-[#082f1e]/60">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-white border border-[#082f1e]/10 rounded">
                      ↑↓
                    </kbd>
                    <span>Navegar</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-white border border-[#082f1e]/10 rounded">
                      ↵
                    </kbd>
                    <span>Selecionar</span>
                  </span>
                </div>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-white border border-[#082f1e]/10 rounded">
                    ESC
                  </kbd>
                  <span>Fechar</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
