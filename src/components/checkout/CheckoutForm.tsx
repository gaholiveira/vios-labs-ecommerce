"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import {
  validateCPF,
  formatCPF,
  validateCEP,
  formatCEP,
  validatePhone,
  formatPhone,
  validateAddress,
  type AddressData,
} from "@/utils/validation";
import { fetchAddressByCEP } from "@/utils/cep";

export interface CheckoutFormData {
  cpf: string;
  phone: string;
  address: AddressData;
}

/** Resumo de pagamento para exibir no formulário (ex.: parcelado) */
export interface PaymentSummary {
  installments: 2 | 3;
  total: number;
  installmentAmount: number;
}

/** Resumo do pedido: subtotal, frete e total (para exibir no formulário) */
export interface OrderSummary {
  subtotal: number;
  shipping: number;
  total: number;
  freeShipping: boolean;
  /** Desconto em reais (ex.: 5% PIX) — quando presente, exibe linha no resumo */
  discount?: number;
}

interface CheckoutFormProps {
  onSubmit: (data: CheckoutFormData) => void;
  onCancel: () => void;
  initialEmail?: string;
  isLoading?: boolean;
  /** Quando preenchido, exibe "Pagamento em 3x de R$ X,XX (total R$ Y,YY)" no topo */
  paymentSummary?: PaymentSummary;
  /** Quando preenchido, exibe resumo com subtotal, frete e total no formulário */
  orderSummary?: OrderSummary;
}

/**
 * Componente de formulário para coletar dados de checkout
 * Design minimalista e elegante seguindo o padrão VIOS Labs
 */
