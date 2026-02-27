"use client";

import { useEffect, useState, useCallback, useMemo, memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/utils/format";
import ProductAccordion from "@/components/ProductAccordion";
import TextReveal from "@/components/ui/text-reveal";
import { ShareButton } from "@/components/shop/ShareButton";
import { Kit } from "@/constants/kits";
import { PRODUCTS } from "@/constants/products";
import KitProductsPreview from "@/components/KitProductsPreview";
import FrequentlyBoughtTogether from "@/components/shop/FrequentlyBoughtTogether";
import ProductReviews from "@/components/shop/ProductReviews";
import { getFrequentlyBoughtTogetherForKit } from "@/utils/recommendations";
import CheckoutBenefitsBar from "@/components/CheckoutBenefitsBar";
import { trackViewItem } from "@/lib/analytics";

interface KitPageContentProps {
  kit: Kit;
}

function KitPageContent({ kit }: KitPageContentProps) {
  const { addKitToCart } = useCart();
  const isActive = !kit.products.some((id) => PRODUCTS.find((p) => p.id === id)?.soldOut);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);

  // Garantir que a página sempre comece no topo ao carregar
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    if (typeof window !== "undefined" && window.history.scrollRestoration) {
      window.history.scrollRestoration = "manual";
    }
  }, [kit.id]);

  // Analytics: view_item
  useEffect(() => {
    trackViewItem({
      itemId: kit.id,
      itemName: kit.name,
      price: kit.price,
      category: kit.badge === "kit" ? "Kit" : "Protocolo",
      isKit: true,
    });
  }, [kit.id, kit.name, kit.price, kit.badge]);

  const handleAddToCart = useCallback(() => {
    addKitToCart(kit);
  }, [addKitToCart, kit]);

  const handleWaitlistClick = useCallback(() => {
    setShowWaitlistModal(true);
  }, []);

  const handleWaitlistClose = useCallback(() => {
    setShowWaitlistModal(false);
  }, []);

  // Obter produtos que compõem o kit
  const kitProducts = useMemo(() => {
    return kit.products
      .map((productId) => PRODUCTS.find((p) => p.id === productId))
      .filter((p): p is NonNullable<typeof p> => p !== undefined);
  }, [kit.products]);

  const { products: recommendedProducts, kits: recommendedKits } = useMemo(
    () => getFrequentlyBoughtTogetherForKit(kit.id),
    [kit.id]
  );

  // Conteúdo específico para cada kit
  const getKitSpecificContent = (kitId: string) => {
    const kitData = kit.content;

    // Se não houver conteúdo customizado, usar estrutura padrão
    if (!kitData) {
      return {
        accordionItems: [
          {
            title: "Sobre o Kit",
            content:
              kit.longDescription ||
              kit.description ||
              "Kit cuidadosamente selecionado para máxima eficácia.",
          },
          {
            title: "Produtos Incluídos",
            content: (
              <div className="space-y-4">
                {kitProducts.map((product) => (
                  <div
                    key={product.id}
                    className="border-l-2 border-[#082f1e] pl-4"
                  >
                    <strong className="text-[#082f1e] font-medium">
                      {product.name}
                    </strong>
                    <p className="text-brand-softblack/70 mt-1">
                      {product.description}
                    </p>
                  </div>
                ))}
              </div>
            ),
          },
          {
            title: "Como Usar",
            content:
              kit.howToUse ||
              "Siga as instruções de cada produto incluído no kit. Recomendamos manter uma rotina consistente para melhores resultados.",
          },
        ],
      };
    }

    // Conteúdo customizado do kit
    const accordionItems = [];

    // Seção "Sobre"
    if (kitData.about) {
      accordionItems.push({
        title: kitData.about.title || "Sobre o Kit",
        content: (
          <div className="space-y-4">
            {kitData.about.paragraphs?.map((paragraph, index) => (
              <p
                key={index}
                className="text-brand-softblack/70 leading-relaxed"
              >
                {paragraph}
              </p>
            ))}
          </div>
        ),
      });
    }

    // Seção "Produtos"
    if (kitData.products) {
      accordionItems.push({
        title: kitData.products.title || "Produtos Incluídos",
        content: (
          <div className="space-y-4">
            {kitData.products.description && (
              <p className="text-brand-softblack/70 mb-4">
                {kitData.products.description}
              </p>
            )}
            {kitProducts.map((product) => (
              <div
                key={product.id}
                className="border-l-2 border-[#082f1e] pl-4"
              >
                <strong className="text-[#082f1e] font-medium">
                  {product.name}
                </strong>
                <p className="text-brand-softblack/70 mt-1">
                  {product.description}
                </p>
              </div>
            ))}
          </div>
        ),
      });
    }

    // Seção "Benefícios"
    if (kitData.benefits && kitData.benefits.items) {
      accordionItems.push({
        title: kitData.benefits.title || "Benefícios",
        content: (
          <div className="space-y-4">
            {kitData.benefits.items.map((item, index) => (
              <div key={index} className="border-l-2 border-[#082f1e] pl-4">
                <strong className="text-[#082f1e] font-medium">
                  {item.title}
                </strong>
                <p className="text-brand-softblack/70 mt-1">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        ),
      });
    }

    // Seção "Como Usar"
    if (kitData.usage) {
      accordionItems.push({
        title: kitData.usage.title || "Como Usar",
        content: (
          <div className="space-y-3">
            {kitData.usage.instructions?.map((instruction, index) => (
              <p
                key={index}
                className="text-brand-softblack/70 leading-relaxed"
              >
                {instruction}
              </p>
            ))}
          </div>
        ),
      });
    }

    // Seção "FAQ"
    if (kitData.faq && kitData.faq.length > 0) {
      accordionItems.push({
        title: "Perguntas Frequentes",
        content: (
          <div className="space-y-6">
            {kitData.faq.map((item, index) => (
              <div key={index}>
                <strong className="text-[#082f1e] font-medium block mb-2">
                  {item.question}
                </strong>
                <p className="text-brand-softblack/70 leading-relaxed">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        ),
      });
    }

    return { accordionItems };
  };

  // Memoizar conteúdo do kit
  const kitContent = useMemo(() => {
    return getKitSpecificContent(kit.id);
  }, [kit.id, kitProducts]);

  // Hero content
  const heroTitle = kit.content?.hero?.title || kit.name;
  const heroSubtitle = kit.content?.hero?.subtitle;
  const heroDescription =
    kit.content?.hero?.description || kit.longDescription || kit.description;

  return (
    <>
      <div className="max-w-7xl mx-auto px-6 pt-20 md:pt-24 pb-12 grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Imagem do Kit - Sticky no Desktop */}
        <div className="relative bg-gray-100 aspect-[3/4] overflow-hidden md:sticky md:top-8 md:self-start">
          {kit.image ? (
            <Image
              src={kit.image}
              alt={kit.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
              quality={90}
            />
          ) : (
            <KitProductsPreview products={kitProducts} badge={kit.badge} />
          )}
        </div>

        {/* Detalhes - Coluna Direita */}
        <div className="flex flex-col md:min-h-[calc(100vh-8rem)]">
          {/* Badge */}
          {kit.badge && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-[10px] uppercase tracking-[0.2em] text-brand-gold font-light mb-2"
            >
              {kit.badge === "kit" ? "Kit" : "Protocolo"}
            </motion.p>
          )}

          {/* Título do Kit */}
          <TextReveal
            text={heroTitle}
            el="h1"
            className="text-3xl font-light uppercase tracking-widest mb-2"
            delay={0.1}
            duration={0.6}
          />

          {/* Subtítulo (se fornecido) */}
          {heroSubtitle && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="text-lg text-brand-softblack/70 font-light mb-4"
            >
              {heroSubtitle}
            </motion.p>
          )}

          {/* Preço + faixa de benefícios */}
          <div className="space-y-4 mb-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="flex items-baseline gap-3"
            >
              {kit.oldPrice && kit.oldPrice > kit.price && (
                <p className="text-lg text-brand-softblack/40 line-through font-light">
                  {formatPrice(kit.oldPrice)}
                </p>
              )}
              <p className="text-2xl font-light text-brand-softblack">
                {formatPrice(kit.price)}
              </p>
              {kit.oldPrice && kit.oldPrice > kit.price && (
                <span className="text-xs uppercase tracking-wider text-brand-green font-medium">
                  Economia de {formatPrice(kit.oldPrice - kit.price)}
                </span>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.35 }}
            >
              <CheckoutBenefitsBar />
            </motion.div>
          </div>

          {/* Descrição */}
          <div className="border-t border-b py-6 mb-8 text-gray-600 font-light leading-relaxed">
            <TextReveal
              text={heroDescription}
              el="p"
              className=""
              delay={0.4}
              duration={0.6}
            />
          </div>

          {/* Botão de Compra */}
          <motion.button
            onClick={handleAddToCart}
            disabled={!isActive}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className={`w-full border rounded-sm px-6 py-3 min-h-[44px] uppercase tracking-[0.2em] text-xs font-light transition-all duration-500 ease-out ${
              isActive
                ? "border-brand-green bg-brand-green text-brand-offwhite hover:bg-brand-softblack hover:border-brand-softblack cursor-pointer"
                : "border-gray-300 bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isActive ? "Colocar na sacola" : "Em Breve"}
          </motion.button>

          <p className="mt-3 text-center text-[10px] uppercase tracking-wider text-brand-softblack/70">
            Primeira compra? Use o cupom{" "}
            <span className="font-medium text-brand-green">SOUVIOS</span> para 10% de desconto no checkout.
          </p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.55 }}
            className="flex justify-center mt-4"
          >
            <ShareButton
              title={kit.name}
              text={`${kit.name} — VIOS LABS. ${kit.badge === "kit" ? "Kit" : "Protocolo"}.`}
            />
          </motion.div>

          {/* Trust Badges */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="flex items-center gap-2 text-gray-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
              <span className="text-[10px] uppercase tracking-wider font-light text-brand-gold">
                Compra Segura
              </span>
            </div>

            <div className="flex items-center gap-2 text-gray-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
                aria-hidden="true"
              >
                <path d="M9.207 16.454C9.207 17.86 8.095 19 6.724 19s-2.483-1.14-2.483-2.546m4.966 0c0-1.405-1.112-2.545-2.483-2.545s-2.483 1.14-2.483 2.545m4.966 0h5.586m-10.552 0H3V6a1 1 0 0 1 1-1h9.793a1 1 0 0 1 1 1v2.182m5.586 8.272c0 1.406-1.111 2.546-2.482 2.546c-1.372 0-2.483-1.14-2.483-2.546m4.965 0c0-1.405-1.111-2.545-2.482-2.545c-1.372 0-2.483 1.14-2.483 2.545m4.965 0H21v-5.09l-2.515-2.579a2 2 0 0 0-1.431-.603h-2.26m.62 8.272h-.62m0 0V8.182" />
              </svg>
              <span className="text-[10px] uppercase tracking-wider font-light text-brand-gold">
                Envio Imediato
              </span>
            </div>
          </div>

          {/* Produtos do Kit */}
          {kitProducts.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-200">
              <h2 className="text-xl font-light uppercase tracking-wider mb-6">
                Produtos Incluídos
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {kitProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/produto/${product.id}`}
                    className="group flex gap-3 p-3 border border-gray-200 hover:border-brand-green transition-colors duration-300"
                  >
                    <div className="relative w-16 h-16 flex-shrink-0 bg-gray-100 overflow-hidden">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="64px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-brand-softblack group-hover:text-brand-green transition-colors duration-300 truncate">
                        {product.name}
                      </h3>
                      <p className="text-xs text-brand-softblack/60 line-clamp-2 mt-1">
                        {product.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Accordion com Informações Detalhadas */}
      {kitContent.accordionItems.length > 0 && (
        <div className="max-w-4xl mx-auto px-6 pb-24">
          <ProductAccordion items={kitContent.accordionItems} />
        </div>
      )}

      {/* Avaliações */}
      <ProductReviews
        kitId={kit.id}
        kitProductIds={kit.products}
      />

      {/* Quem comprou também comprou */}
      <FrequentlyBoughtTogether
        products={recommendedProducts}
        kits={recommendedKits}
      />
    </>
  );
}

export default memo(KitPageContent);
