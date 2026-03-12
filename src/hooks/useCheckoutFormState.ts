import { useRef, useState, useCallback, useEffect } from "react";
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

const CHECKOUT_ADDRESS_STORAGE_KEY = "vios_checkout_address";

export interface CheckoutFormFields {
  email: string;
  fullName: string;
  cpf: string;
  phone: string;
  address: AddressData;
}

export interface UseCheckoutFormStateOptions {
  initialEmail?: string;
  onCEPChange?: (cep: string) => void;
}

export function useCheckoutFormState({
  initialEmail,
  onCEPChange,
}: UseCheckoutFormStateOptions) {
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoadingCEP, setIsLoadingCEP] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const lastCepLookupRef = useRef<string>("");
  const hasLoadedFromStorageRef = useRef(false);

  // Carregar último endereço salvo no mount
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
        case "address": {
          const addrValidation = validateAddress(value as AddressData);
          if (!addrValidation.valid) {
            addrValidation.errors.forEach((error) => {
              if (error.includes("CEP")) newErrors.cep = error;
              else if (error.includes("Rua")) newErrors.street = error;
              else if (error.includes("Número")) newErrors.number = error;
              else if (error.includes("Bairro")) newErrors.neighborhood = error;
              else if (error.includes("Cidade")) newErrors.city = error;
              else if (error.includes("Estado")) newErrors.state = error;
            });
          } else {
            ["cep", "street", "number", "neighborhood", "city", "state"].forEach(
              (k) => delete newErrors[k],
            );
          }
          break;
        }
      }

      setErrors(newErrors);
    },
    [errors],
  );

  const handleCPFChange = useCallback(
    (value: string) => {
      const cleaned = value.replace(/\D/g, "");
      if (cleaned.length <= 11) {
        setCpf(formatCPF(cleaned));
        if (touched.cpf) validateField("cpf", cleaned);
      }
    },
    [touched.cpf, validateField],
  );

  const handlePhoneChange = useCallback(
    (value: string) => {
      const cleaned = value.replace(/\D/g, "");
      if (cleaned.length <= 11) {
        setPhone(formatPhone(cleaned));
        if (touched.phone) validateField("phone", cleaned);
      }
    },
    [touched.phone, validateField],
  );

  const handleCEPChange = useCallback(
    (value: string) => {
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
    },
    [address, onCEPChange, touched.cep, validateField, lookupCEP],
  );

  const validateStepDados = useCallback(() => {
    const allTouched: Record<string, boolean> = {
      fullName: true,
      email: true,
      phone: true,
      cep: true,
      street: true,
      number: true,
      neighborhood: true,
      city: true,
      state: true,
    };
    setTouched(allTouched);

    const emailValue = (initialEmail ?? email).trim().toLowerCase();
    const fullNameValid = fullName.trim().length >= 3;
    const emailValid = validateEmail(emailValue);
    const phoneValid = validatePhone(phone);
    const addressValidation = validateAddress(address);

    const newErrors: Record<string, string> = {};
    if (!fullNameValid) {
      newErrors.fullName =
        fullName.trim().length === 0
          ? "Nome completo é obrigatório"
          : "Nome completo deve ter pelo menos 3 caracteres";
    }
    if (!emailValid) {
      newErrors.email =
        !emailValue ? "E-mail é obrigatório" : "E-mail inválido";
    }
    if (!phoneValid) {
      newErrors.phone =
        !phone.trim() ? "Telefone é obrigatório" : "Telefone inválido (use DDD + número)";
    }
    if (!addressValidation.valid) {
      addressValidation.errors.forEach((error) => {
        if (error.includes("CEP")) newErrors.cep = error;
        else if (error.includes("Rua")) newErrors.street = error;
        else if (error.includes("Número")) newErrors.number = error;
        else if (error.includes("Bairro")) newErrors.neighborhood = error;
        else if (error.includes("Cidade")) newErrors.city = error;
        else if (error.includes("Estado")) newErrors.state = error;
      });
    }

    setErrors((prev) => {
      const next = { ...prev };
      const keysToReset = [
        "fullName", "email", "phone",
        "cep", "street", "number", "neighborhood", "city", "state",
      ] as const;
      keysToReset.forEach((k) => delete next[k]);
      return { ...next, ...newErrors };
    });

    return fullNameValid && emailValid && phoneValid && addressValidation.valid;
  }, [fullName, email, phone, address, initialEmail]);

  const touchField = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const updateAddressField = useCallback(
    (field: keyof AddressData, value: string, currentAddress: AddressData) => {
      setAddress((prev) => ({ ...prev, [field]: value }));
      if (touched[field]) {
        validateField("address", { ...currentAddress, [field]: value });
      }
    },
    [touched, validateField],
  );

  return {
    // State
    email,
    setEmail,
    fullName,
    setFullName,
    cpf,
    phone,
    address,
    setAddress,
    errors,
    isLoadingCEP,
    touched,
    // Handlers
    handleCPFChange,
    handlePhoneChange,
    handleCEPChange,
    handleCEPBlur,
    validateField,
    validateStepDados,
    touchField,
    updateAddressField,
  };
}