function formatBRL(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

export default function CheckoutForm({
  onSubmit,
  onCancel,
  initialEmail,
  isLoading = false,
  paymentSummary,
  orderSummary,
}: CheckoutFormProps) {
  // Estados do formulário
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState<AddressData>({
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  });

  // Estados de validação e feedback
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoadingCEP, setIsLoadingCEP] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Estados brasileiros
  const estados = [
    "AC",
    "AL",
    "AP",
    "AM",
    "BA",
    "CE",
    "DF",
    "ES",
    "GO",
    "MA",
    "MT",
    "MS",
    "MG",
    "PA",
    "PB",
    "PR",
    "PE",
    "PI",
    "RJ",
    "RN",
    "RS",
    "RO",
    "RR",
    "SC",
    "SP",
    "SE",
    "TO",
  ];

  /**
   * Busca endereço via CEP quando CEP é válido e completo
   */
  const handleCEPBlur = useCallback(async () => {
    if (!address.cep || address.cep.length < 8) {
      return;
    }

    const cleanedCEP = address.cep.replace(/\D/g, "");
    if (cleanedCEP.length !== 8) {
      return;
    }

    setIsLoadingCEP(true);
    setErrors((prev) => ({ ...prev, cep: "" }));

    try {
      const cepData = await fetchAddressByCEP(address.cep);

      if (cepData) {
        setAddress((prev) => ({
          ...prev,
          street: cepData.logradouro || "",
          neighborhood: cepData.bairro || "",
          city: cepData.localidade || "",
          state: cepData.uf || "",
          complement: cepData.complemento || prev.complement,
        }));
        setErrors((prev) => ({ ...prev, cep: "" }));
      } else {
        setErrors((prev) => ({
          ...prev,
          cep: "CEP não encontrado",
        }));
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      setErrors((prev) => ({
        ...prev,
        cep: "Erro ao buscar CEP. Tente novamente.",
      }));
    } finally {
      setIsLoadingCEP(false);
    }
  }, [address.cep]);

  /**
   * Valida campo individual
   */
  const validateField = useCallback(
    (field: string, value: string | AddressData) => {
      const newErrors: Record<string, string> = { ...errors };

      switch (field) {
        case "cpf":
          if (!value || (value as string).trim().length === 0) {
            newErrors.cpf = "CPF é obrigatório";
          } else if (!validateCPF(value as string)) {
            newErrors.cpf = "CPF inválido";
          } else {
            delete newErrors.cpf;
          }
          break;

        case "phone":
          if (!value || (value as string).trim().length === 0) {
            newErrors.phone = "Telefone é obrigatório";
          } else if (!validatePhone(value as string)) {
            newErrors.phone = "Telefone inválido (use DDD + número)";
          } else {
            delete newErrors.phone;
          }
          break;

        case "address":
          const addressValidation = validateAddress(value as AddressData);
          if (!addressValidation.valid) {
            addressValidation.errors.forEach((error) => {
              if (error.includes("CEP")) {
                newErrors.cep = error;
              } else if (error.includes("Rua")) {
                newErrors.street = error;
              } else if (error.includes("Número")) {
                newErrors.number = error;
              } else if (error.includes("Bairro")) {
                newErrors.neighborhood = error;
              } else if (error.includes("Cidade")) {
                newErrors.city = error;
              } else if (error.includes("Estado")) {
                newErrors.state = error;
              }
            });
          } else {
            delete newErrors.cep;
            delete newErrors.street;
            delete newErrors.number;
            delete newErrors.neighborhood;
            delete newErrors.city;
            delete newErrors.state;
          }
          break;
      }

      setErrors(newErrors);
    },
    [errors],
  );

  /**
   * Handler de mudança de CPF com formatação automática
   */
  const handleCPFChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 11) {
      const formatted = formatCPF(cleaned);
      setCpf(formatted);
      if (touched.cpf) {
        validateField("cpf", cleaned);
      }
    }
  };

  /**
   * Handler de mudança de telefone com formatação automática
   */
  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 11) {
      const formatted = formatPhone(cleaned);
      setPhone(formatted);
      if (touched.phone) {
        validateField("phone", cleaned);
      }
    }
  };

  /**
   * Handler de mudança de CEP com formatação automática
   */
  const handleCEPChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 8) {
      const formatted = formatCEP(cleaned);
      setAddress((prev) => ({ ...prev, cep: formatted }));
      if (touched.cep) {
        validateField("address", { ...address, cep: cleaned });
      }
    }
  };

  /**
   * Handler de submit do formulário
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Marcar todos os campos como tocados
    setTouched({
      cpf: true,
      phone: true,
      cep: true,
      street: true,
      number: true,
      neighborhood: true,
      city: true,
      state: true,
    });

    // Validar todos os campos
    validateField("cpf", cpf);
    validateField("phone", phone);
    validateField("address", address);

    // Verificar se há erros
    const cpfValid = validateCPF(cpf);
    const phoneValid = validatePhone(phone);
    const addressValid = validateAddress(address).valid;

    if (!cpfValid || !phoneValid || !addressValid) {
      return;
    }

    // Limpar CPF e telefone para formato numérico
    const cleanedCPF = cpf.replace(/\D/g, "");
    const cleanedPhone = phone.replace(/\D/g, "");
    const cleanedCEP = address.cep.replace(/\D/g, "");

    onSubmit({
      cpf: cleanedCPF,
      phone: cleanedPhone,
      address: {
        ...address,
        cep: cleanedCEP,
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-80 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="bg-white rounded-sm shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão Fechar */}
        <button
          onClick={onCancel}
          className="absolute top-6 right-6 p-2 text-gray-400 hover:text-brand-softblack transition-colors duration-300 z-10"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <form onSubmit={handleSubmit} className="p-8 md:p-12">
          {/* Header */}
          <div className="mb-12">
            <h2 className="text-2xl md:text-3xl font-light uppercase tracking-widest text-brand-softblack mb-3">
              Dados para Entrega
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
              <div className="mb-4 p-4 bg-gray-50 rounded-sm border border-gray-100">
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
                  {orderSummary.discount != null &&
                    orderSummary.discount > 0 && (
                      <div className="flex justify-between text-brand-green">
                        <span>Desconto 5% (PIX)</span>
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
              Preencha os dados abaixo para continuar com o checkout
            </p>
          </div>

          <div className="space-y-8">
            {/* Email (readonly se fornecido) */}
            {initialEmail && (
              <div>
                <label className="text-[10px] uppercase tracking-widest block mb-3 opacity-70 font-medium text-brand-softblack">
                  Email
                </label>
                <input
                  type="email"
                  value={initialEmail}
                  disabled
                  className="w-full bg-transparent border-b border-gray-300 py-3 text-brand-softblack/60 font-light cursor-not-allowed"
                />
              </div>
            )}

            {/* CPF */}
            <div>
              <label className="text-[10px] uppercase tracking-widest block mb-3 opacity-70 font-medium text-brand-softblack">
                CPF <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={cpf}
                onChange={(e) => handleCPFChange(e.target.value)}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, cpf: true }));
                  validateField("cpf", cpf);
                }}
                placeholder="000.000.000-00"
                maxLength={14}
                className={`w-full bg-transparent border-b py-3 focus:outline-none transition-colors duration-300 text-brand-softblack placeholder:text-gray-400 font-light ${
                  errors.cpf
                    ? "border-red-400 focus:border-red-500"
                    : "border-gray-300 focus:border-brand-green"
                }`}
              />
              {errors.cpf && (
                <p className="text-[10px] text-red-500 mt-2">{errors.cpf}</p>
              )}
            </div>

            {/* Telefone */}
            <div>
              <label className="text-[10px] uppercase tracking-widest block mb-3 opacity-70 font-medium text-brand-softblack">
                Telefone <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, phone: true }));
                  validateField("phone", phone);
                }}
                placeholder="(00) 00000-0000"
                maxLength={15}
                className={`w-full bg-transparent border-b py-3 focus:outline-none transition-colors duration-300 text-brand-softblack placeholder:text-gray-400 font-light ${
                  errors.phone
                    ? "border-red-400 focus:border-red-500"
                    : "border-gray-300 focus:border-brand-green"
                }`}
              />
              {errors.phone && (
                <p className="text-[10px] text-red-500 mt-2">{errors.phone}</p>
              )}
            </div>

            {/* CEP */}
            <div>
              <label className="text-[10px] uppercase tracking-widest block mb-3 opacity-70 font-medium text-brand-softblack">
                CEP <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={address.cep}
                  onChange={(e) => handleCEPChange(e.target.value)}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, cep: true }));
                    handleCEPBlur();
                    validateField("address", address);
                  }}
                  placeholder="00000-000"
                  maxLength={9}
                  className={`w-full bg-transparent border-b py-3 focus:outline-none transition-colors duration-300 text-brand-softblack placeholder:text-gray-400 font-light pr-12 ${
                    errors.cep
                      ? "border-red-400 focus:border-red-500"
                      : "border-gray-300 focus:border-brand-green"
                  }`}
                />
                {isLoadingCEP && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-green"></div>
                  </div>
                )}
              </div>
              {errors.cep && (
                <p className="text-[10px] text-red-500 mt-2">{errors.cep}</p>
              )}
            </div>

            {/* Rua */}
            <div>
              <label className="text-[10px] uppercase tracking-widest block mb-3 opacity-70 font-medium text-brand-softblack">
                Rua <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={address.street}
                onChange={(e) => {
                  setAddress((prev) => ({ ...prev, street: e.target.value }));
                  if (touched.street) {
                    validateField("address", {
                      ...address,
                      street: e.target.value,
                    });
                  }
                }}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, street: true }));
                  validateField("address", address);
                }}
                placeholder="Nome da rua"
                className={`w-full bg-transparent border-b py-3 focus:outline-none transition-colors duration-300 text-brand-softblack placeholder:text-gray-400 font-light ${
                  errors.street
                    ? "border-red-400 focus:border-red-500"
                    : "border-gray-300 focus:border-brand-green"
                }`}
              />
              {errors.street && (
                <p className="text-[10px] text-red-500 mt-2">{errors.street}</p>
              )}
            </div>

            {/* Número e Complemento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="text-[10px] uppercase tracking-widest block mb-3 opacity-70 font-medium text-brand-softblack">
                  Número <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={address.number}
                  onChange={(e) => {
                    setAddress((prev) => ({ ...prev, number: e.target.value }));
                    if (touched.number) {
                      validateField("address", {
                        ...address,
                        number: e.target.value,
                      });
                    }
                  }}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, number: true }));
                    validateField("address", address);
                  }}
                  placeholder="123"
                  className={`w-full bg-transparent border-b py-3 focus:outline-none transition-colors duration-300 text-brand-softblack placeholder:text-gray-400 font-light ${
                    errors.number
                      ? "border-red-400 focus:border-red-500"
                      : "border-gray-300 focus:border-brand-green"
                  }`}
                />
                {errors.number && (
                  <p className="text-[10px] text-red-500 mt-2">
                    {errors.number}
                  </p>
                )}
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest block mb-3 opacity-70 font-medium text-brand-softblack">
                  Complemento
                </label>
                <input
                  type="text"
                  value={address.complement}
                  onChange={(e) =>
                    setAddress((prev) => ({
                      ...prev,
                      complement: e.target.value,
                    }))
                  }
                  placeholder="Apto, Bloco, etc."
                  className="w-full bg-transparent border-b border-gray-300 py-3 focus:outline-none transition-colors duration-300 text-brand-softblack placeholder:text-gray-400 font-light focus:border-brand-green"
                />
              </div>
            </div>

            {/* Bairro */}
            <div>
              <label className="text-[10px] uppercase tracking-widest block mb-3 opacity-70 font-medium text-brand-softblack">
                Bairro <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={address.neighborhood}
                onChange={(e) => {
                  setAddress((prev) => ({
                    ...prev,
                    neighborhood: e.target.value,
                  }));
                  if (touched.neighborhood) {
                    validateField("address", {
                      ...address,
                      neighborhood: e.target.value,
                    });
                  }
                }}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, neighborhood: true }));
                  validateField("address", address);
                }}
                placeholder="Nome do bairro"
                className={`w-full bg-transparent border-b py-3 focus:outline-none transition-colors duration-300 text-brand-softblack placeholder:text-gray-400 font-light ${
                  errors.neighborhood
                    ? "border-red-400 focus:border-red-500"
                    : "border-gray-300 focus:border-brand-green"
                }`}
              />
              {errors.neighborhood && (
                <p className="text-[10px] text-red-500 mt-2">
                  {errors.neighborhood}
                </p>
              )}
            </div>

            {/* Cidade e Estado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="text-[10px] uppercase tracking-widest block mb-3 opacity-70 font-medium text-brand-softblack">
                  Cidade <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={address.city}
                  onChange={(e) => {
                    setAddress((prev) => ({ ...prev, city: e.target.value }));
                    if (touched.city) {
                      validateField("address", {
                        ...address,
                        city: e.target.value,
                      });
                    }
                  }}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, city: true }));
                    validateField("address", address);
                  }}
                  placeholder="Nome da cidade"
                  className={`w-full bg-transparent border-b py-3 focus:outline-none transition-colors duration-300 text-brand-softblack placeholder:text-gray-400 font-light ${
                    errors.city
                      ? "border-red-400 focus:border-red-500"
                      : "border-gray-300 focus:border-brand-green"
                  }`}
                />
                {errors.city && (
                  <p className="text-[10px] text-red-500 mt-2">{errors.city}</p>
                )}
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest block mb-3 opacity-70 font-medium text-brand-softblack">
                  Estado <span className="text-red-500">*</span>
                </label>
                <select
                  value={address.state}
                  onChange={(e) => {
                    setAddress((prev) => ({ ...prev, state: e.target.value }));
                    if (touched.state) {
                      validateField("address", {
                        ...address,
                        state: e.target.value,
                      });
                    }
                  }}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, state: true }));
                    validateField("address", address);
                  }}
                  className={`w-full bg-transparent border-b py-3 focus:outline-none transition-colors duration-300 text-brand-softblack font-light appearance-none cursor-pointer ${
                    errors.state
                      ? "border-red-400 focus:border-red-500"
                      : "border-gray-300 focus:border-brand-green"
                  }`}
                >
                  <option value="" className="text-gray-400">
                    Selecione
                  </option>
                  {estados.map((estado) => (
                    <option
                      key={estado}
                      value={estado}
                      className="text-brand-softblack"
                    >
                      {estado}
                    </option>
                  ))}
                </select>
                {errors.state && (
                  <p className="text-[10px] text-red-500 mt-2">
                    {errors.state}
                  </p>
                )}
              </div>
            </div>

            {/* Botões */}
            <div className="flex flex-col md:flex-row gap-4 pt-8 border-t border-gray-100">
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1 px-8 py-4 border border-gray-300 rounded-sm text-brand-softblack hover:border-brand-green/50 hover:text-brand-green transition-all duration-500 ease-out font-light uppercase tracking-wider text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-8 py-4 bg-brand-green text-brand-offwhite rounded-sm hover:bg-brand-green/90 transition-all duration-500 ease-out font-light uppercase tracking-wider text-xs disabled:opacity-50 disabled:cursor-not-allowed md:hover:-translate-y-0.5 md:hover:shadow-[0_10px_30px_rgba(10,51,35,0.25)]"
              >
                {isLoading ? "Processando..." : "Continuar"}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
