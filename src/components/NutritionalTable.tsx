"use client";

/**
 * Template de tabela nutricional — formato padrão ANVISA.
 * Pode ser usado como componente visual ou exportado como imagem.
 * Dados do VIOS Glow (prod_1).
 */

export interface NutritionalRow {
  nutrient: string;
  amount: string;
  percentDaily: string;
}

export interface NutritionalTableProps {
  /** Porções por embalagem */
  servingsPerPackage?: number;
  /** Porção (ex: "1,1 g (2 cápsulas)") */
  servingSize?: string;
  /** Quantidade da porção para o cabeçalho da tabela (ex: "1,1 g") */
  servingAmount?: string;
  /** Linhas da tabela */
  rows: NutritionalRow[];
  /** Texto do disclaimer sobre nutrientes não significativos */
  disclaimer?: string;
  /** Nota do percentual de VD */
  footnote?: string;
  /** Número de notificação ANVISA (ex: "25351215933202515") */
  anvisaNotification?: string;
  /** Exibir "Indústria Brasileira" */
  showIndustry?: boolean;
  /** Lista de ingredientes */
  ingredients?: string;
  /** Aviso de alérgenos */
  allergenWarning?: string;
  className?: string;
}

const DEFAULT_DISCLAIMER =
  "Não contém quantidades significativas de valor energético, proteínas, gorduras totais, gorduras saturadas, gorduras trans, fibras alimentares e sódio.";
const DEFAULT_FOOTNOTE =
  "*Percentual de valores diários fornecidos pela porção.";

/** Dados nutricionais do VIOS Glow */
export const GLOW_NUTRITIONAL_DATA: NutritionalTableProps = {
  servingsPerPackage: 30,
  servingSize: "1,1 g (2 cápsulas)",
  servingAmount: "1,1 g",
  disclaimer: DEFAULT_DISCLAIMER,
  footnote: DEFAULT_FOOTNOTE,
  rows: [
    { nutrient: "Carboidratos (g)", amount: "0", percentDaily: "0" },
    { nutrient: "Açúcares totais (g)", amount: "0", percentDaily: "0" },
    { nutrient: "Açúcares adicionados (g)", amount: "0", percentDaily: "0" },
    { nutrient: "Vitamina A (µg de RAE)", amount: "250", percentDaily: "31" },
    { nutrient: "Vitamina E (mg)", amount: "15", percentDaily: "100" },
    { nutrient: "Vitamina C (mg)", amount: "90", percentDaily: "90" },
    { nutrient: "Vitamina B1 (mg)", amount: "1,2", percentDaily: "100" },
    { nutrient: "Vitamina B2 (mg)", amount: "1,2", percentDaily: "100" },
    { nutrient: "Vitamina B3 (mg de NE)", amount: "15", percentDaily: "100" },
    { nutrient: "Vitamina B5 (mg)", amount: "5", percentDaily: "100" },
    { nutrient: "Vitamina B6 (mg)", amount: "1,3", percentDaily: "100" },
    { nutrient: "Biotina (µg)", amount: "30", percentDaily: "100" },
    { nutrient: "Vitamina B9 (µg de DFE)", amount: "400", percentDaily: "100" },
    { nutrient: "Vitamina B12 (µg)", amount: "2,4", percentDaily: "100" },
    { nutrient: "Cálcio (mg)", amount: "200", percentDaily: "20" },
    { nutrient: "Cromo (µg)", amount: "35", percentDaily: "100" },
    { nutrient: "Selênio (µg)", amount: "45", percentDaily: "75" },
    { nutrient: "Zinco (mg)", amount: "11", percentDaily: "100" },
  ],
};

const MAG3_DISCLAIMER =
  "Não contém quantidades significativas de valor energético, carboidratos, açúcares totais, açúcares adicionados, proteínas, gorduras totais, gorduras saturadas, gorduras trans, fibras alimentares e sódio.";

