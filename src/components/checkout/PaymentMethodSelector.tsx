"use client";

import { memo } from "react";
import { motion } from "framer-motion";

export type PaymentMethod = "card" | "pix";
export type InstallmentOption = "1x" | "2x" | "3x";

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod | null;
  installmentOption: InstallmentOption | null;
  onMethodChange: (method: PaymentMethod) => void;
  onInstallmentChange: (option: InstallmentOption) => void;
  totalAmount: number;
  className?: string;
}

/**
 * Calcula valor por parcela
 */
function calculateInstallmentAmount(
  total: number,
  installments: number,
): number {
  return Math.round((total / installments) * 100) / 100;
}

/**
 * Componente para seleção de método de pagamento
 * Suporta Cartão (com parcelamento) e PIX
 * Design sutil e compacto para não cobrir o carrinho
 */
function PaymentMethodSelector({
  selectedMethod,
  installmentOption,
  onMethodChange,
  onInstallmentChange,
  totalAmount,
  className = "",
}: PaymentMethodSelectorProps) {
  const handleCardSelect = () => {
    onMethodChange("card");
    // Se não houver opção de parcela selecionada, selecionar 1x por padrão
    if (!installmentOption) {
      onInstallmentChange("1x");
    }
  };

  const handlePixSelect = () => {
    onMethodChange("pix");
    // PIX não tem parcelamento, limpar seleção
    onInstallmentChange("1x");
  };

  // Calcular valores por parcela
  const installment1x = totalAmount;
  const installment2x = calculateInstallmentAmount(totalAmount, 2);
  const installment3x = calculateInstallmentAmount(totalAmount, 3);

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Título - Mais sutil */}
      <h3 className="text-[10px] font-light uppercase tracking-wider text-brand-softblack/60">
        Forma de Pagamento
      </h3>

      {/* Métodos de Pagamento - Compacto */}
      <div className="flex gap-2">
        {/* Cartão de Crédito */}
        <button
          type="button"
          onClick={handleCardSelect}
          className={`group relative flex-1 px-2.5 py-2 border rounded-sm transition-all duration-200 ${
            selectedMethod === "card"
              ? "border-brand-green bg-brand-green/5"
              : "border-gray-200 hover:border-brand-green/30 bg-white"
          }`}
          aria-pressed={selectedMethod === "card"}
          aria-label="Pagar com cartão de crédito"
        >
          <div className="flex items-center justify-center gap-1.5">
            {/* Ícone de Cartão - SVG customizado */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
              className={`w-3.5 h-3.5 transition-colors ${
                selectedMethod === "card" ? "text-brand-green" : "text-gray-400"
              }`}
              aria-hidden="true"
            >
              <path
                fill="currentColor"
                d="M32 376a56 56 0 0 0 56 56h336a56 56 0 0 0 56-56V222H32Zm66-76a30 30 0 0 1 30-30h48a30 30 0 0 1 30 30v20a30 30 0 0 1-30 30h-48a30 30 0 0 1-30-30ZM424 80H88a56 56 0 0 0-56 56v26h448v-26a56 56 0 0 0-56-56Z"
              />
            </svg>

            <span
              className={`text-[10px] font-light transition-colors ${
                selectedMethod === "card"
                  ? "text-brand-green"
                  : "text-brand-softblack/70"
              }`}
            >
              Cartão
            </span>

            {/* Indicador de seleção - Mais sutil */}
            {selectedMethod === "card" && (
              <div className="shrink-0 w-2.5 h-2.5 rounded-full bg-brand-green flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={3}
                  stroke="currentColor"
                  className="w-1.5 h-1.5 text-brand-offwhite"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              </div>
            )}
          </div>
        </button>

        {/* PIX */}
        <button
          type="button"
          onClick={handlePixSelect}
          className={`group relative flex-1 px-2.5 py-2 border rounded-sm transition-all duration-200 ${
            selectedMethod === "pix"
              ? "border-brand-green bg-brand-green/5"
              : "border-gray-200 hover:border-brand-green/30 bg-white"
          }`}
          aria-pressed={selectedMethod === "pix"}
          aria-label="Pagar com PIX"
        >
          <div className="flex items-center justify-center gap-1.5">
            {/* Ícone de PIX - SVG customizado */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              className={`w-3.5 h-3.5 transition-colors ${
                selectedMethod === "pix" ? "text-brand-green" : "text-gray-400"
              }`}
              aria-hidden="true"
            >
              <path
                fill="currentColor"
                d="M11.917 11.71a2.046 2.046 0 0 1-1.454-.602l-2.1-2.1a.4.4 0 0 0-.551 0l-2.108 2.108a2.044 2.044 0 0 1-1.454.602h-.414l2.66 2.66c.83.83 2.177.83 3.007 0l2.667-2.668h-.253zM4.25 4.282c.55 0 1.066.214 1.454.602l2.108 2.108a.39.39 0 0 0 .552 0l2.1-2.1a2.044 2.044 0 0 1 1.453-.602h.253L9.503 1.623a2.127 2.127 0 0 0-3.007 0l-2.66 2.66h.414z"
              />
              <path
                fill="currentColor"
                d="m14.377 6.496l-1.612-1.612a.307.307 0 0 1-.114.023h-.733c-.379 0-.75.154-1.017.422l-2.1 2.1a1.005 1.005 0 0 1-1.425 0L5.268 5.32a1.448 1.448 0 0 0-1.018-.422h-.9a.306.306 0 0 1-.109-.021L1.623 6.496c-.83.83-.83 2.177 0 3.008l1.618 1.618a.305.305 0 0 1 .108-.022h.901c.38 0 .75-.153 1.018-.421L7.375 8.57a1.034 1.034 0 0 1 1.426 0l2.1 2.1c.267.268.638.421 1.017.421h.733c.04 0 .079.01.114.024l1.612-1.612c.83-.83.83-2.178 0-3.008z"
              />
            </svg>

            <span
              className={`text-[10px] font-light transition-colors ${
                selectedMethod === "pix"
                  ? "text-brand-green"
                  : "text-brand-softblack/70"
              }`}
            >
              PIX
            </span>

            {/* Indicador de seleção - Mais sutil */}
            {selectedMethod === "pix" && (
              <div className="shrink-0 w-2.5 h-2.5 rounded-full bg-brand-green flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={3}
                  stroke="currentColor"
                  className="w-1.5 h-1.5 text-brand-offwhite"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              </div>
            )}
          </div>
        </button>
      </div>

      {/* Opções de Parcelamento (apenas para Cartão) - Compacto */}
      {selectedMethod === "card" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="pt-1.5"
        >
          <div className="flex gap-1.5">
            {/* À vista (1x) */}
            <button
              type="button"
              onClick={() => onInstallmentChange("1x")}
              className={`flex-1 px-2 py-1.5 text-center border rounded-sm transition-all duration-200 text-[10px] min-h-[32px] flex items-center justify-center ${
                installmentOption === "1x"
                  ? "border-brand-green bg-brand-green/5 text-brand-green font-medium"
                  : "border-gray-200 hover:border-brand-green/30 text-brand-softblack/70"
              }`}
              aria-pressed={installmentOption === "1x"}
              aria-label="Cartão à vista"
            >
              À vista
            </button>

            {/* 2x */}
            <button
              type="button"
              onClick={() => onInstallmentChange("2x")}
              className={`flex-1 px-2 py-1.5 text-center border rounded-sm transition-all duration-200 text-[10px] min-h-[32px] flex items-center justify-center ${
                installmentOption === "2x"
                  ? "border-brand-green bg-brand-green/5 text-brand-green font-medium"
                  : "border-gray-200 hover:border-brand-green/30 text-brand-softblack/70"
              }`}
              aria-pressed={installmentOption === "2x"}
            >
              2x
            </button>

            {/* 3x */}
            <button
              type="button"
              onClick={() => onInstallmentChange("3x")}
              className={`flex-1 px-2 py-1.5 text-center border rounded-sm transition-all duration-200 text-[10px] min-h-[32px] flex items-center justify-center ${
                installmentOption === "3x"
                  ? "border-brand-green bg-brand-green/5 text-brand-green font-medium"
                  : "border-gray-200 hover:border-brand-green/30 text-brand-softblack/70"
              }`}
              aria-pressed={installmentOption === "3x"}
            >
              3x
            </button>
          </div>
          {/* Valor por parcela - Sutil e pequeno */}
          {installmentOption && installmentOption !== "1x" && (
            <p className="text-[9px] text-brand-softblack/50 text-center mt-1">
              {installmentOption === "2x"
                ? `R$ ${installment2x.toFixed(2).replace(".", ",")} cada`
                : `R$ ${installment3x.toFixed(2).replace(".", ",")} cada`}
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}

export default memo(PaymentMethodSelector);
