import { PRODUCTS } from "./products";

/** ID do produto Glow (prod_1) — referência para integrações (Bling, etc.). */
export const GLOW_PRODUCT_ID = "prod_1";

export interface Kit {
  id: string;
  name: string;
  price: number;
  oldPrice?: number; // Preço individual (sem desconto)
  products: string[]; // IDs dos produtos que compõem o kit
  description: string; // Frase de apoio (curta)
  badge?: "kit" | "protocolo";
  image?: string; // URL da imagem do kit (opcional - se não fornecido, usa template)
  // Campos para página detalhada do kit
  longDescription?: string; // Descrição longa e detalhada do kit
  benefits?: string[]; // Lista de benefícios principais
  howToUse?: string; // Instruções de uso do kit
  content?: {
    // Conteúdo estruturado para a página do kit
    hero?: {
      title?: string; // Título principal (opcional, usa name se não fornecido)
      subtitle?: string; // Subtítulo
      description?: string; // Descrição hero
    };
    about?: {
      title?: string;
      paragraphs?: string[]; // Parágrafos sobre o kit
    };
    products?: {
      title?: string; // Título da seção de produtos
      description?: string; // Descrição da combinação
    };
    benefits?: {
      title?: string;
      items?: Array<{
        title: string;
        description: string;
      }>;
    };
    usage?: {
      title?: string;
      instructions?: string[];
    };
    faq?: Array<{
      question: string;
      answer: string;
    }>;
  };
}

