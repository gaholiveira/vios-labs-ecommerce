"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import {
  validateCPF,
  formatCPF,
  validateCEP,
  formatCEP,
  validatePhone,
  formatPhone,
  validateEmail,
  validateAddress,
  type AddressData,
} from "@/utils/validation";
import { fetchAddressByCEP } from "@/utils/cep";

export interface CheckoutFormData {
  fullName: string;
  cpf: string;
  phone: string;
  address: AddressData;
  /** E-mail do cliente (obrigatório para guest, preenchido automaticamente quando logado) */
  email: string;
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
  /** Desconto em reais (ex.: 10% PIX) — quando presente, exibe linha no resumo */
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
  /** Se true, renderiza apenas o formulário (sem modal) para uso em página dedicada de checkout */
  embedded?: boolean;
  /** Rótulo do botão de submit quando embedded (ex.: "Finalizar compra") */
  submitLabel?: string;
  /** Conteúdo opcional entre Endereço e Ações (ex.: Frete + Seletor de pagamento) */
  children?: React.ReactNode;
  /** Chamado quando o CEP possui 8 dígitos (para cotação de frete) */
  onCEPChange?: (cep: string) => void;
}

/**
 * Componente de formulário para coletar dados de checkout
 * Design minimalista e elegante seguindo o padrão VIOS Labs
 */
