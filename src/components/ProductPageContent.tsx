"use client";

import { useEffect, useState, useCallback, useMemo, memo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/utils/format";
import ProductAccordion from "@/components/ProductAccordion";
import StickyBar from "@/components/StickyBar";
import KeyIngredients from "@/components/KeyIngredients";
import WaitlistModal from "@/components/WaitlistModal";
import TextReveal from "@/components/ui/text-reveal";
import { Product } from "@/constants/products";
import { useAuth } from "@/hooks/useAuth";
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

  // Garantir que a página sempre comece no topo ao carregar
  useEffect(() => {
    // Scroll para o topo quando o componente montar
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    
    // Resetar scroll history
    if (typeof window !== 'undefined' && window.history.scrollRestoration) {
      window.history.scrollRestoration = 'manual';
    }
  }, [product.id]); // Reexecutar se o produto mudar

  // Buscar estoque do produto
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setIsLoadingInventory(true);
        const response = await fetch(`/api/inventory/status?product_id=${product.id}`);
        
        if (response.ok) {
          const data = await response.json();
          setInventory(data);
        }
      } catch (error) {
        console.error('Error fetching inventory:', error);
        // Se falhar, assumir que está disponível (fallback)
        setInventory(null);
      } finally {
        setIsLoadingInventory(false);
      }
    };

    fetchInventory();
  }, [product.id]);

  const handleAddToCart = useCallback(() => {
    addToCart(product);
  }, [addToCart, product]);

  const handleWaitlistClick = useCallback(() => {
    setShowWaitlistModal(true);
  }, []);

  const handleWaitlistClose = useCallback(() => {
    setShowWaitlistModal(false);
  }, []);

  // Determinar se o produto está disponível - Memoizado
  const isOutOfStock = useMemo(() => {
    return inventory !== null && inventory.available_quantity === 0;
  }, [inventory]);

  // Conteúdo específico para cada produto
  const getProductSpecificContent = (productId: string) => {
    if (productId === 'prod_1') {
      // VIOS Glow
      return {
        accordionItems: [
          {
            title: "Ingredientes",
            content: (
              <div className="space-y-4">
                <div>
                  <strong className="text-[#082f1e] font-medium">Matriz Nobre Vegana:</strong>{" "}
                  <span className="text-brand-softblack/70">Base de Tapioca e Pectina, livre de gelatina animal.</span>
                </div>
                <div>
                  <strong className="text-[#082f1e] font-medium">Biotina (45 μg):</strong>{" "}
                  <span className="text-brand-softblack/70">Concentração máxima para suporte estrutural de cabelos e unhas.</span>
                </div>
                <div>
                  <strong className="text-[#082f1e] font-medium">Vitamina A (600 μg):</strong>{" "}
                  <span className="text-brand-softblack/70">Essencial para a integridade e renovação da pele.</span>
                </div>
                <div>
                  <strong className="text-[#082f1e] font-medium">Vitamina C (15 mg):</strong>{" "}
                  <span className="text-brand-softblack/70">Poderoso antioxidante e cofator essencial para o colágeno.</span>
                </div>
                <div>
                  <strong className="text-[#082f1e] font-medium">Complexo B Potencializado:</strong>{" "}
                  <span className="text-brand-softblack/70">B12 (9,9 μg), Niacina (20 mg), B6 (2 mg) e Ácido Fólico (240 μg) para renovação celular e equilíbrio metabólico.</span>
                </div>
                <div>
                  <strong className="text-[#082f1e] font-medium">Segurança Biológica:</strong>{" "}
                  <span className="text-brand-softblack/70">Fórmula rigorosamente livre de glúten e alérgenos comuns.</span>
                </div>
              </div>
            ),
          },
          {
            title: "Como Usar",
            content: "Recomendamos o consumo de 1 (uma) pastilha de goma por dia, preferencialmente acompanhada de uma refeição. Para melhores resultados, mantenha uma rotina consistente, permitindo que os nutrientes atuem na arquitetura celular a longo prazo.",
          },
          {
            title: "Ciência",
            content: "O diferencial do VIOS Glow reside no seu veículo de entrega de pureza absoluta. Diferente das gomas tradicionais que utilizam gelatinas animais, desenvolvemos uma Matriz de Pectina e Tapioca que garante textura superior e ética 100% vegana. Esta forma de entrega otimiza a biodisponibilidade, permitindo que os nutrientes essenciais sejam absorvidos durante a digestão e alcancem as camadas estruturais da derme de dentro para fora.",
          },
        ],
        keyIngredients: [
          {
            name: "Matriz Nobre Vegana",
            benefit: "Base de Tapioca e Pectina, livre de gelatina animal",
          },
          {
            name: "Biotina (45 μg)",
            benefit: "Concentração máxima para suporte estrutural de cabelos e unhas",
          },
          {
            name: "Vitamina A (600 μg)",
            benefit: "Essencial para a integridade e renovação da pele",
          },
          {
            name: "Vitamina C (15 mg)",
            benefit: "Poderoso antioxidante e cofator essencial para o colágeno",
          },
          {
            name: "Complexo B Potencializado",
            benefit: "B12, Niacina, B6 e Ácido Fólico para renovação celular",
          },
        ],
      };
    }
    
    if (productId === 'prod_2') {
      // VIOS Sleep
      return {
        accordionItems: [
          {
            title: "Ingredientes",
            content: (
              <div className="space-y-4">
                <div>
                  <strong className="text-[#082f1e] font-medium">Melatonina:</strong>{" "}
                  <span className="text-brand-softblack/70">Ativo central para a regulação do ciclo do sono.</span>
                </div>
                <div>
                  <strong className="text-[#082f1e] font-medium">Base de Alta Absorção:</strong>{" "}
                  <span className="text-brand-softblack/70">Água Purificada e Glicerina para entrega precisa dos ativos.</span>
                </div>
                <div>
                  <strong className="text-[#082f1e] font-medium">Experiência Sensorial:</strong>{" "}
                  <span className="text-brand-softblack/70">Aroma Natural de Maracujá, refinado e relaxante.</span>
                </div>
                <div>
                  <strong className="text-[#082f1e] font-medium">Zero Açúcar:</strong>{" "}
                  <span className="text-brand-softblack/70">Edulcorante Sucralose com doçura equilibrada e zero índice glicêmico.</span>
                </div>
                <div>
                  <strong className="text-[#082f1e] font-medium">Conservação e Pureza:</strong>{" "}
                  <span className="text-brand-softblack/70">Ácido cítrico, benzoato de sódio e sorbato de potássio.</span>
                </div>
                <div>
                  <strong className="text-[#082f1e] font-medium">Segurança Biológica:</strong>{" "}
                  <span className="text-brand-softblack/70">Fórmula rigorosamente livre de glúten, adequada para os mais altos padrões alimentares.</span>
                </div>
              </div>
            ),
          },
          {
            title: "Como Usar",
            content: "Para uma transição suave ao sono reparador, ingira 1 (uma) gota ao dia, preferencialmente 30 minutos antes do repouso. Mantenha o frasco ao abrigo de luz e calor para preservar a integridade da fórmula.",
          },
          {
            title: "Ciência",
            content: (
              <span>
                A inteligência do VIOS Sleep reside na entrega de <strong className="text-[#082f1e] font-medium">0,2 mg</strong> de melatonina de alta pureza por gota. Esta concentração foi estrategicamente calculada para sinalizar ao sistema nervoso o início do desligamento sistêmico, auxiliando na redução do tempo para adormecer e na mitigação de distúrbios como o jet lag. Ao regular o relógio biológico de forma não medicamentosa, a fórmula apoia a homeostase celular, fundamental para a regeneração noturna e o equilíbrio das funções cognitivas.
              </span>
            ),
          },
        ],
        keyIngredients: [
          {
            name: "Melatonina",
            benefit: "Ativo central para a regulação do ciclo do sono",
          },
          {
            name: "Base de Alta Absorção",
            benefit: "Água Purificada e Glicerina para entrega precisa dos ativos",
          },
          {
            name: "Experiência Sensorial",
            benefit: "Aroma Natural de Maracujá, refinado e relaxante",
          },
          {
            name: "Zero Açúcar",
            benefit: "Edulcorante Sucralose com doçura equilibrada e zero índice glicêmico",
          },
        ],
      };
    }
    
    if (productId === 'prod_3') {
      // VIOS MAG3
      return {
        accordionItems: [
          {
            title: "Ingredientes",
            content: (
              <div className="space-y-4">
                {/* Tríade de Magnésios - Destaque Visual */}
                <div className="mb-6 space-y-4">
                  <div className="border-l-2 border-[#082f1e] pl-4">
                    <strong className="text-[#082f1e] font-medium">Bisglicinato de Magnésio:</strong>{" "}
                    <span className="text-brand-softblack/70">Forma quelatada para máxima absorção e conforto digestivo.</span>
                  </div>
                  <div className="border-l-2 border-[#082f1e] pl-4">
                    <strong className="text-[#082f1e] font-medium">Magnésio Dimalato:</strong>{" "}
                    <span className="text-brand-softblack/70">Reconhecido por seu suporte prolongado à vitalidade e função muscular.</span>
                  </div>
                  <div className="border-l-2 border-[#082f1e] pl-4">
                    <strong className="text-[#082f1e] font-medium">Óxido de Magnésio:</strong>{" "}
                    <span className="text-brand-softblack/70">Concentração estratégica para complementar o pool mineral.</span>
                  </div>
                </div>
                
                {/* Outros Ingredientes */}
                <div>
                  <strong className="text-[#082f1e] font-medium">Pureza Farmacêutica:</strong>{" "}
                  <span className="text-brand-softblack/70">Antiumectantes estearato de magnésio e dióxido de silício para estabilidade da fórmula.</span>
                </div>
                <div>
                  <strong className="text-[#082f1e] font-medium">Segurança Biológica:</strong>{" "}
                  <span className="text-brand-softblack/70">Rigorosamente livre de glúten, adequado para os mais altos padrões de exigência alimentar.</span>
                </div>
              </div>
            ),
          },
          {
            title: "Como Usar",
            content: "Para integrar esta tecnologia mineral à sua rotina de performance, ingira 1 (uma) cápsula ao dia. Recomendamos o consumo preferencialmente com uma refeição para otimizar a assimilação dos componentes. A apresentação em frasco de 60 cápsulas garante um ciclo de 60 rituais de bem-estar e manutenção celular.",
          },
          {
            title: "Ciência",
            content: "A inteligência do VIOS MAG3 reside na entrega de 250 mg de magnésio elementar por dose, cobrindo 60% das necessidades diárias recomendadas com precisão. A tríplice combinação atua de forma orquestrada: enquanto auxilia no funcionamento muscular e no metabolismo energético, promove o equilíbrio dos eletrólitos e o suporte estrutural dos tecidos ósseos. Esta abordagem multiforme garante que o mineral atue em diversas rotinas metabólicas, elevando a disposição diária e a longevidade funcional.",
          },
        ],
        keyIngredients: [
          {
            name: "Bisglicinato de Magnésio",
            benefit: "Forma quelatada para máxima absorção e conforto digestivo",
          },
          {
            name: "Magnésio Dimalato",
            benefit: "Reconhecido por seu suporte prolongado à vitalidade e função muscular",
          },
          {
            name: "Óxido de Magnésio",
            benefit: "Concentração estratégica para complementar o pool mineral",
          },
          {
            name: "Pureza Farmacêutica",
            benefit: "Antiumectantes estearato de magnésio e dióxido de silício para estabilidade",
          },
        ],
      };
    }
    
    if (productId === 'prod_4') {
      // VIOS Pulse
      return {
        accordionItems: [
          {
            title: "Ingredientes",
            content: (
              <div className="space-y-4">
                <div>
                  <strong className="text-[#082f1e] font-medium">L-Arginina e Cafeína Anidra (75mg):</strong>{" "}
                  <span className="text-brand-softblack/70">Ativos estratégicos para otimizar a resistência física e o foco mental.</span>
                </div>
                <div>
                  <strong className="text-[#082f1e] font-medium">Complexo B Completo:</strong>{" "}
                  <span className="text-brand-softblack/70">Inclui Vitaminas B1, B2, B3, B5, B6, B9 e B12 para suporte ao metabolismo energético.</span>
                </div>
                <div>
                  <strong className="text-[#082f1e] font-medium">Matriz Mineral de Alta Absorção:</strong>{" "}
                  <span className="text-brand-softblack/70">Combinação de Carbonato de Cálcio, Óxido de Magnésio e Zinco Bisglicinato.</span>
                </div>
                <div>
                  <strong className="text-[#082f1e] font-medium">Vitamina D3 e Biotina:</strong>{" "}
                  <span className="text-brand-softblack/70">Nutrientes de suporte sistêmico para vitalidade e saúde celular.</span>
                </div>
                <div>
                  <strong className="text-[#082f1e] font-medium">Segurança Biológica:</strong>{" "}
                  <span className="text-brand-softblack/70">Fórmula rigorosamente livre de glúten, adequada para os mais altos padrões alimentares.</span>
                </div>
              </div>
            ),
          },
          {
            title: "Como Usar",
            content: "Para integrar esta tecnologia de performance à sua rotina, ingira 02 (duas) cápsulas ao dia. Recomendamos o uso preferencialmente antes de atividades que exijam alto desempenho físico ou mental. A apresentação em frasco de 60 cápsulas oferece um ciclo de 30 rituais de energia absoluta.",
          },
          {
            title: "Ciência",
            content: "A inteligência do VIOS Pulse reside na entrega equilibrada de micronutrientes que atingem até 100% do Valor Diário recomendado. A combinação de Arginina com o complexo vitamínico atua diretamente na redução do cansaço e na otimização do foco, enquanto a cafeína estimula a performance física e o desempenho mental. Esta abordagem multifacetada favorece a termogênese natural do organismo, auxiliando não apenas na disposição imediata, mas também no suporte metabólico ao emagrecimento saudável.",
          },
        ],
        keyIngredients: [
          {
            name: "L-Arginina e Cafeína Anidra",
            benefit: "Ativos estratégicos para otimizar a resistência física e o foco mental",
          },
          {
            name: "Complexo B Completo",
            benefit: "Vitaminas B1, B2, B3, B5, B6, B9 e B12 para suporte ao metabolismo energético",
          },
          {
            name: "Matriz Mineral de Alta Absorção",
            benefit: "Carbonato de Cálcio, Óxido de Magnésio e Zinco Bisglicinato",
          },
          {
            name: "Vitamina D3 e Biotina",
            benefit: "Nutrientes de suporte sistêmico para vitalidade e saúde celular",
          },
        ],
      };
    }
    
    if (productId === 'prod_5') {
      // VIOS Move
      return {
        accordionItems: [
          {
            title: "Ingredientes",
            content: (
              <div className="space-y-4">
                <div>
                  <strong className="text-[#082f1e] font-medium">Colágeno Tipo II não Desnaturado (20 mg):</strong>{" "}
                  <span className="text-brand-softblack/70">Ativo especializado na manutenção da cartilagem e elasticidade das juntas.</span>
                </div>
                <div>
                  <strong className="text-[#082f1e] font-medium">Complexo Anti-inflamatório:</strong>{" "}
                  <span className="text-brand-softblack/70">Cúrcuma e MSM (80 mg) para conforto articular e recuperação.</span>
                </div>
                <div>
                  <strong className="text-[#082f1e] font-medium">Sinergia Óssea Avançada:</strong>{" "}
                  <span className="text-brand-softblack/70">Vitaminas D3 (50 μg) e K2 (24 μg) para mineralização e absorção de fósforo.</span>
                </div>
                <div>
                  <strong className="text-[#082f1e] font-medium">Pool Mineral de Alta Performance:</strong>{" "}
                  <span className="text-brand-softblack/70">Cálcio (204 mg), Magnésio (100 mg) e Zinco Bisglicinato (11 mg) para suporte muscular.</span>
                </div>
                <div>
                  <strong className="text-[#082f1e] font-medium">Segurança Biológica:</strong>{" "}
                  <span className="text-brand-softblack/70">Fórmula rigorosamente livre de glúten, adequada para os mais altos padrões alimentares.</span>
                </div>
              </div>
            ),
          },
          {
            title: "Como Usar",
            content: "Para integrar esta tecnologia de regeneração à sua rotina, ingira 02 (duas) cápsulas ao dia. Recomendamos o uso preferencialmente acompanhado de uma refeição para otimizar a assimilação dos ativos lipossolúveis (D3 e K2). A apresentação em frasco de 60 cápsulas oferece um ciclo de 30 rituais de cuidado articular.",
          },
          {
            title: "Ciência",
            content: (
              <span>
                A inteligência do VIOS Move reside na entrega de micronutrientes em dosagens estratégicas, com destaque para a Vitamina D3 concentrada em <strong className="text-[#082f1e] font-medium">333%</strong> do Valor Diário recomendado. Esta alta potência atua diretamente no fortalecimento do sistema imune e na saúde óssea. Simultaneamente, a fusão de Colágeno Tipo II com a Curcumina auxilia na redução do desgaste das junturas e na mitigação de sintomas associados a impactos repetitivos, promovendo uma recuperação tecidual mais resiliente.
              </span>
            ),
          },
        ],
        keyIngredients: [
          {
            name: "Colágeno Tipo II não Desnaturado",
            benefit: "Ativo especializado na manutenção da cartilagem e elasticidade das juntas",
          },
          {
            name: "Complexo Anti-inflamatório",
            benefit: "Cúrcuma e MSM para conforto articular e recuperação",
          },
          {
            name: "Sinergia Óssea Avançada",
            benefit: "Vitaminas D3 e K2 para mineralização e absorção de fósforo",
          },
          {
            name: "Pool Mineral de Alta Performance",
            benefit: "Cálcio, Magnésio e Zinco Bisglicinato para suporte muscular",
          },
        ],
      };
    }
    
    // Conteúdo padrão para outros produtos
    return {
      accordionItems: [
        {
          title: "Ingredientes",
          content: "Ingredientes selecionados cuidadosamente para garantir a máxima qualidade e eficácia. Cada componente foi escolhido com base em pesquisas científicas e padrões rigorosos de pureza.",
        },
        {
          title: "Como Usar",
          content: "Recomendamos tomar uma cápsula por dia, preferencialmente com uma refeição. Para melhores resultados, mantenha uma alimentação balanceada e pratique exercícios físicos regularmente.",
        },
        {
          title: "Ciência",
          content: "Nosso produto foi desenvolvido com base em estudos científicos publicados em revistas especializadas. Cada ingrediente foi selecionado considerando sua biodisponibilidade e sinergia com os demais componentes da fórmula.",
        },
      ],
      keyIngredients: [
        {
          name: "Bisglicinato de Magnésio",
          benefit: "Absorção superior e biodisponibilidade otimizada",
        },
        {
          name: "Vitamina D3",
          benefit: "Suporte à saúde óssea e sistema imunológico",
        },
        {
          name: "Zinco Quelado",
          benefit: "Melhor absorção e menor irritação gástrica",
        },
      ],
    };
  };

  // Memoizar conteúdo do produto para evitar recálculos
  const productContent = useMemo(() => {
    return getProductSpecificContent(product.id);
  }, [product.id]);

  return (
    <>
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Imagem do Produto */}
        <div className="relative bg-gray-100 aspect-[3/4] overflow-hidden">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority
            quality={90}
          />
        </div>

        {/* Detalhes */}
        <div className="flex flex-col justify-center">
          {/* Título do Produto com TextReveal */}
          <TextReveal
            text={product.name}
            el="h1"
            className="text-3xl font-light uppercase tracking-widest mb-4"
            delay={0.1}
            duration={0.6}
          />
          
          {/* Preço - Fade-in simples (segurança de conversão) */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-xl mb-6"
          >
            {formatPrice(product.price)}
          </motion.p>
          
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

          {/* Botão Adicionar ao Carrinho (Fade-in simples - segurança de conversão) */}
          <motion.button
            data-sticky-bar-trigger
            onClick={handleAddToCart}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="w-full border border-brand-green rounded-sm bg-brand-green text-brand-offwhite px-6 py-3 min-h-[44px] uppercase tracking-[0.2em] text-xs font-medium hover:bg-brand-green/90 active:bg-brand-green/80 transition-all duration-500 ease-out"
          >
            Adicionar ao Carrinho
          </motion.button>

          {/* Texto Legal ANVISA */}
          <div className="mt-6">
            {product.anvisaRecord ? (
              <span className="text-xs text-stone-400 font-mono">
                Processo ANVISA nº {product.anvisaRecord}
              </span>
            ) : (
              <span className="text-xs text-stone-400 font-mono">
                Produto dispensado de registro conforme RDC nº 240/2018.
              </span>
            )}
          </div>

          {/* Accordion com informações do produto */}
          <ProductAccordion items={productContent.accordionItems} />
        </div>
      </div>

      {/* Key Ingredients Section */}
      <div className="w-full max-w-7xl mx-auto px-6">
        <KeyIngredients ingredients={productContent.keyIngredients} />
      </div>

      {/* Sticky Bar - Aparece apenas no mobile quando o botão sai da tela */}
      <StickyBar
        productName={product.name}
        price={product.price}
        productId={product.id}
        onAddToCart={handleAddToCart}
        isOutOfStock={isOutOfStock}
        onWaitlistClick={handleWaitlistClick}
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