const kitsData = [
  {
    id: "kit_1",
    name: "Sinergia Absoluta",
    products: ["prod_1", "prod_2", "prod_3", "prod_4", "prod_5"],
    description: "A totalidade da biotecnologia VIOS em um único protocolo.",
    badge: "kit" as const,
    price: 797.0,
    oldPrice: 951.0,
    image: "",
    longDescription:
      "Um sistema integrado de suplementação desenhado para oferecer suporte nutricional em todas as fases do metabolismo diário.",
    content: {
      hero: {
        subtitle: "Gerenciamento 360°",
        description:
          "Um sistema integrado de suplementação desenhado para oferecer suporte nutricional em todas as fases do metabolismo diário.",
      },
      about: {
        title: "O que é o Sinergia Absoluta",
        paragraphs: [
          "O Protocolo Sinergia Absoluta é um sistema integrado de suplementação desenhado para oferecer suporte nutricional em todas as fases do metabolismo diário.",
          "Esta combinação estratégica une cinco produtos essenciais da VIOS LABS, cada um com sua função específica, trabalhando em sinergia para proporcionar um gerenciamento completo do organismo.",
        ],
      },
      products: {
        title: "Produtos Incluídos",
        description:
          "Cinco produtos essenciais que trabalham em sinergia para um gerenciamento 360° do organismo.",
      },
      benefits: {
        title: "Benefícios de Cada Produto",
        items: [
          {
            title: "Pulse",
            description:
              "Formulado com ativos que auxiliam no aporte de nutrientes voltados à prontidão e ao metabolismo energético matinal.",
          },
          {
            title: "MAG3",
            description:
              "Combinação de três fontes de magnésio para auxiliar na biodisponibilidade deste mineral, importante para as funções musculares e neuromusculares.",
          },
          {
            title: "Move",
            description:
              "Composto por nutrientes que oferecem suporte à manutenção dos tecidos conjuntivos e articulares.",
          },
          {
            title: "Glow",
            description:
              "Blend de vitaminas e minerais antioxidantes que auxiliam na proteção dos danos causados pelos radicais livres.",
          },
          {
            title: "Sleep",
            description:
              "Formulação voltada para o suporte nutricional do período de repouso, auxiliando o organismo na transição para o estado de relaxamento.",
          },
        ],
      },
    },
  },
  {
    id: "kit_2",
    name: "Protocolo Essencial Vios",
    products: ["prod_1", "prod_4", "prod_2"], // Glow + Pulse + Sleep
    description: "O tripé da vitalidade: estética, cognição e restauração.",
    badge: "protocolo" as const,
    price: 527.0,
    oldPrice: 595.0,
    longDescription:
      "Focado nos pilares de bem-estar para o dia a dia, unindo suporte cognitivo, dérmico e restauração noturna.",
    content: {
      hero: {
        subtitle: "Suporte de Rotina",
        description:
          "Focado nos pilares de bem-estar para o dia a dia, unindo suporte cognitivo, dérmico e restauração noturna.",
      },
      about: {
        title: "O que é o Protocolo Essencial",
        paragraphs: [
          "O Protocolo Essencial Vios é focado nos pilares de bem-estar para o dia a dia, unindo suporte cognitivo, dérmico e restauração noturna.",
          "Esta combinação estratégica reúne três produtos essenciais que trabalham em sinergia para proporcionar suporte completo às necessidades diárias do organismo.",
        ],
      },
      products: {
        title: "Produtos Incluídos",
        description:
          "Três produtos essenciais que formam o tripé da vitalidade: estética, cognição e restauração.",
      },
      benefits: {
        title: "Benefícios de Cada Produto",
        items: [
          {
            title: "Pulse",
            description:
              "Auxilia no aporte nutricional para períodos de maior exigência de foco e energia.",
          },
          {
            title: "Glow",
            description:
              "Fornece micronutrientes precursores que auxiliam na manutenção da integridade da pele, unhas e cabelos.",
          },
          {
            title: "Sleep",
            description:
              "Atua oferecendo suporte aos processos fisiológicos que ocorrem durante o período de repouso.",
          },
        ],
      },
    },
  },
  {
    id: "kit_3",
    name: "Eixo Cognitivo",
    products: ["prod_4", "prod_3", "prod_2"], // Pulse + Mag3 + Sleep
    description: "Sustentação mental e estabilidade neurológica.",
    badge: "protocolo" as const,
    price: 477.0,
    oldPrice: 543.0,
    longDescription:
      "Desenvolvido para oferecer suporte aos processos que envolvem a estabilidade mineral e a atividade intelectual.",
    content: {
      hero: {
        subtitle: "Suporte Neurológico e Mineral",
        description:
          "Desenvolvido para oferecer suporte aos processos que envolvem a estabilidade mineral e a atividade intelectual.",
      },
      about: {
        title: "O que é o Eixo Cognitivo",
        paragraphs: [
          "O Eixo Cognitivo é um protocolo desenvolvido para oferecer suporte aos processos que envolvem a estabilidade mineral e a atividade intelectual.",
          "Esta combinação estratégica une três produtos essenciais que trabalham em sinergia para proporcionar suporte completo ao sistema nervoso e às funções cognitivas.",
        ],
      },
      products: {
        title: "Produtos Incluídos",
        description:
          "Três produtos essenciais que trabalham em sinergia para sustentação mental e estabilidade neurológica.",
      },
      benefits: {
        title: "Benefícios de Cada Produto",
        items: [
          {
            title: "Pulse",
            description:
              "Auxilia na oferta de nutrientes que participam das vias de foco e atenção.",
          },
          {
            title: "MAG3",
            description:
              "Oferece suporte mineral para o equilíbrio eletrolítico e funcionamento do sistema nervoso.",
          },
          {
            title: "Sleep",
            description:
              "Contribui com o aporte nutricional necessário para o período de recuperação neurológica noturna.",
          },
        ],
      },
    },
  },
  {
    id: "kit_4",
    name: "Dinâmica Sistêmica",
    products: ["prod_4", "prod_3", "prod_5"], // Pulse + Mag3 + Move
    description: "Performance e longevidade para o corpo em movimento.",
    badge: "protocolo" as const,
    price: 487.0,
    oldPrice: 553.0,
    longDescription:
      "Suporte para a manutenção da estrutura física e do equilíbrio mineral de indivíduos ativos.",
    content: {
      hero: {
        subtitle: "Estrutura e Movimento",
        description:
          "Suporte para a manutenção da estrutura física e do equilíbrio mineral de indivíduos ativos.",
      },
      about: {
        title: "O que é a Dinâmica Sistêmica",
        paragraphs: [
          "A Dinâmica Sistêmica é um protocolo de suporte para a manutenção da estrutura física e do equilíbrio mineral de indivíduos ativos.",
          "Esta combinação estratégica une três produtos essenciais que trabalham em sinergia para proporcionar performance e longevidade para o corpo em movimento.",
        ],
      },
      products: {
        title: "Produtos Incluídos",
        description:
          "Três produtos essenciais que trabalham em sinergia para performance e longevidade do corpo em movimento.",
      },
      benefits: {
        title: "Benefícios de Cada Produto",
        items: [
          {
            title: "Move",
            description:
              "Fornece nutrientes essenciais para a manutenção da saúde das articulações e tecidos de sustentação.",
          },
          {
            title: "MAG3",
            description:
              "Auxilia no metabolismo energético e no funcionamento muscular, importante para o pós-esforço.",
          },
          {
            title: "Pulse",
            description:
              "Oferece suporte nutricional para a disposição necessária às atividades físicas e rotineiras.",
          },
        ],
      },
    },
  },
  {
    id: "kit_5",
    name: "Ritmo Circadiano",
    products: ["prod_4", "prod_2"], // Pulse + Sleep
    description: "A ciência da alternância: propulsão e repouso.",
    badge: "protocolo" as const,
    price: 337.0,
    oldPrice: 376.0,
    longDescription:
      "Suporte nutricional voltado para a alternância entre os estados de prontidão e repouso.",
    content: {
      hero: {
        subtitle: "Equilíbrio Fisiológico",
        description:
          "Suporte nutricional voltado para a alternância entre os estados de prontidão e repouso.",
      },
      about: {
        title: "O que é o Ritmo Circadiano",
        paragraphs: [
          "O Ritmo Circadiano é um protocolo de suporte nutricional voltado para a alternância entre os estados de prontidão e repouso.",
          "Esta combinação estratégica une dois produtos essenciais que trabalham em sinergia para respeitar e otimizar o ciclo natural do organismo, oferecendo suporte no início e no final do dia.",
        ],
      },
      products: {
        title: "Produtos Incluídos",
        description:
          "Dois produtos essenciais que trabalham em sinergia para a ciência da alternância: propulsão e repouso.",
      },
      benefits: {
        title: "Benefícios de Cada Produto",
        items: [
          {
            title: "Pulse",
            description:
              "Formulado para oferecer suporte nutricional no início do ciclo diário, quando a demanda metabólica é elevada.",
          },
          {
            title: "Sleep",
            description:
              "Auxilia no aporte de nutrientes que favorecem o relaxamento e a higiene do sono ao final do dia.",
          },
        ],
      },
    },
  },
  {
    id: "kit_6",
    name: "Bio-Regeneração",
    products: ["prod_1", "prod_2"], // Glow + Sleep
    description: "Otimização dérmica via indução do sono profundo.",
    badge: "protocolo" as const,
    price: 347.0,
    oldPrice: 398.0,
    longDescription:
      "Protocolo fundamentado nos princípios da cronobiologia, oferecendo suporte nutricional noturno.",
    content: {
      hero: {
        subtitle: "Crononutrição Aplicada",
        description:
          "Protocolo fundamentado nos princípios da cronobiologia, oferecendo suporte nutricional noturno.",
      },
      about: {
        title: "O que é o Bio-Regeneração",
        paragraphs: [
          "O Bio-Regeneração é um protocolo fundamentado nos princípios da cronobiologia, oferecendo suporte nutricional noturno.",
          "Esta combinação estratégica une dois produtos essenciais que trabalham em sinergia para otimizar a regeneração dérmica através da indução do sono profundo e do fornecimento de micronutrientes antioxidantes.",
        ],
      },
      products: {
        title: "Produtos Incluídos",
        description:
          "Dois produtos essenciais que trabalham em sinergia para otimização dérmica via indução do sono profundo.",
      },
      benefits: {
        title: "Benefícios de Cada Produto",
        items: [
          {
            title: "Glow",
            description:
              "Fornece antioxidantes e micronutrientes que auxiliam na manutenção tecidual.",
          },
          {
            title: "Sleep",
            description:
              "Auxilia o organismo a atingir o estado de repouso necessário para que os micronutrientes do Glow sejam processados adequadamente pelo metabolismo.",
          },
        ],
      },
    },
  },
];

export const KITS: Kit[] = kitsData;
