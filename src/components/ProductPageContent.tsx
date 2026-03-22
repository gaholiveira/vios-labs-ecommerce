"use client";

import { useEffect, useState, useCallback, useMemo, memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { formatPrice, formatUnitsSoldForDisplay } from "@/utils/format";
import ProductAccordion from "@/components/ProductAccordion";
import ProductImageGallery from "@/components/ProductImageGallery";
import KeyIngredients from "@/components/KeyIngredients";
import WaitlistModal from "@/components/WaitlistModal";
import TextReveal from "@/components/ui/text-reveal";
import { ShareButton } from "@/components/shop/ShareButton";
import { ProductShippingCalculator } from "@/components/shop/ProductShippingCalculator";
import FrequentlyBoughtTogether from "@/components/shop/FrequentlyBoughtTogether";
import ProductReviews from "@/components/shop/ProductReviews";
import { Product } from "@/constants/products";
import { getFrequentlyBoughtTogetherProducts } from "@/utils/recommendations";
import {
  LOW_STOCK_DISPLAY_THRESHOLD,
  LAST_UNITS_THRESHOLD,
  FEW_UNITS_THRESHOLD,
} from "@/lib/checkout-config";
import { useAuth } from "@/hooks/useAuth";
import CheckoutBenefitsBar from "@/components/CheckoutBenefitsBar";
import ProductTrustSeals from "@/components/ProductTrustSeals";
import ProductValueProposition from "@/components/ProductValueProposition";
import NutritionalTable, {
  GLOW_NUTRITIONAL_DATA,
  MAG3_NUTRITIONAL_DATA,
  MOVE_NUTRITIONAL_DATA,
  PULSE_NUTRITIONAL_DATA,
  SLEEP_NUTRITIONAL_DATA,
} from "@/components/NutritionalTable";
import ProductComparisonTable from "@/components/ProductComparisonTable";
import StickyBar from "@/components/StickyBar";
import { getProductComparison } from "@/constants/product-comparisons";
import { trackViewItem } from "@/lib/analytics";
import type { InventoryStatus } from "@/types/database";

interface ProductPageContentProps {
  product: Product;
}

function ProductPageContent({ product }: ProductPageContentProps) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryStatus | null>(null);
  const [isLoadingInventory, setIsLoadingInventory] = useState(true);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [reviewsSummary, setReviewsSummary] = useState<{ rating: number; reviews: number } | null>(null);

  // Garantir que a página sempre comece no topo ao carregar
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    if (typeof window !== "undefined" && window.history.scrollRestoration) {
      window.history.scrollRestoration = "manual";
    }
  }, [product.id]);

  // Analytics: view_item
  useEffect(() => {
    trackViewItem({
      itemId: product.id,
      itemName: product.name,
      price: product.price,
      category: product.category,
      isKit: false,
    });
  }, [product.id, product.name, product.price, product.category]);

  // Buscar estoque do produto
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setIsLoadingInventory(true);
        const response = await fetch(
          `/api/inventory/status?product_id=${product.id}`,
        );

        if (response.ok) {
          const data = await response.json();
          setInventory(data);
        }
      } catch (error) {
        console.error("Error fetching inventory:", error);
        // Se falhar, assumir que está disponível (fallback)
        setInventory(null);
      } finally {
        setIsLoadingInventory(false);
      }
    };

    fetchInventory();
  }, [product.id]);

  // Buscar resumo de avaliações (prova social)
  useEffect(() => {
    fetch("/api/reviews/summary")
      .then((r) => r.json())
      .then((data: Array<{ product_id: string; rating: number; reviews: number }>) => {
        const found = Array.isArray(data) ? data.find((s) => s.product_id === product.id) : null;
        setReviewsSummary(found ? { rating: found.rating, reviews: found.reviews } : null);
      })
      .catch(() => setReviewsSummary(null));
  }, [product.id]);

  const handleAddToCart = useCallback(() => {
    addToCart(product);
  }, [addToCart, product]);

  const handleBuyNow = useCallback(() => {
    addToCart(product, false);
  }, [addToCart, product]);

  const handleWaitlistClick = useCallback(() => {
    setShowWaitlistModal(true);
  }, []);

  const handleWaitlistClose = useCallback(() => {
    setShowWaitlistModal(false);
  }, []);

  // Determinar se o produto está disponível - Memoizado (inclui soldOut do catálogo)
  const isOutOfStock = useMemo(() => {
    if (product.soldOut) return true;
    return inventory !== null && inventory.available_quantity === 0;
  }, [inventory, product.soldOut]);

  const isLowStock = useMemo(() => {
    if (!inventory || inventory.available_quantity <= 0) return false;
    return inventory.available_quantity <= LOW_STOCK_DISPLAY_THRESHOLD;
  }, [inventory]);

  const isLastUnits = useMemo(() => {
    if (!inventory || inventory.available_quantity <= 0) return false;
    return inventory.available_quantity <= LAST_UNITS_THRESHOLD;
  }, [inventory]);

  const isFewUnits = useMemo(() => {
    if (!inventory || inventory.available_quantity <= 0) return false;
    return (
      inventory.available_quantity <= FEW_UNITS_THRESHOLD &&
      inventory.available_quantity > LAST_UNITS_THRESHOLD
    );
  }, [inventory]);

  const recommendedProducts = useMemo(
    () => getFrequentlyBoughtTogetherProducts(product.id),
    [product.id]
  );

  const productComparison = useMemo(
    () => getProductComparison(product.id),
    [product.id]
  );

  // Conteúdo específico para cada produto
  const getProductSpecificContent = (productId: string) => {
    if (productId === "prod_1") {
      // VIOS Glow — Hair, Skin & Nails (cápsulas)
      const keyIngredients = [
        { name: "Complexo B + Biotina", benefit: "Suporte estrutural para cabelos, pele e unhas" },
        { name: "Vitamina C (90 mg)", benefit: "Poderoso antioxidante e cofator essencial para o colágeno" },
        { name: "Vitamina A (250 µg)", benefit: "Integridade e renovação da pele" },
        { name: "Zinco (11 mg)", benefit: "Síntese proteica e renovação celular" },
        { name: "Selênio (45 µg)", benefit: "Proteção antioxidante e saúde capilar" },
      ];
      return {
        accordionItems: [
          {
            title: "Benefícios da fórmula",
            content: (
              <ul className="space-y-4 list-none">
                <li className="flex gap-2">
                  <span className="text-[#082f1e] shrink-0">•</span>
                  <div>
                    <span className="text-brand-softblack/80 font-medium block">Suporte à saúde da pele</span>
                    <span className="text-brand-softblack/60 text-sm block mt-0.5">Nutrientes que contribuem para a manutenção da estrutura cutânea.</span>
                  </div>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#082f1e] shrink-0">•</span>
                  <div>
                    <span className="text-brand-softblack/80 font-medium block">Contribui para cabelos e unhas</span>
                    <span className="text-brand-softblack/60 text-sm block mt-0.5">Vitaminas e minerais importantes para tecidos queratinizados.</span>
                  </div>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#082f1e] shrink-0">•</span>
                  <div>
                    <span className="text-brand-softblack/80 font-medium block">Ação antioxidante</span>
                    <span className="text-brand-softblack/60 text-sm block mt-0.5">Auxilia na proteção contra o estresse oxidativo.</span>
                  </div>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#082f1e] shrink-0">•</span>
                  <div>
                    <span className="text-brand-softblack/80 font-medium block">Nutrição celular</span>
                    <span className="text-brand-softblack/60 text-sm block mt-0.5">Participa de processos metabólicos relacionados à renovação celular.</span>
                  </div>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#082f1e] shrink-0">•</span>
                  <div>
                    <span className="text-brand-softblack/80 font-medium block">Beleza de dentro para fora</span>
                    <span className="text-brand-softblack/60 text-sm block mt-0.5">Suporte nutricional para quem busca cuidar da aparência de forma integrada.</span>
                  </div>
                </li>
              </ul>
            ),
          },
          {
            title: "Para quem foi desenvolvido",
            content: (
              <ul className="space-y-3 list-none">
                <li className="flex gap-2">
                  <span className="text-[#082f1e]">•</span>
                  <span className="text-brand-softblack/80">Pessoas que desejam complementar cuidados com pele, cabelo e unhas</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#082f1e]">•</span>
                  <span className="text-brand-softblack/80">Quem busca suporte nutricional para beleza e bem-estar</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#082f1e]">•</span>
                  <span className="text-brand-softblack/80">Quem valoriza uma abordagem de autocuidado de dentro para fora</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#082f1e]">•</span>
                  <span className="text-brand-softblack/80">Pessoas que desejam complementar a ingestão de micronutrientes</span>
                </li>
              </ul>
            ),
          },
          {
            title: "Como Usar",
            content:
              "Recomendamos o consumo de 2 (duas) cápsulas por dia, preferencialmente acompanhadas de uma refeição. Para melhores resultados, mantenha uma rotina consistente, permitindo que os nutrientes atuem na arquitetura celular de cabelos, pele e unhas a longo prazo.",
          },
          {
            title: "Ingredientes",
            content: (
              <div className="space-y-4">
                <div>
                  <strong className="text-[#082f1e] font-medium">
                    Vitaminas:
                  </strong>{" "}
                  <span className="text-brand-softblack/70">
                    A (250 µg), E (15 mg), C (90 mg), B1 (1,2 mg), B2 (1,2 mg),
                    B3 (15 mg NE), B5 (5 mg), B6 (1,3 mg), Biotina (30 µg), B9
                    (400 µg DFE), B12 (2,4 µg).
                  </span>
                </div>
                <div>
                  <strong className="text-[#082f1e] font-medium">
                    Minerais:
                  </strong>{" "}
                  <span className="text-brand-softblack/70">
                    Cálcio (200 mg), Cromo (35 µg), Selênio (45 µg), Zinco (11
                    mg).
                  </span>
                </div>
                <div>
                  <strong className="text-[#082f1e] font-medium">
                    Apresentação:
                  </strong>{" "}
                  <span className="text-brand-softblack/70">
                    60 cápsulas de 550 mg. Dose: 2 cápsulas ao dia.
                  </span>
                </div>
                <div>
                  <strong className="text-[#082f1e] font-medium">
                    Segurança Biológica:
                  </strong>{" "}
                  <span className="text-brand-softblack/70">
                    Fórmula rigorosamente livre de glúten e alérgenos comuns.
                  </span>
                </div>
              </div>
            ),
          },
          {
            title: "Informação Nutricional",
            content: (
              <div className="max-w-sm">
                <NutritionalTable {...GLOW_NUTRITIONAL_DATA} />
              </div>
            ),
          },
          {
            title: "Ciência",
            content:
              "O diferencial do VIOS Glow reside na sua fórmula completa de vitaminas e minerais essenciais para a saúde estrutural. O complexo B potencializado, associado ao antioxidante Vitamina C e ao Zinco, atua na síntese de colágeno e na renovação celular. A Biotina e o Selênio contribuem para o suporte de cabelos e unhas. Esta forma de entrega em cápsulas otimiza a biodisponibilidade, permitindo que os nutrientes essenciais sejam absorvidos durante a digestão e alcancem as camadas estruturais da derme de dentro para fora.",
          },
        ],
        keyIngredients,
      };
    }

    if (productId === "prod_2") {
      // VIOS Sleep
      const keyIngredients = [
        { name: "Melatonina", benefit: "Ativo central para a regulação do ciclo do sono" },
        { name: "Base de Alta Absorção", benefit: "Água Purificada e Glicerina para entrega precisa dos ativos" },
        { name: "Experiência Sensorial", benefit: "Aroma Natural de Maracujá, refinado e relaxante" },
        { name: "Zero Açúcar", benefit: "Edulcorante Sucralose com doçura equilibrada e zero índice glicêmico" },
      ];
      return {
        accordionItems: [
          {
            title: "Benefícios da fórmula",
            content: (
              <ul className="space-y-4 list-none">
                <li className="flex gap-2">
                  <span className="text-[#082f1e] shrink-0">•</span>
                  <div>
                    <span className="text-brand-softblack/80 font-medium block">Auxilia no início do sono</span>
                    <span className="text-brand-softblack/60 text-sm block mt-0.5">A melatonina auxilia o organismo a reconhecer o momento natural de repouso, favorecendo o adormecer.</span>
                  </div>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#082f1e] shrink-0">•</span>
                  <div>
                    <span className="text-brand-softblack/80 font-medium block">Contribui para um sono mais profundo e restaurador</span>
                    <span className="text-brand-softblack/60 text-sm block mt-0.5">O suporte ao ciclo circadiano ajuda a melhorar a qualidade do descanso noturno.</span>
                  </div>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#082f1e] shrink-0">•</span>
                  <div>
                    <span className="text-brand-softblack/80 font-medium block">Regulação do ritmo biológico</span>
                    <span className="text-brand-softblack/60 text-sm block mt-0.5">Auxilia na harmonização do ciclo natural de sono e vigília, especialmente em rotinas intensas ou com exposição à luz artificial.</span>
                  </div>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#082f1e] shrink-0">•</span>
                  <div>
                    <span className="text-brand-softblack/80 font-medium block">Solução líquida de alta absorção</span>
                    <span className="text-brand-softblack/60 text-sm block mt-0.5">A apresentação líquida facilita o uso e permite absorção eficiente pelo organismo.</span>
                  </div>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#082f1e] shrink-0">•</span>
                  <div>
                    <span className="text-brand-softblack/80 font-medium block">Experiência sensorial suave</span>
                    <span className="text-brand-softblack/60 text-sm block mt-0.5">Delicado sabor de maracujá pensado para integrar-se naturalmente ao ritual noturno.</span>
                  </div>
                </li>
              </ul>
            ),
          },
          {
            title: "Para quem foi desenvolvido",
            content: (
              <ul className="space-y-3 list-none">
                <li className="flex gap-2">
                  <span className="text-[#082f1e]">•</span>
                  <span className="text-brand-softblack/80">Pessoas que buscam melhorar a rotina de sono</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#082f1e]">•</span>
                  <span className="text-brand-softblack/80">Quem possui rotina intensa e deseja suporte para descanso adequado</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#082f1e]">•</span>
                  <span className="text-brand-softblack/80">Pessoas que valorizam recuperação e qualidade do sono</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#082f1e]">•</span>
                  <span className="text-brand-softblack/80">Quem deseja complementar hábitos voltados ao descanso noturno</span>
                </li>
              </ul>
            ),
          },
          {
            title: "Como Usar",
            content:
              "Para uma transição suave ao sono reparador, ingira 1 (uma) gota ao dia, preferencialmente 30 minutos antes do repouso. Mantenha o frasco ao abrigo de luz e calor para preservar a integridade da fórmula.",
          },
          {
            title: "Ingredientes",
            content: (
              <div className="space-y-4">
                <div>
                  <strong className="text-[#082f1e] font-medium">
                    Melatonina:
                  </strong>{" "}
                  <span className="text-brand-softblack/70">
                    Ativo central para a regulação do ciclo do sono.
                  </span>
                </div>
                <div>
                  <strong className="text-[#082f1e] font-medium">
                    Base de Alta Absorção:
                  </strong>{" "}
                  <span className="text-brand-softblack/70">
                    Água Purificada e Glicerina para entrega precisa dos ativos.
                  </span>
                </div>
                <div>
                  <strong className="text-[#082f1e] font-medium">
                    Experiência Sensorial:
                  </strong>{" "}
                  <span className="text-brand-softblack/70">
                    Aroma Natural de Maracujá, refinado e relaxante.
                  </span>
                </div>
                <div>
                  <strong className="text-[#082f1e] font-medium">
                    Zero Açúcar:
                  </strong>{" "}
                  <span className="text-brand-softblack/70">
                    Edulcorante Sucralose com doçura equilibrada e zero índice
                    glicêmico.
                  </span>
                </div>
                <div>
                  <strong className="text-[#082f1e] font-medium">
                    Conservação e Pureza:
                  </strong>{" "}
                  <span className="text-brand-softblack/70">
                    Ácido cítrico, benzoato de sódio e sorbato de potássio.
                  </span>
                </div>
                <div>
                  <strong className="text-[#082f1e] font-medium">
                    Segurança Biológica:
                  </strong>{" "}
                  <span className="text-brand-softblack/70">
                    Fórmula rigorosamente livre de glúten, adequada para os mais
                    altos padrões alimentares.
                  </span>
                </div>
              </div>
            ),
          },
          {
            title: "Informação Nutricional",
            content: (
              <div className="max-w-sm">
                <NutritionalTable {...SLEEP_NUTRITIONAL_DATA} />
              </div>
            ),
          },
          {
            title: "Ciência",
            content: (
              <span>
                A inteligência do VIOS Sleep reside na entrega de{" "}
                <strong className="text-[#082f1e] font-medium">0,2 mg</strong>{" "}
                de melatonina de alta pureza por gota. Esta concentração foi
                estrategicamente calculada para sinalizar ao sistema nervoso o
                início do desligamento sistêmico, auxiliando na redução do tempo
                para adormecer e na mitigação de distúrbios como o jet lag. Ao
                regular o relógio biológico de forma não medicamentosa, a
                fórmula apoia a homeostase celular, fundamental para a
                regeneração noturna e o equilíbrio das funções cognitivas.
              </span>
            ),
          },
        ],
        keyIngredients,
      };
    }

    if (productId === "prod_3") {
      // VIOS MAG3
      const keyIngredients = [
        { name: "Bisglicinato de Magnésio", benefit: "Forma quelatada para máxima absorção e conforto digestivo" },
        { name: "Magnésio Dimalato", benefit: "Reconhecido por seu suporte prolongado à vitalidade e função muscular" },
        { name: "Óxido de Magnésio", benefit: "Concentração estratégica para complementar o pool mineral" },
        { name: "Pureza Farmacêutica", benefit: "Antiumectantes estearato de magnésio e dióxido de silício para estabilidade" },
      ];
      return {
        accordionItems: [
          {
            title: "Benefícios da fórmula",
            content: (
              <ul className="space-y-4 list-none">
                <li className="flex gap-2">
                  <span className="text-[#082f1e] shrink-0">•</span>
                  <div>
                    <span className="text-brand-softblack/80 font-medium block">Auxilia na função muscular</span>
                    <span className="text-brand-softblack/60 text-sm block mt-0.5">O magnésio contribui para o funcionamento adequado dos músculos.</span>
                  </div>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#082f1e] shrink-0">•</span>
                  <div>
                    <span className="text-brand-softblack/80 font-medium block">Suporte ao sistema nervoso</span>
                    <span className="text-brand-softblack/60 text-sm block mt-0.5">Participa de processos importantes relacionados à transmissão neuromuscular.</span>
                  </div>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#082f1e] shrink-0">•</span>
                  <div>
                    <span className="text-brand-softblack/80 font-medium block">Contribui para o metabolismo energético</span>
                    <span className="text-brand-softblack/60 text-sm block mt-0.5">O magnésio participa de reações metabólicas essenciais para a produção de energia.</span>
                  </div>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#082f1e] shrink-0">•</span>
                  <div>
                    <span className="text-brand-softblack/80 font-medium block">Equilíbrio eletrolítico</span>
                    <span className="text-brand-softblack/60 text-sm block mt-0.5">Importante para o funcionamento adequado do organismo.</span>
                  </div>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#082f1e] shrink-0">•</span>
                  <div>
                    <span className="text-brand-softblack/80 font-medium block">Suporte para rotinas intensas</span>
                    <span className="text-brand-softblack/60 text-sm block mt-0.5">Especialmente indicado para quem busca suporte nutricional em rotinas físicas ou mentais exigentes.</span>
                  </div>
                </li>
              </ul>
            ),
          },
          {
            title: "Para quem foi desenvolvido",
            content: (
              <ul className="space-y-3 list-none">
                <li className="flex gap-2">
                  <span className="text-[#082f1e]">•</span>
                  <span className="text-brand-softblack/80">Pessoas com rotina intensa que desejam complementar a ingestão de magnésio</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#082f1e]">•</span>
                  <span className="text-brand-softblack/80">Quem busca suporte nutricional para função muscular e nervosa</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#082f1e]">•</span>
                  <span className="text-brand-softblack/80">Praticantes de atividade física</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#082f1e]">•</span>
                  <span className="text-brand-softblack/80">Quem deseja fortalecer o equilíbrio mineral da rotina diária</span>
                </li>
              </ul>
            ),
          },
          {
            title: "Como Usar",
            content:
              "Para integrar esta tecnologia mineral à sua rotina de performance, ingira 1 (uma) cápsula ao dia. Recomendamos o consumo preferencialmente com uma refeição para otimizar a assimilação dos componentes. A apresentação em frasco de 60 cápsulas garante um ciclo de 60 rituais de bem-estar e manutenção celular.",
          },
          {
            title: "Ingredientes",
            content: (
              <div className="space-y-4">
                {/* Tríade de Magnésios - Destaque Visual */}
                <div className="mb-6 space-y-4">
                  <div className="border-l-2 border-[#082f1e] pl-4">
                    <strong className="text-[#082f1e] font-medium">
                      Bisglicinato de Magnésio:
                    </strong>{" "}
                    <span className="text-brand-softblack/70">
                      Forma quelatada para máxima absorção e conforto digestivo.
                    </span>
                  </div>
                  <div className="border-l-2 border-[#082f1e] pl-4">
                    <strong className="text-[#082f1e] font-medium">
                      Magnésio Dimalato:
                    </strong>{" "}
                    <span className="text-brand-softblack/70">
                      Reconhecido por seu suporte prolongado à vitalidade e
                      função muscular.
                    </span>
                  </div>
                  <div className="border-l-2 border-[#082f1e] pl-4">
                    <strong className="text-[#082f1e] font-medium">
                      Óxido de Magnésio:
                    </strong>{" "}
                    <span className="text-brand-softblack/70">
                      Concentração estratégica para complementar o pool mineral.
                    </span>
                  </div>
                </div>

                {/* Outros Ingredientes */}
                <div>
                  <strong className="text-[#082f1e] font-medium">
                    Pureza Farmacêutica:
                  </strong>{" "}
                  <span className="text-brand-softblack/70">
                    Antiumectantes estearato de magnésio e dióxido de silício
                    para estabilidade da fórmula.
                  </span>
                </div>
                <div>
                  <strong className="text-[#082f1e] font-medium">
                    Segurança Biológica:
                  </strong>{" "}
                  <span className="text-brand-softblack/70">
                    Rigorosamente livre de glúten, adequado para os mais altos
                    padrões de exigência alimentar.
                  </span>
                </div>
              </div>
            ),
          },
          {
            title: "Informação Nutricional",
            content: (
              <div className="max-w-sm">
                <NutritionalTable {...MAG3_NUTRITIONAL_DATA} />
              </div>
            ),
          },
          {
            title: "Ciência",
            content:
              "A inteligência do VIOS MAG3 reside na entrega de 250 mg de magnésio elementar por dose, cobrindo 60% das necessidades diárias recomendadas com precisão. A tríplice combinação atua de forma orquestrada: enquanto auxilia no funcionamento muscular e no metabolismo energético, promove o equilíbrio dos eletrólitos e o suporte estrutural dos tecidos ósseos. Esta abordagem multiforme garante que o mineral atue em diversas rotinas metabólicas, elevando a disposição diária e a longevidade funcional.",
          },
        ],
        keyIngredients,
      };
    }

    if (productId === "prod_4") {
      // VIOS Pulse
      const keyIngredients = [
        { name: "L-Arginina e Cafeína Anidra", benefit: "Ativos estratégicos para otimizar a resistência física e o foco mental" },
        { name: "Complexo B Completo", benefit: "Vitaminas B1, B2, B3, B5, B6, B9 e B12 para suporte ao metabolismo energético" },
        { name: "Matriz Mineral de Alta Absorção", benefit: "Carbonato de Cálcio, Óxido de Magnésio e Zinco Bisglicinato" },
        { name: "Vitamina D3 e Biotina", benefit: "Nutrientes de suporte sistêmico para vitalidade e saúde celular" },
      ];
      return {
        accordionItems: [
          {
            title: "Benefícios da fórmula",
            content: (
              <ul className="space-y-4 list-none">
                <li className="flex gap-2">
                  <span className="text-[#082f1e] shrink-0">•</span>
                  <div>
                    <span className="text-brand-softblack/80 font-medium block">Auxilia na disposição diária</span>
                    <span className="text-brand-softblack/60 text-sm block mt-0.5">Contribui para rotinas que exigem energia e concentração.</span>
                  </div>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#082f1e] shrink-0">•</span>
                  <div>
                    <span className="text-brand-softblack/80 font-medium block">Suporte ao desempenho físico</span>
                    <span className="text-brand-softblack/60 text-sm block mt-0.5">Pensado para acompanhar momentos de esforço físico e mental.</span>
                  </div>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#082f1e] shrink-0">•</span>
                  <div>
                    <span className="text-brand-softblack/80 font-medium block">Clareza e foco</span>
                    <span className="text-brand-softblack/60 text-sm block mt-0.5">Auxilia na manutenção da atenção e produtividade.</span>
                  </div>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#082f1e] shrink-0">•</span>
                  <div>
                    <span className="text-brand-softblack/80 font-medium block">Equilíbrio metabólico</span>
                    <span className="text-brand-softblack/60 text-sm block mt-0.5">Apoia processos energéticos do organismo.</span>
                  </div>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#082f1e] shrink-0">•</span>
                  <div>
                    <span className="text-brand-softblack/80 font-medium block">Ideal para rotinas intensas</span>
                    <span className="text-brand-softblack/60 text-sm block mt-0.5">Desenvolvido para quem busca suporte nutricional em dias de alta demanda.</span>
                  </div>
                </li>
              </ul>
            ),
          },
          {
            title: "Para quem foi desenvolvido",
            content: (
              <ul className="space-y-3 list-none">
                <li className="flex gap-2">
                  <span className="text-[#082f1e]">•</span>
                  <span className="text-brand-softblack/80">Pessoas com rotina intensa e alta demanda de energia</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#082f1e]">•</span>
                  <span className="text-brand-softblack/80">Quem busca suporte nutricional para foco e produtividade</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#082f1e]">•</span>
                  <span className="text-brand-softblack/80">Praticantes de atividade física ou treinos intensos</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#082f1e]">•</span>
                  <span className="text-brand-softblack/80">Profissionais e estudantes que desejam manter desempenho mental</span>
                </li>
              </ul>
            ),
          },
          {
            title: "Como Usar",
            content:
              "Para integrar esta tecnologia de performance à sua rotina, ingira 02 (duas) cápsulas ao dia. Recomendamos o uso preferencialmente antes de atividades que exijam alto desempenho físico ou mental. A apresentação em frasco de 60 cápsulas oferece um ciclo de 30 rituais de energia absoluta.",
          },
          {
            title: "Ingredientes",
            content: (
              <div className="space-y-4">
                <div>
                  <strong className="text-[#082f1e] font-medium">
                    L-Arginina e Cafeína Anidra (75mg):
                  </strong>{" "}
                  <span className="text-brand-softblack/70">
                    Ativos estratégicos para otimizar a resistência física e o
                    foco mental.
                  </span>
                </div>
                <div>
                  <strong className="text-[#082f1e] font-medium">
                    Complexo B Completo:
                  </strong>{" "}
                  <span className="text-brand-softblack/70">
                    Inclui Vitaminas B1, B2, B3, B5, B6, B9 e B12 para suporte
                    ao metabolismo energético.
                  </span>
                </div>
                <div>
                  <strong className="text-[#082f1e] font-medium">
                    Matriz Mineral de Alta Absorção:
                  </strong>{" "}
                  <span className="text-brand-softblack/70">
                    Combinação de Carbonato de Cálcio, Óxido de Magnésio e Zinco
                    Bisglicinato.
                  </span>
                </div>
                <div>
                  <strong className="text-[#082f1e] font-medium">
                    Vitamina D3 e Biotina:
                  </strong>{" "}
                  <span className="text-brand-softblack/70">
                    Nutrientes de suporte sistêmico para vitalidade e saúde
                    celular.
                  </span>
                </div>
                <div>
                  <strong className="text-[#082f1e] font-medium">
                    Segurança Biológica:
                  </strong>{" "}
                  <span className="text-brand-softblack/70">
                    Fórmula rigorosamente livre de glúten, adequada para os mais
                    altos padrões alimentares.
                  </span>
                </div>
              </div>
            ),
          },
          {
            title: "Informação Nutricional",
            content: (
              <div className="max-w-sm">
                <NutritionalTable {...PULSE_NUTRITIONAL_DATA} />
              </div>
            ),
          },
          {
            title: "Ciência",
            content:
              "A inteligência do VIOS Pulse reside na entrega equilibrada de micronutrientes que atingem até 100% do Valor Diário recomendado. A combinação de Arginina com o complexo vitamínico atua diretamente na redução do cansaço e na otimização do foco, enquanto a cafeína estimula a performance física e o desempenho mental. Esta abordagem multifacetada favorece a termogênese natural do organismo, auxiliando não apenas na disposição imediata, mas também no suporte metabólico ao emagrecimento saudável.",
          },
        ],
        keyIngredients,
      };
    }

    if (productId === "prod_5") {
      // VIOS Move
      const keyIngredients = [
        { name: "Colágeno Tipo II não Desnaturado", benefit: "Ativo especializado na manutenção da cartilagem e elasticidade das juntas" },
        { name: "Complexo Anti-inflamatório", benefit: "Cúrcuma e MSM para conforto articular e recuperação" },
        { name: "Sinergia Óssea Avançada", benefit: "Vitaminas D3 e K2 para mineralização e absorção de fósforo" },
        { name: "Pool Mineral de Alta Performance", benefit: "Cálcio, Magnésio e Zinco Bisglicinato para suporte muscular" },
      ];
      return {
        accordionItems: [
          {
            title: "Benefícios da fórmula",
            content: (
              <ul className="space-y-4 list-none">
                <li className="flex gap-2">
                  <span className="text-[#082f1e] shrink-0">•</span>
                  <div>
                    <span className="text-brand-softblack/80 font-medium block">Auxilia na saúde articular</span>
                    <span className="text-brand-softblack/60 text-sm block mt-0.5">Contribui para o suporte nutricional das articulações.</span>
                  </div>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#082f1e] shrink-0">•</span>
                  <div>
                    <span className="text-brand-softblack/80 font-medium block">Mobilidade e flexibilidade</span>
                    <span className="text-brand-softblack/60 text-sm block mt-0.5">Pensado para quem busca movimentos mais livres no dia a dia.</span>
                  </div>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#082f1e] shrink-0">•</span>
                  <div>
                    <span className="text-brand-softblack/80 font-medium block">Suporte ao sistema musculoesquelético</span>
                    <span className="text-brand-softblack/60 text-sm block mt-0.5">Participa da manutenção estrutural do organismo.</span>
                  </div>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#082f1e] shrink-0">•</span>
                  <div>
                    <span className="text-brand-softblack/80 font-medium block">Conforto nas atividades diárias</span>
                    <span className="text-brand-softblack/60 text-sm block mt-0.5">Auxilia quem mantém rotinas ativas.</span>
                  </div>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#082f1e] shrink-0">•</span>
                  <div>
                    <span className="text-brand-softblack/80 font-medium block">Suporte para movimento contínuo</span>
                    <span className="text-brand-softblack/60 text-sm block mt-0.5">Ideal para quem busca manter qualidade de vida e mobilidade.</span>
                  </div>
                </li>
              </ul>
            ),
          },
          {
            title: "Para quem foi desenvolvido",
            content: (
              <ul className="space-y-3 list-none">
                <li className="flex gap-2">
                  <span className="text-[#082f1e]">•</span>
                  <span className="text-brand-softblack/80">Pessoas que buscam suporte nutricional para articulações</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#082f1e]">•</span>
                  <span className="text-brand-softblack/80">Quem pratica atividade física regularmente</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#082f1e]">•</span>
                  <span className="text-brand-softblack/80">Quem deseja manter mobilidade e conforto nos movimentos</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#082f1e]">•</span>
                  <span className="text-brand-softblack/80">Pessoas que valorizam saúde articular e qualidade de vida</span>
                </li>
              </ul>
            ),
          },
          {
            title: "Como Usar",
            content:
              "Para integrar esta tecnologia de regeneração à sua rotina, ingira 02 (duas) cápsulas ao dia. Recomendamos o uso preferencialmente acompanhado de uma refeição para otimizar a assimilação dos ativos lipossolúveis (D3 e K2). A apresentação em frasco de 60 cápsulas oferece um ciclo de 30 rituais de cuidado articular.",
          },
          {
            title: "Ingredientes",
            content: (
              <div className="space-y-4">
                <div>
                  <strong className="text-[#082f1e] font-medium">
                    Colágeno Tipo II não Desnaturado (20 mg):
                  </strong>{" "}
                  <span className="text-brand-softblack/70">
                    Ativo especializado na manutenção da cartilagem e
                    elasticidade das juntas.
                  </span>
                </div>
                <div>
                  <strong className="text-[#082f1e] font-medium">
                    Complexo Anti-inflamatório:
                  </strong>{" "}
                  <span className="text-brand-softblack/70">
                    Cúrcuma e MSM (80 mg) para conforto articular e recuperação.
                  </span>
                </div>
                <div>
                  <strong className="text-[#082f1e] font-medium">
                    Sinergia Óssea Avançada:
                  </strong>{" "}
                  <span className="text-brand-softblack/70">
                    Vitaminas D3 (50 μg) e K2 (24 μg) para mineralização e
                    absorção de fósforo.
                  </span>
                </div>
                <div>
                  <strong className="text-[#082f1e] font-medium">
                    Pool Mineral de Alta Performance:
                  </strong>{" "}
                  <span className="text-brand-softblack/70">
                    Cálcio (204 mg), Magnésio (100 mg) e Zinco Bisglicinato (11
                    mg) para suporte muscular.
                  </span>
                </div>
                <div>
                  <strong className="text-[#082f1e] font-medium">
                    Segurança Biológica:
                  </strong>{" "}
                  <span className="text-brand-softblack/70">
                    Fórmula rigorosamente livre de glúten, adequada para os mais
                    altos padrões alimentares.
                  </span>
                </div>
              </div>
            ),
          },
          {
            title: "Informação Nutricional",
            content: (
              <div className="max-w-sm">
                <NutritionalTable {...MOVE_NUTRITIONAL_DATA} />
              </div>
            ),
          },
          {
            title: "Ciência",
            content: (
              <span>
                A inteligência do VIOS Move reside na entrega de micronutrientes
                em dosagens estratégicas, com destaque para a Vitamina D3
                concentrada em{" "}
                <strong className="text-[#082f1e] font-medium">333%</strong> do
                Valor Diário recomendado. Esta alta potência atua diretamente no
                fortalecimento do sistema imune e na saúde óssea.
                Simultaneamente, a fusão de Colágeno Tipo II com a Curcumina
                auxilia na redução do desgaste das junturas e na mitigação de
                sintomas associados a impactos repetitivos, promovendo uma
                recuperação tecidual mais resiliente.
              </span>
            ),
          },
        ],
        keyIngredients,
      };
    }

    // Conteúdo padrão para outros produtos
    const keyIngredients = [
      { name: "Bisglicinato de Magnésio", benefit: "Absorção superior e biodisponibilidade otimizada" },
      { name: "Vitamina D3", benefit: "Suporte à saúde óssea e sistema imunológico" },
      { name: "Zinco Quelado", benefit: "Melhor absorção e menor irritação gástrica" },
    ];
    return {
      accordionItems: [
        {
          title: "Benefícios",
          content: (
            <div className="space-y-4">
              {keyIngredients.map((ing) => (
                <div key={ing.name}>
                  <strong className="text-[#082f1e] font-medium">{ing.name}:</strong>{" "}
                  <span className="text-brand-softblack/70">{ing.benefit}</span>
                </div>
              ))}
            </div>
          ),
        },
        {
          title: "Como Usar",
          content:
            "Recomendamos tomar uma cápsula por dia, preferencialmente com uma refeição. Para melhores resultados, mantenha uma alimentação balanceada e pratique exercícios físicos regularmente.",
        },
        {
          title: "Ingredientes",
          content:
            "Ingredientes selecionados cuidadosamente para garantir a máxima qualidade e eficácia. Cada componente foi escolhido com base em pesquisas científicas e padrões rigorosos de pureza.",
        },
        {
          title: "Ciência",
          content:
            "Nosso produto foi desenvolvido com base em estudos científicos publicados em revistas especializadas. Cada ingrediente foi selecionado considerando sua biodisponibilidade e sinergia com os demais componentes da fórmula.",
        },
      ],
      keyIngredients,
    };
  };

  // Memoizar conteúdo do produto para evitar recálculos
  const productContent = useMemo(() => {
    return getProductSpecificContent(product.id);
  }, [product.id]);

  return (
    <>
      <div className="pb-24">
      <div className="max-w-7xl mx-auto px-6 pt-20 md:pt-24 pb-12 grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Galeria de Imagens — Sticky no Desktop */}
        <div className="md:sticky md:top-8 md:self-start">
          <ProductImageGallery
            images={[
              product.image,
              ...(product.additionalImages ?? []),
            ]}
            alt={product.name}
          />
        </div>

        {/* Detalhes - Coluna Direita com Altura Natural */}
        <div className="flex flex-col md:min-h-[calc(100vh-8rem)]">
          {/* Título do Produto com TextReveal */}
          <TextReveal
            text={product.tagline ? `${product.name} | ${product.tagline}` : product.name}
            el="h1"
            className="text-3xl font-light uppercase tracking-widest mb-4"
            delay={0.1}
            duration={0.6}
          />

          {/* Preço + prova social (unidades vendidas) + faixa de benefícios */}
          <div className="space-y-4 mb-6">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="text-xl font-light text-brand-softblack"
              >
                {formatPrice(product.price)}
              </motion.p>
              {product.unitsSold !== undefined && product.unitsSold > 0 && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.05 }}
                  className="inline-flex items-center px-3 py-1 rounded-sm bg-brand-green/10 text-brand-green text-[11px] font-medium uppercase tracking-wider"
                >
                  {formatUnitsSoldForDisplay(product.unitsSold)} unidades vendidas
                </motion.span>
              )}
              {reviewsSummary && reviewsSummary.reviews > 0 && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.08 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm bg-brand-gold/15 text-brand-softblack text-[11px] font-medium uppercase tracking-wider"
                >
                  <span className="text-brand-gold">★</span>
                  {reviewsSummary.rating.toFixed(1)} · {reviewsSummary.reviews} {reviewsSummary.reviews === 1 ? "avaliação" : "avaliações"}
                </motion.span>
              )}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 }}
            >
              <CheckoutBenefitsBar />
            </motion.div>
          </div>

          {/* Proposta de valor — características factuais (conforme ANVISA) */}
          <ProductValueProposition product={product} />

          {/* Descrição Curta com TextReveal */}
          <div className="border-t border-b py-6 mb-8 text-gray-600 font-light leading-relaxed">
            <TextReveal
              text={product.description}
              el="p"
              className=""
              delay={0.4}
              duration={0.6}
            />
          </div>

          {/* Indicadores de urgência (estoque baixo) */}
          {!isOutOfStock && inventory && (
            <div className="mb-4">
              {isLastUnits && (
                <div className="inline-flex items-center gap-2 rounded-sm border border-amber-500/60 bg-amber-50 px-4 py-2">
                  <span
                    className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-500"
                    aria-hidden
                  />
                  <span className="text-xs font-medium uppercase tracking-wider text-amber-800">
                    Últimas unidades!
                  </span>
                </div>
              )}
              {isFewUnits && !isLastUnits && (
                <div className="inline-flex items-center gap-2 rounded-sm border border-amber-400/50 bg-amber-50/80 px-4 py-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-amber-800">
                    Apenas {inventory.available_quantity} unidades disponíveis
                  </span>
                </div>
              )}
              {isLowStock && !isFewUnits && !isLastUnits && (
                <p className="text-xs text-amber-700/90 font-medium uppercase tracking-wider">
                  Poucas unidades disponíveis
                </p>
              )}
            </div>
          )}

          {/* Cálculo de frete na página do produto */}
          <div className="mb-6">
            <ProductShippingCalculator
              productId={product.id}
              productPrice={product.price}
            />
          </div>

          {/* Botões de Compra — Comprar agora (principal) + Colocar na sacola (secundário) */}
          <div className="flex flex-col gap-3">
            {isOutOfStock || isLoadingInventory ? (
              <motion.button
                disabled
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="w-full border rounded-sm px-6 py-3.5 min-h-[44px] uppercase tracking-[0.2em] text-xs font-medium border-stone-300 bg-stone-200 text-stone-500 cursor-not-allowed"
              >
                {isLoadingInventory ? "Carregando..." : "Esgotado"}
              </motion.button>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.1 }}>
                <Link
                  href="/checkout"
                  onClick={handleBuyNow}
                  className="flex w-full items-center justify-center border rounded-sm px-6 py-3.5 min-h-[44px] uppercase tracking-[0.2em] text-xs font-medium border-brand-green bg-brand-green text-brand-offwhite transition-all duration-500 ease-out hover:bg-brand-softblack hover:border-brand-softblack"
                >
                  {product.ctaPrimary ?? "Comprar agora"}
                </Link>
              </motion.div>
            )}
            <motion.button
              onClick={handleAddToCart}
              disabled={isOutOfStock || isLoadingInventory}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.12 }}
              className={`w-full border rounded-sm px-6 py-2.5 min-h-[40px] uppercase tracking-[0.2em] text-[11px] font-light transition-all duration-500 ease-out ${
                isOutOfStock || isLoadingInventory
                  ? "border-stone-200 bg-transparent text-stone-400 cursor-not-allowed"
                  : "border-stone-300 bg-transparent text-brand-softblack hover:border-brand-green hover:text-brand-green"
              }`}
            >
              {product.ctaSecondary ?? "Colocar na sacola"}
            </motion.button>
          </div>

          {/* Garantia — reduz fricção imediatamente após os CTAs */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.11 }}
            className="mt-4 flex items-center justify-center gap-2 text-brand-softblack/60"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0 text-brand-green" aria-hidden>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className="text-[10px] uppercase tracking-[0.18em] font-medium">
              7 dias para devolver — sem perguntas
            </span>
          </motion.div>

          {/* Selos de confiança — ANVISA, Pagamento Seguro (logo após os botões para reforçar decisão) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.12 }}
            className="mt-6"
          >
            <ProductTrustSeals anvisaRecord={product.anvisaRecord} />
          </motion.div>

          <p className="mt-6 text-center text-[10px] uppercase tracking-wider text-brand-softblack/70">
            Primeira compra? Use o cupom{" "}
            <span className="font-medium text-brand-green">SOUVIOS</span> para benefício de boas-vindas no checkout.
          </p>

          <p className="mt-2 text-center text-[10px] uppercase tracking-wider text-brand-softblack/60">
            Dúvidas sobre o produto?{" "}
            <a
              href={`https://wa.me/5511952136713?text=${encodeURIComponent(`Olá, tenho dúvidas sobre o ${product.name}.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand-green hover:text-brand-softblack transition-colors"
            >
              Fale com um especialista VIOS
            </a>
          </p>

          {/* Sentinel para StickyBar — quando sai da viewport, a barra aparece */}
          <div data-sticky-bar-trigger className="h-px w-full" aria-hidden />

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="flex justify-center mt-4"
          >
            <ShareButton
              title={product.name}
              text={`${product.name} — VIOS LABS. ${product.category}.`}
            />
          </motion.div>

          {/* Accordion com informações do produto */}
          <ProductAccordion items={productContent.accordionItems} />
        </div>
      </div>

      {/* Key Ingredients Section */}
      <div className="w-full max-w-7xl mx-auto px-6">
        <KeyIngredients ingredients={productContent.keyIngredients} />
      </div>

      {/* Faixa do Laboratório */}
      <div className="w-full my-8 md:my-12 overflow-hidden">
        <div className="relative w-full h-[220px] md:h-[320px]">
          <Image
            src="https://gwnegdilmazoobpexlld.supabase.co/storage/v1/object/public/site-assets/laboratorio/laboratoriogeral.jpg"
            alt="Laboratório VIOS Labs — formulação científica de alto padrão"
            fill
            sizes="100vw"
            className="object-cover object-center"
            quality={85}
          />
          <div className="absolute inset-0 bg-brand-softblack/50" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            <span className="text-brand-gold uppercase tracking-[0.4em] text-[10px] font-semibold mb-3 block">
              Ciência & Qualidade
            </span>
            <p className="text-white/90 text-lg md:text-2xl font-light tracking-tight max-w-xl leading-snug">
              Desenvolvido em laboratório de alto padrão,<br className="hidden md:block" /> com validação científica em cada fórmula.
            </p>
          </div>
        </div>
      </div>

      {/* Comparativo VIOS vs produto comum de farmácia */}
      {productComparison && (
        <div className="w-full max-w-7xl mx-auto px-6">
          <ProductComparisonTable
            comparison={productComparison}
            productName={product.name}
          />
        </div>
      )}

      {/* Avaliações */}
      <ProductReviews productId={product.id} />

      {/* Quem comprou também comprou */}
      <FrequentlyBoughtTogether products={recommendedProducts} />
      </div>

      {/* Barra fixa — aparece quando o botão principal sai da viewport */}
      <StickyBar
        productName={product.name}
        productId={product.id}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        isOutOfStock={isOutOfStock}
        isLoading={isLoadingInventory}
        ctaPrimary={product.ctaPrimary}
      />

      {/* Modal de Waitlist */}
      <WaitlistModal
        isOpen={showWaitlistModal}
        onClose={handleWaitlistClose}
        productId={product.id}
        productName={product.name}
        userId={user?.id}
      />
    </>
  );
}

// Memoizar componente com comparação de props
export default memo(ProductPageContent);
