// src/components/SearchOverlay.tsx
"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import { useCart } from "@/context/CartContext";
import { PRODUCTS, Product } from "@/constants/products";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/utils/format";

// Palavras-chave adicionais para cada produto (baseadas nas descrições)
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
    // Buscar no nome
    const nameMatch = product.name.toLowerCase().includes(searchTerm);

    // Buscar na descrição
    const descriptionMatch = product.description
      .toLowerCase()
      .includes(searchTerm);

    // Buscar nas palavras-chave
    const keywords = productKeywords[product.id] || [];
    const keywordMatch = keywords.some(
      (keyword) =>
        keyword.toLowerCase().includes(searchTerm) ||
        searchWords.some((word) => keyword.toLowerCase().includes(word)),
    );

    // Buscar por palavras individuais
    const wordMatch = searchWords.every(
      (word) =>
        product.name.toLowerCase().includes(word) ||
        product.description.toLowerCase().includes(word) ||
        keywords.some((keyword) => keyword.toLowerCase().includes(word)),
    );

    return nameMatch || descriptionMatch || keywordMatch || wordMatch;
  });
}

export default function SearchOverlay() {
  const { isSearchOpen, setIsSearchOpen } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Buscar produtos baseado na query
  const searchResults = useMemo(() => {
    return searchProducts(searchQuery);
  }, [searchQuery]);

  // Focar no input quando o overlay abrir
  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Limpar busca quando fechar
  useEffect(() => {
    if (!isSearchOpen) {
      setSearchQuery("");
    }
  }, [isSearchOpen]);

  // Fechar com ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };

    if (isSearchOpen) {
      window.addEventListener("keydown", handleEscape, { passive: true });
      return () => window.removeEventListener("keydown", handleEscape);
    }
  }, [isSearchOpen, setIsSearchOpen]);

  const handleProductClick = () => {
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  return (
    <div
      className={`fixed inset-0 z-[100] transition-all duration-500 ${isSearchOpen ? "translate-y-0 opacity-100 visible" : "-translate-y-full opacity-0 invisible"}`}
    >
      {/* Barra de Pesquisa */}
      <div className="bg-brand-offwhite w-full border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-20 py-6">
          <div className="flex items-center gap-4">
            <input
              ref={inputRef}
              type="text"
              placeholder="O QUE ESTÁ À PROCURA?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xl md:text-3xl font-light uppercase tracking-widest outline-none text-brand-softblack placeholder:text-gray-300"
              autoFocus={isSearchOpen}
            />
            <button
              onClick={() => setIsSearchOpen(false)}
              className="text-2xl md:text-3xl font-light text-brand-softblack hover:text-brand-green transition-colors"
              aria-label="Fechar busca"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Resultados da Busca */}
        {searchQuery.trim() && (
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-20 pb-6">
            {searchResults.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-widest text-brand-softblack/50 mb-4">
                  {searchResults.length}{" "}
                  {searchResults.length === 1
                    ? "resultado encontrado"
                    : "resultados encontrados"}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.map((product) => (
                    <Link
                      key={product.id}
                      href={`/produto/${product.id}`}
                      onClick={handleProductClick}
                      className="flex items-center gap-4 p-4 bg-white border border-gray-100 hover:border-brand-green transition-all duration-300 group"
                    >
                      <div className="relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-brand-softblack group-hover:text-brand-green transition-colors mb-1 line-clamp-1">
                          {product.name}
                        </h3>
                        <p className="text-xs text-brand-softblack/60 line-clamp-2 mb-2">
                          {product.description.substring(0, 80)}...
                        </p>
                        <p className="text-sm font-light text-brand-green">
                          {formatPrice(product.price)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-sm text-brand-softblack/60 mb-2">
                  Nenhum produto encontrado para &quot;{searchQuery}&quot;
                </p>
                <p className="text-xs text-brand-softblack/40">
                  Tente buscar por: pele, sono, magnésio, energia, mobilidade
                </p>
              </div>
            )}
          </div>
        )}

        {/* Sugestões quando não há busca */}
        {!searchQuery.trim() && (
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-20 pb-6">
            <p className="text-xs uppercase tracking-widest text-brand-softblack/50 mb-4">
              Sugestões de busca
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                "pele",
                "sono",
                "magnésio",
                "energia",
                "mobilidade",
                "performance",
                "vegano",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setSearchQuery(suggestion)}
                  className="px-4 py-2 text-xs uppercase tracking-wider border border-gray-200 text-brand-softblack hover:border-brand-green hover:text-brand-green transition-all duration-300"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Overlay Escuro para fechar ao clicar fora */}
      <div
        className="h-full w-full bg-black/20"
        onClick={() => setIsSearchOpen(false)}
      />
    </div>
  );
}
