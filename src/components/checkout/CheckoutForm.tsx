"use client";

import { useCallback } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useCheckoutFormState } from "@/hooks/useCheckoutFormState";
import DadosSection from "@/components/checkout/DadosSection";
import { validateCPF } from "@/utils/validation";

const CHECKOUT_ADDRESS_STORAGE_KEY = "vios_checkout_address";

export interface CheckoutFormData {
  fullName: string;
  cpf: string;
  phone: string;
  address: import("@/utils/validation").AddressData;
  email: string;
}

/** Resumo de pagamento para exibir no formulário (ex.: parcelado) */
export interface PaymentSummary {
  installments: 2 | 3;
  total: number;
  installmentAmount: number;
}

/** Resumo do pedido: subtotal, frete e total */
export interface OrderSummary {
  subtotal: number;
  shipping: number;
  total: number;
  freeShipping: boolean;
  /** Desconto em reais (ex.: 5% PIX) */
  discount?: number;
}

export type CheckoutFormStep = "dados" | "frete" | "pagamento";

interface CheckoutFormProps {
  onSubmit: (data: CheckoutFormData) => void;
  onCancel: () => void;
  initialEmail?: string;
  isLoading?: boolean;
  paymentSummary?: PaymentSummary;
  orderSummary?: OrderSummary;
  embedded?: boolean;
  submitLabel?: string;
  children?: React.ReactNode;
  onCEPChange?: (cep: string) => void;
  step?: CheckoutFormStep;
  onStepChange?: (step: CheckoutFormStep) => void;
  freightSection?: React.ReactNode;
  paymentSection?: React.ReactNode;
  onContinueFromFreight?: () => void;
  /** Callbacks de captura de abandono (onBlur) */
  onEmailBlur?: (email: string) => void;
  onPhoneBlur?: (phone: string) => void;
}

