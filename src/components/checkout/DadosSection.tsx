"use client";

import type { AddressData } from "@/utils/validation";

const ESTADOS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
  "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
  "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

interface DadosSectionProps {
  // Valores
  email: string;
  fullName: string;
  phone: string;
  address: AddressData;
  initialEmail?: string;
  isLoadingCEP: boolean;
  errors: Record<string, string>;
  // Handlers genéricos
  setEmail: (v: string) => void;
  setFullName: (v: string) => void;
  handlePhoneChange: (v: string) => void;
  handleCEPChange: (v: string) => void;
  handleCEPBlur: () => void;
  validateField: (field: string, value: string | AddressData) => void;
  touchField: (field: string) => void;
  updateAddressField: (field: keyof AddressData, value: string, currentAddress: AddressData) => void;
  setAddress: React.Dispatch<React.SetStateAction<AddressData>>;
  touched: Record<string, boolean>;
  // Classes base de input (para manter o estilo do pai)
  inputBase: string;
  inputOk: string;
  inputErr: string;
  // Callbacks de captura de abandono (opcionais)
  onEmailBlur?: (email: string) => void;
  onPhoneBlur?: (phone: string) => void;
}

export default function DadosSection({
  email,
  fullName,
  phone,
  address,
  initialEmail,
  isLoadingCEP,
  errors,
  setEmail,
  setFullName,
  handlePhoneChange,
  handleCEPChange,
  handleCEPBlur,
  validateField,
  touchField,
  updateAddressField,
  setAddress,
  touched,
  inputBase: base,
  inputOk: ok,
  inputErr: err,
  onEmailBlur,
  onPhoneBlur,
}: DadosSectionProps) {
  return (
    <>
      {/* Contato & Fiscal */}
      <div className="p-5 md:p-6 border border-gray-100 bg-white rounded-sm">
        <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-brand-softblack/70 mb-6">
          Contato
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* E-mail */}
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
                    touchField("email");
                    validateField("email", email);
                    onEmailBlur?.(email);
                  }}
                  placeholder="seu@email.com"
                  className={`${base} ${errors.email ? err : ok}`}
                />
                {errors.email && (
                  <p className="text-[10px] text-red-500 mt-2">{errors.email}</p>
                )}
              </>
            )}
          </div>

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
                touchField("fullName");
                validateField("fullName", fullName);
              }}
              placeholder="Nome e sobrenome"
              className={`${base} ${errors.fullName ? err : ok}`}
            />
            {errors.fullName && (
              <p className="text-[10px] text-red-500 mt-2">{errors.fullName}</p>
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
                touchField("phone");
                validateField("phone", phone);
                onPhoneBlur?.(phone);
              }}
              placeholder="(00) 00000-0000"
              maxLength={15}
              className={`${base} ${errors.phone ? err : ok}`}
            />
            {errors.phone && (
              <p className="text-[10px] text-red-500 mt-2">{errors.phone}</p>
            )}
          </div>
        </div>
      </div>

      {/* Endereço de entrega */}
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
                  touchField("cep");
                  void handleCEPBlur();
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
            {isLoadingCEP && (
              <p className="text-[10px] text-brand-softblack/70 mt-2">
                Buscando endereço…
              </p>
            )}
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
              onChange={(e) => updateAddressField("street", e.target.value, address)}
              onBlur={() => {
                touchField("street");
                validateField("address", address);
              }}
              placeholder="Nome da rua"
              className={`${base} ${errors.street ? err : ok}`}
            />
            {errors.street && (
              <p className="text-[10px] text-red-500 mt-2">{errors.street}</p>
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
              onChange={(e) => updateAddressField("number", e.target.value, address)}
              onBlur={() => {
                touchField("number");
                validateField("address", address);
              }}
              placeholder="123"
              className={`${base} ${errors.number ? err : ok}`}
            />
            {errors.number && (
              <p className="text-[10px] text-red-500 mt-2">{errors.number}</p>
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
                setAddress((prev) => ({ ...prev, complement: e.target.value }))
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
              onChange={(e) =>
                updateAddressField("neighborhood", e.target.value, address)
              }
              onBlur={() => {
                touchField("neighborhood");
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
              onChange={(e) => updateAddressField("city", e.target.value, address)}
              onBlur={() => {
                touchField("city");
                validateField("address", address);
              }}
              placeholder="Sua cidade"
              className={`${base} ${errors.city ? err : ok}`}
            />
            {errors.city && (
              <p className="text-[10px] text-red-500 mt-2">{errors.city}</p>
            )}
          </div>

          {/* Estado */}
          <div>
            <label className="text-[10px] uppercase tracking-widest block mb-3 opacity-70 font-medium text-brand-softblack">
              Estado <span className="text-red-500">*</span>
            </label>
            <select
              value={address.state}
              onChange={(e) => updateAddressField("state", e.target.value, address)}
              onBlur={() => {
                touchField("state");
                validateField("address", address);
              }}
              className={`${base} ${errors.state ? err : ok}`}
            >
              <option value="">Selecione</option>
              {ESTADOS.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
            {errors.state && (
              <p className="text-[10px] text-red-500 mt-2">{errors.state}</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