/** Dados nutricionais do VIOS Sleep */
export const SLEEP_NUTRITIONAL_DATA: NutritionalTableProps = {
  servingsPerPackage: 360,
  servingSize: "0,1 mL (1 gota)",
  servingAmount: "0,1 mL",
  disclaimer: MAG3_DISCLAIMER,
  footnote: DEFAULT_FOOTNOTE,
  anvisaNotification: "25351088701202570",
  showIndustry: true,
  ingredients:
    "Água purificada, melatonina, agente de massa glicerina, aroma idêntico ao natural, acidulante ácido cítrico, conservantes benzoato de sódio e sorbato de potássio, edulcorante sucralose.",
  allergenWarning:
    "ALÉRGICOS: PODE CONTER LEITE, SOJA, PINOLI (Pinus spp.) E CRUSTÁCEOS (CARANGUEJO). NÃO CONTÉM GLÚTEN.",
  rows: [{ nutrient: "Melatonina (mg)", amount: "0,2", percentDaily: "" }],
};

/** Dados nutricionais do VIOS Mag3 */
export const MAG3_NUTRITIONAL_DATA: NutritionalTableProps = {
  servingsPerPackage: 60,
  servingSize: "0,5 g (1 cápsula)",
  servingAmount: "0,5 g",
  disclaimer: MAG3_DISCLAIMER,
  footnote: DEFAULT_FOOTNOTE,
  anvisaNotification: "25351066423202508",
  showIndustry: true,
  ingredients:
    "Bisglicinato de magnésio, óxido de magnésio, dimagnésio malato e antiumectantes estearato de magnésio e dióxido de silício. Cápsula: água purificada, gelificante gelatina e corante dióxido de titânio.",
  allergenWarning:
    "ALÉRGICOS: PODE CONTER LEITE, SOJA, PINOLI (Pinus spp.) E CRUSTÁCEOS (CARANGUEJO). NÃO CONTÉM GLÚTEN.",
  rows: [{ nutrient: "Magnésio (mg)", amount: "250", percentDaily: "60" }],
};

const PULSE_DISCLAIMER =
  "Não contém quantidades significativas de valor energético, gorduras totais, gorduras saturadas, gorduras trans, fibras alimentares e sódio.";

/** Dados nutricionais do VIOS Pulse */
export const PULSE_NUTRITIONAL_DATA: NutritionalTableProps = {
  servingsPerPackage: 30,
  servingSize: "1,3 g (2 cápsulas)",
  servingAmount: "1,3 g",
  disclaimer: PULSE_DISCLAIMER,
  footnote: DEFAULT_FOOTNOTE,
  rows: [
    { nutrient: "Carboidratos (g)", amount: "0", percentDaily: "0" },
    { nutrient: "Açúcares totais (g)", amount: "0", percentDaily: "" },
    { nutrient: "Açúcares adicionados (g)", amount: "0", percentDaily: "0" },
    { nutrient: "Proteínas (g)", amount: "0", percentDaily: "0" },
    { nutrient: "Arginina (mg)", amount: "300", percentDaily: "" },
    { nutrient: "Vitamina D (µg)", amount: "15", percentDaily: "100" },
    { nutrient: "Vitamina B1 (mg)", amount: "1,2", percentDaily: "100" },
    { nutrient: "Vitamina B2 (mg)", amount: "1,2", percentDaily: "100" },
    { nutrient: "Vitamina B3 (mg de NE)", amount: "15", percentDaily: "100" },
    { nutrient: "Vitamina B5 (mg)", amount: "5", percentDaily: "100" },
    { nutrient: "Vitamina B6 (mg)", amount: "1,3", percentDaily: "100" },
    { nutrient: "Biotina (µg)", amount: "30", percentDaily: "100" },
    { nutrient: "Vitamina B9 (µg de DFE)", amount: "400", percentDaily: "100" },
    { nutrient: "Vitamina B12 (µg)", amount: "2,4", percentDaily: "100" },
    { nutrient: "Cálcio (mg)", amount: "144", percentDaily: "14" },
    { nutrient: "Magnésio (mg)", amount: "140", percentDaily: "33" },
    { nutrient: "Zinco (mg)", amount: "11", percentDaily: "100" },
    { nutrient: "Cafeína (mg)", amount: "75", percentDaily: "" },
  ],
};