function formatBRL(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

// Classes de input compartilhadas entre todos os campos
const INPUT_BASE =
  "w-full bg-white/70 border rounded-sm px-3 py-3 text-brand-softblack placeholder:text-gray-400 font-light focus:outline-none transition-colors duration-200";
const INPUT_OK =
  "border-gray-200 focus:border-brand-green focus:ring-1 focus:ring-brand-green/20";
const INPUT_ERR =
  "border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-200/40";

export default function CheckoutForm({
  onSubmit,
  onCancel,
  initialEmail,
  isLoading = false,
  paymentSummary,
  orderSummary,
  embedded = false,
  submitLabel,
  children,
  onCEPChange,
  step: stepProp,
  onStepChange,
  freightSection,
  paymentSection,
  onContinueFromFreight,
  onEmailBlur,
  onPhoneBlur,
}: CheckoutFormProps) {
  const isStepMode = stepProp != null;

  const formState = useCheckoutFormState({ initialEmail, onCEPChange });

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // Etapa Dados: validar e avançar
      if (isStepMode && stepProp === "dados") {
        if (formState.validateStepDados()) {
          const cleanedCEP = formState.address.cep.replace(/\D/g, "");
          try {
            localStorage.setItem(
              CHECKOUT_ADDRESS_STORAGE_KEY,
              JSON.stringify({
                cep: cleanedCEP,
                street: formState.address.street.trim(),
                number: formState.address.number.trim(),
                complement: formState.address.complement?.trim() ?? "",
                neighborhood: formState.address.neighborhood.trim(),
                city: formState.address.city.trim(),
                state: formState.address.state.trim(),
              }),
            );
          } catch {
            /* ignore */
          }
          onStepChange?.("frete");
        }
        return;
      }

      // Etapa Frete: delega ao pai
      if (isStepMode && stepProp === "frete") {
        onContinueFromFreight?.();
        return;
      }

      // Modo completo / etapa pagamento: validar CPF e submeter
      formState.touchField("cpf");
      formState.validateField("cpf", formState.cpf);
      const cleanedCPF = formState.cpf.replace(/\D/g, "");
      if (!validateCPF(formState.cpf)) {
        return;
      }

      const emailValue = (initialEmail ?? formState.email).trim().toLowerCase();
      const cleanedPhone = formState.phone.replace(/\D/g, "");
      const cleanedCEP = formState.address.cep.replace(/\D/g, "");

      onSubmit({
        fullName: formState.fullName.trim(),
        cpf: cleanedCPF,
        phone: cleanedPhone,
        address: { ...formState.address, cep: cleanedCEP },
        email: emailValue,
      });
    },
    [
      isStepMode,
      stepProp,
      formState,
      initialEmail,
      onStepChange,
      onContinueFromFreight,
      onSubmit,
    ],
  );

  const showStepDados = !isStepMode || stepProp === "dados";
  const showStepFrete = isStepMode && stepProp === "frete";
  const showStepPagamento = isStepMode && stepProp === "pagamento";

  const formEl = (
    <form onSubmit={handleSubmit} className="p-8 md:p-12">
      {/* Header */}
      <div className="mb-12">
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-brand-softblack/60 mb-2">
          VIOS LABS · CHECKOUT
        </p>
        <h2 className="text-2xl md:text-3xl font-light uppercase tracking-widest text-brand-softblack mb-3">
          The Laboratory Aesthetic
        </h2>
        {paymentSummary ? (
          <p className="text-sm font-light text-brand-softblack/80 leading-relaxed mb-2">
            Pagamento em{" "}
            <strong className="font-medium text-brand-green">
              {paymentSummary.installments}x de R${" "}
              {formatBRL(paymentSummary.installmentAmount)} sem juros
            </strong>{" "}
            (total R$ {formatBRL(paymentSummary.total)}).
          </p>
        ) : null}
        {orderSummary ? (
          <div className="mb-4 p-4 bg-gray-50/80 rounded-sm border border-gray-100">
            <p className="text-[10px] uppercase tracking-widest text-brand-softblack/60 mb-2">
              Resumo do pedido
            </p>
            <div className="space-y-1 text-sm font-light text-brand-softblack">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>R$ {formatBRL(orderSummary.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Frete</span>
                <span>
                  {orderSummary.freeShipping ? (
                    <span className="text-brand-green">Grátis</span>
                  ) : (
                    <>R$ {formatBRL(orderSummary.shipping)}</>
                  )}
                </span>
              </div>
              {orderSummary.discount != null && orderSummary.discount > 0 && (
                <div className="flex justify-between text-brand-green">
                  <span>5% de vantagem (PIX)</span>
                  <span>- R$ {formatBRL(orderSummary.discount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-200 font-medium">
                <span>Total</span>
                <span>R$ {formatBRL(orderSummary.total)}</span>
              </div>
            </div>
          </div>
        ) : null}
        <p className="text-sm font-light text-brand-softblack/60 leading-relaxed">
          Preencha os dados abaixo.
        </p>
      </div>

      <div className="space-y-10">
        {/* Etapa Dados */}
        {showStepDados && (
          <DadosSection
            email={formState.email}
            fullName={formState.fullName}
            phone={formState.phone}
            address={formState.address}
            initialEmail={initialEmail}
            isLoadingCEP={formState.isLoadingCEP}
            errors={formState.errors}
            touched={formState.touched}
            setEmail={formState.setEmail}
            setFullName={formState.setFullName}
            handlePhoneChange={formState.handlePhoneChange}
            handleCEPChange={formState.handleCEPChange}
            handleCEPBlur={formState.handleCEPBlur}
            validateField={formState.validateField}
            touchField={formState.touchField}
            updateAddressField={formState.updateAddressField}
            setAddress={formState.setAddress}
            inputBase={INPUT_BASE}
            inputOk={INPUT_OK}
            inputErr={INPUT_ERR}
            onEmailBlur={onEmailBlur}
            onPhoneBlur={onPhoneBlur}
          />
        )}

        {/* Etapa Frete */}
        {showStepFrete && freightSection}

        {/* Etapa Pagamento */}
        {showStepPagamento && (
          <>
            {/* CPF para emissão da nota fiscal */}
            <div className="p-5 md:p-6 border border-gray-100 bg-white rounded-sm">
              <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-brand-softblack/70 mb-1">
                Fiscal
              </p>
              <p className="text-[11px] text-brand-softblack/50 mb-6">
                Seu CPF é necessário para emissão da nota fiscal.
              </p>
              <div>
                <label className="text-[10px] uppercase tracking-widest block mb-3 opacity-70 font-medium text-brand-softblack">
                  CPF <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formState.cpf}
                  onChange={(e) => formState.handleCPFChange(e.target.value)}
                  onBlur={() => {
                    formState.touchField("cpf");
                    formState.validateField("cpf", formState.cpf);
                  }}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className={`${INPUT_BASE} ${formState.errors.cpf ? INPUT_ERR : INPUT_OK}`}
                />
                {formState.errors.cpf && (
                  <p className="text-[10px] text-red-500 mt-2">
                    {formState.errors.cpf}
                  </p>
                )}
              </div>
            </div>

            {paymentSection}
          </>
        )}

        {/* Modo lista única (sem steps) */}
        {!isStepMode && children}

        {/* Ações */}
        <div className="flex flex-col-reverse md:flex-row md:items-center gap-3 md:justify-between pt-2">
          <button
            type="button"
            onClick={
              isStepMode && stepProp === "frete"
                ? () => onStepChange?.("dados")
                : isStepMode && stepProp === "pagamento"
                  ? () => onStepChange?.("frete")
                  : onCancel
            }
            className="w-full md:w-auto px-5 py-3 border border-gray-200 rounded-sm text-brand-softblack/80 text-[11px] uppercase tracking-widest hover:border-brand-green/40 hover:text-brand-softblack transition-colors"
          >
            Voltar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full md:w-auto px-6 py-3 bg-brand-green text-white rounded-sm text-[11px] uppercase tracking-widest hover:bg-brand-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading
              ? "Processando…"
              : isStepMode && stepProp === "dados"
                ? "Continuar para Frete"
                : isStepMode && stepProp === "frete"
                  ? "Continuar para Pagamento"
                  : (submitLabel ?? "Continuar")}
          </button>
        </div>
      </div>
    </form>
  );

  if (embedded) {
    return <div className="w-full">{formEl}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/55 backdrop-blur-sm z-80 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="bg-white/95 rounded-sm shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden relative border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-6 right-6 p-2 text-gray-400 hover:text-brand-softblack transition-colors duration-300 z-10"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex-1 min-h-0 overflow-y-auto">{formEl}</div>
      </motion.div>
    </motion.div>
  );
}