function formatBRL(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

const CHECKOUT_ADDRESS_STORAGE_KEY = "vios_checkout_address";

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
}: CheckoutFormProps) {
  // Estados do formulário (email: inicial do usuário logado ou vazio para guest)
  const [email, setEmail] = useState(initialEmail ?? "");
  const [fullName, setFullName] = useState("");
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
  const lastCepLookupRef = useRef<string>("");
  const hasLoadedFromStorageRef = useRef(false);

  // Carregar último endereço salvo (localStorage) — apenas no mount
  useEffect(() => {
    if (typeof window === "undefined" || hasLoadedFromStorageRef.current) return;
    hasLoadedFromStorageRef.current = true;
    try {
      const cached = localStorage.getItem(CHECKOUT_ADDRESS_STORAGE_KEY);
      if (!cached) return;
      const parsed = JSON.parse(cached) as Partial<AddressData>;
      const cepDigits = (parsed.cep ?? "").replace(/\D/g, "");
      if (cepDigits.length !== 8) return;
      setAddress((prev) => ({
        ...prev,
        cep: formatCEP(cepDigits),
        street: parsed.street ?? "",
        number: parsed.number ?? "",
        complement: parsed.complement ?? "",
        neighborhood: parsed.neighborhood ?? "",
        city: parsed.city ?? "",
        state: parsed.state ?? "",
      }));
      onCEPChange?.(cepDigits);
    } catch {
      // Ignora parse errors
    }
  }, [onCEPChange]);

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
   * Busca endereço via CEP (usado no blur e também ao completar 8 dígitos)
   */
  const lookupCEP = useCallback(
    async (cepDigits: string) => {
      if (!validateCEP(cepDigits)) return;
      if (isLoadingCEP) return;
      if (lastCepLookupRef.current === cepDigits) return;
      lastCepLookupRef.current = cepDigits;

      setIsLoadingCEP(true);
      setErrors((prev) => ({ ...prev, cep: "" }));

      try {
        const cepData = await fetchAddressByCEP(cepDigits);

        if (cepData) {
          setAddress((prev) => ({
            ...prev,
            street: cepData.logradouro || "",
            neighborhood: cepData.bairro || "",
            city: cepData.localidade || "",
            state: cepData.uf || "",
            complement: cepData.complemento || prev.complement,
          }));
          // Limpar erros dos campos que foram preenchidos pelo ViaCEP
          // (evita exibir mensagens de requisito em campos já preenchidos)
          setErrors((prev) => {
            const next = { ...prev };
            delete next.cep;
            delete next.street;
            delete next.neighborhood;
            delete next.city;
            delete next.state;
            return next;
          });
        } else {
          setErrors((prev) => ({ ...prev, cep: "CEP não encontrado" }));
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
    },
    [isLoadingCEP],
  );

  const handleCEPBlur = useCallback(async () => {
    const cleanedCEP = address.cep.replace(/\D/g, "");
    if (cleanedCEP.length !== 8) return;
    await lookupCEP(cleanedCEP);
  }, [address.cep, lookupCEP]);

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

        case "fullName":
          if (!value || (value as string).trim().length === 0) {
            newErrors.fullName = "Nome completo é obrigatório";
          } else if ((value as string).trim().length < 3) {
            newErrors.fullName = "Nome completo deve ter pelo menos 3 caracteres";
          } else {
            delete newErrors.fullName;
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

        case "email":
          if (!value || (value as string).trim().length === 0) {
            newErrors.email = "E-mail é obrigatório";
          } else if (!validateEmail((value as string).trim())) {
            newErrors.email = "E-mail inválido";
          } else {
            delete newErrors.email;
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
    const cleaned = value.replace(/\D/g, "").slice(0, 8);
    const formatted = formatCEP(cleaned);
    setAddress((prev) => ({ ...prev, cep: formatted }));
    onCEPChange?.(cleaned);
    if (cleaned.length === 8) {
      setTouched((prev) => ({ ...prev, cep: true }));
      validateField("address", { ...address, cep: cleaned });
      void lookupCEP(cleaned);
    } else if (touched.cep) {
      validateField("address", { ...address, cep: cleaned });
    }
  };

  /**
   * Handler de submit do formulário
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Marcar todos os campos como tocados
    setTouched({
      fullName: true,
      email: true,
      cpf: true,
      phone: true,
      cep: true,
      street: true,
      number: true,
      neighborhood: true,
      city: true,
      state: true,
    });

    // E-mail final: do usuário logado (initialEmail) ou do campo (guest)
    const emailValue = (initialEmail ?? email).trim().toLowerCase();

    // Validar todos os campos
    validateField("fullName", fullName);
    validateField("email", emailValue || email);
    validateField("cpf", cpf);
    validateField("phone", phone);
    validateField("address", address);

    const fullNameValid = fullName.trim().length >= 3;
    const emailValid = validateEmail(emailValue);
    const cpfValid = validateCPF(cpf);
    const phoneValid = validatePhone(phone);
    const addressValid = validateAddress(address).valid;

    if (!fullNameValid || !emailValid || !cpfValid || !phoneValid || !addressValid) {
      return;
    }

    // Limpar CPF e telefone para formato numérico
    const cleanedCPF = cpf.replace(/\D/g, "");
    const cleanedPhone = phone.replace(/\D/g, "");
    const cleanedCEP = address.cep.replace(/\D/g, "");

    // Salvar endereço para pré-preenchimento na próxima compra
    try {
      localStorage.setItem(
        CHECKOUT_ADDRESS_STORAGE_KEY,
        JSON.stringify({
          cep: cleanedCEP,
          street: address.street.trim(),
          number: address.number.trim(),
          complement: address.complement?.trim() ?? "",
          neighborhood: address.neighborhood.trim(),
          city: address.city.trim(),
          state: address.state.trim(),
        })
      );
    } catch {
      // Ignora falhas de localStorage
    }

    onSubmit({
      fullName: fullName.trim(),
      cpf: cleanedCPF,
      phone: cleanedPhone,
      address: {
        ...address,
        cep: cleanedCEP,
      },
      email: emailValue,
    });
  };

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
                  <span>Desconto 10% (PIX)</span>
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

      {/*
            Tokens visuais (inputs): linhas limpas, borda fina, foco “clínico”
          */}
      {(() => {
        const base =
          "w-full bg-white/70 border rounded-sm px-3 py-3 text-brand-softblack placeholder:text-gray-400 font-light focus:outline-none transition-colors duration-200";
        const ok =
          "border-gray-200 focus:border-brand-green focus:ring-1 focus:ring-brand-green/20";
        const err =
          "border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-200/40";
        return (
          <div className="space-y-10">
            {/* Endereço (primeiro: CEP desbloqueia preenchimento automático) */}
            <div className="p-5 md:p-6 border border-gray-100 bg-white rounded-sm">
              <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-brand-softblack/70 mb-6">
                Endereço de entrega
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                      className={`${base} pr-12 ${errors.cep ? err : ok}`}
                    />
                    {isLoadingCEP && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-brand-green border-t-transparent" />
                      </div>
                    )}
                  </div>
                  {isLoadingCEP ? (
                    <p className="text-[10px] text-brand-softblack/70 mt-2">
                      Buscando endereço…
                    </p>
                  ) : null}
                  {errors.cep && (
                    <p className="text-[10px] text-red-500 mt-2">
                      {errors.cep}
                    </p>
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
                      setAddress((prev) => ({
                        ...prev,
                        street: e.target.value,
                      }));
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
                    className={`${base} ${errors.street ? err : ok}`}
                  />
                  {errors.street && (
                    <p className="text-[10px] text-red-500 mt-2">
                      {errors.street}
                    </p>
                  )}
                </div>

                {/* Número */}
                <div>
                  <label className="text-[10px] uppercase tracking-widest block mb-3 opacity-70 font-medium text-brand-softblack">
                    Número <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={address.number}
                    onChange={(e) => {
                      setAddress((prev) => ({
                        ...prev,
                        number: e.target.value,
                      }));
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
                    className={`${base} ${errors.number ? err : ok}`}
                  />
                  {errors.number && (
                    <p className="text-[10px] text-red-500 mt-2">
                      {errors.number}
                    </p>
                  )}
                </div>

                {/* Complemento */}
                <div>
                  <label className="text-[10px] uppercase tracking-widest block mb-3 opacity-70 font-medium text-brand-softblack">
                    Complemento{" "}
                    <span className="font-normal text-brand-softblack/50">(opcional)</span>
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
                    placeholder="Opcional — apto, bloco"
                    className={`${base} ${ok}`}
                  />
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
                      setTouched((prev) => ({
                        ...prev,
                        neighborhood: true,
                      }));
                      validateField("address", address);
                    }}
                    placeholder="Nome do bairro"
                    className={`${base} ${errors.neighborhood ? err : ok}`}
                  />
                  {errors.neighborhood && (
                    <p className="text-[10px] text-red-500 mt-2">
                      {errors.neighborhood}
                    </p>
                  )}
                </div>

                {/* Cidade */}
                <div>
                  <label className="text-[10px] uppercase tracking-widest block mb-3 opacity-70 font-medium text-brand-softblack">
                    Cidade <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={address.city}
                    onChange={(e) => {
                      setAddress((prev) => ({
                        ...prev,
                        city: e.target.value,
                      }));
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
                    placeholder="Sua cidade"
                    className={`${base} ${errors.city ? err : ok}`}
                  />
                  {errors.city && (
                    <p className="text-[10px] text-red-500 mt-2">
                      {errors.city}
                    </p>
                  )}
                </div>

                {/* Estado */}
                <div>
                  <label className="text-[10px] uppercase tracking-widest block mb-3 opacity-70 font-medium text-brand-softblack">
                    Estado <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={address.state}
                    onChange={(e) => {
                      setAddress((prev) => ({
                        ...prev,
                        state: e.target.value,
                      }));
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
                    className={`${base} ${errors.state ? err : ok}`}
                  >
                    <option value="">Selecione</option>
                    {estados.map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
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
            </div>

            {/* Contato & Fiscal */}
            <div className="p-5 md:p-6 border border-gray-100 bg-white rounded-sm">
              <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-brand-softblack/70 mb-6">
                Contato & Fiscal
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Nome completo */}
                <div>
                  <label className="text-[10px] uppercase tracking-widest block mb-3 opacity-70 font-medium text-brand-softblack">
                    Nome completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onBlur={() => {
                      setTouched((prev) => ({ ...prev, fullName: true }));
                      validateField("fullName", fullName);
                    }}
                    placeholder="Nome e sobrenome"
                    className={`${base} ${errors.fullName ? err : ok}`}
                  />
                  {errors.fullName && (
                    <p className="text-[10px] text-red-500 mt-2">
                      {errors.fullName}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="text-[10px] uppercase tracking-widest block mb-3 opacity-70 font-medium text-brand-softblack">
                    E-mail <span className="text-red-500">*</span>
                  </label>
                  {initialEmail ? (
                    <input
                      type="email"
                      value={initialEmail}
                      disabled
                      className={`${base} border-gray-200 text-brand-softblack/60 cursor-not-allowed`}
                    />
                  ) : (
                    <>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => {
                          setTouched((prev) => ({
                            ...prev,
                            email: true,
                          }));
                          validateField("email", email);
                        }}
                        placeholder="seu@email.com"
                        className={`${base} ${errors.email ? err : ok}`}
                      />
                      {errors.email && (
                        <p className="text-[10px] text-red-500 mt-2">
                          {errors.email}
                        </p>
                      )}
                    </>
                  )}
                </div>

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
                    className={`${base} ${errors.cpf ? err : ok}`}
                  />
                  {errors.cpf && (
                    <p className="text-[10px] text-red-500 mt-2">
                      {errors.cpf}
                    </p>
                  )}
                </div>

                {/* Telefone */}
                <div className="md:col-span-2">
                  <label className="text-[10px] uppercase tracking-widest block mb-3 opacity-70 font-medium text-brand-softblack">
                    Telefone (com DDD) <span className="text-red-500">*</span>
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
                    className={`${base} ${errors.phone ? err : ok}`}
                  />
                  {errors.phone && (
                    <p className="text-[10px] text-red-500 mt-2">
                      {errors.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {children}

            {/* Ações */}
            <div className="flex flex-col-reverse md:flex-row md:items-center gap-3 md:justify-between pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="w-full md:w-auto px-5 py-3 border border-gray-200 rounded-sm text-brand-softblack/80 text-[11px] uppercase tracking-widest hover:border-brand-green/40 hover:text-brand-softblack transition-colors"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full md:w-auto px-6 py-3 bg-brand-green text-white rounded-sm text-[11px] uppercase tracking-widest hover:bg-brand-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Processando…" : (submitLabel ?? "Continuar")}
              </button>
            </div>
          </div>
        );
      })()}
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