/** Dados nutricionais do VIOS Move */
export const MOVE_NUTRITIONAL_DATA: NutritionalTableProps = {
  servingsPerPackage: 30,
  servingSize: "1,1 g (2 cápsulas)",
  servingAmount: "1,1 g",
  disclaimer: DEFAULT_DISCLAIMER,
  footnote: DEFAULT_FOOTNOTE,
  anvisaNotification: "25351215933202515",
  showIndustry: true,
  rows: [
    { nutrient: "Carboidratos (g)", amount: "0", percentDaily: "0" },
    { nutrient: "Açúcares totais (g)", amount: "0", percentDaily: "" },
    { nutrient: "Açúcares adicionados (g)", amount: "0", percentDaily: "0" },
    { nutrient: "Vitamina D (µg)", amount: "50", percentDaily: "333" },
    { nutrient: "Vitamina K (µg)", amount: "24", percentDaily: "20" },
    { nutrient: "Cálcio (mg)", amount: "204", percentDaily: "20" },
    { nutrient: "Magnésio (mg)", amount: "100", percentDaily: "24" },
    { nutrient: "Zinco (mg)", amount: "11", percentDaily: "100" },
    { nutrient: "Curcumina (mg)", amount: "80", percentDaily: "" },
    { nutrient: "Metilsulfonilmetano (mg)", amount: "80", percentDaily: "" },
    {
      nutrient: "Colágeno tipo II não desnaturado (mg)",
      amount: "20",
      percentDaily: "",
    },
  ],
};

export default function NutritionalTable({
  servingsPerPackage = 30,
  servingSize = "1,1 g (2 cápsulas)",
  servingAmount = "1,1 g",
  rows,
  disclaimer = DEFAULT_DISCLAIMER,
  footnote = DEFAULT_FOOTNOTE,
  anvisaNotification,
  showIndustry,
  ingredients,
  allergenWarning,
  className = "",
}: NutritionalTableProps) {
  return (
    <div
      className={`bg-white text-black border border-black/10 rounded-sm overflow-hidden ${className}`}
      style={{ minWidth: 280 }}
    >
      {/* Título */}
      <div className="border-b-2 border-black py-3 px-4">
        <div className="text-center font-bold text-sm uppercase tracking-wide">
          Informação Nutricional
        </div>
      </div>

      {/* Porções */}
      <div className="border-b-2 border-black py-2 px-4 text-xs">
        <p>Porções por embalagem: {servingsPerPackage}</p>
        <p>Porção de {servingSize}</p>
      </div>

      {/* Tabela */}
      <table className="w-full text-xs text-left">
        <thead>
          <tr className="border-b border-black/20">
            <th className="py-2 px-4 font-bold w-[60%]" />
            <th className="py-2 px-4 font-bold text-center border-l border-black/10">
              {servingAmount}
            </th>
            <th className="py-2 px-4 font-bold text-center border-l border-black/10">
              %VD*
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-black/10 last:border-b-0"
            >
              <td className="py-1.5 px-4">{row.nutrient}</td>
              <td className="py-1.5 px-4 text-center border-l border-black/10">
                {row.amount}
              </td>
              <td className="py-1.5 px-4 text-center border-l border-black/10">
                {row.percentDaily}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Disclaimer e rodapé */}
      <div className="border-t-2 border-black py-3 px-4 text-[10px] leading-relaxed space-y-1">
        <p>{disclaimer}</p>
        <p>{footnote}</p>
        {anvisaNotification && (
          <p className="font-medium mt-2">
            Alimento notificado na ANVISA: {anvisaNotification}
          </p>
        )}
        {showIndustry && (
          <p className="font-medium">Indústria Brasileira.</p>
        )}
        {ingredients && (
          <>
            <p className="font-medium mt-2">Ingredientes:</p>
            <p className="mt-0.5">{ingredients}</p>
          </>
        )}
        {allergenWarning && (
          <p className="font-bold uppercase mt-2 text-[9px] leading-relaxed">
            {allergenWarning}
          </p>
        )}
      </div>
    </div>
  );
}
