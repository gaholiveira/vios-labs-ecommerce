"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { formatDatabaseError, logDatabaseError } from "@/utils/errorHandler";

interface FormErrors {
  full_name?: string;
  phone?: string;
  address_street?: string;
  address_district?: string;
  address_city?: string;
  address_postcode?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [profile, setProfile] = useState({
    full_name: "",
    phone: "",
    address_street: "",
    address_district: "",
    address_city: "",
    address_postcode: "",
  });

  // Máscara de telefone
  const formatPhone = (value: string | null | undefined) => {
    if (!value) return "";
    const numbers = value.toString().replace(/\D/g, "");
    if (numbers.length <= 10) {
      return numbers
        .replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3")
        .replace(/-$/, "");
    }
    return numbers
      .replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3")
      .replace(/-$/, "");
  };

  // Máscara de CEP
  const formatPostcode = (value: string | null | undefined) => {
    if (!value) return "";
    const numbers = value.toString().replace(/\D/g, "");
    return numbers.replace(/(\d{5})(\d{0,3})/, "$1-$2").replace(/-$/, "");
  };

  // Validação de campos
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!profile.full_name.trim()) {
      newErrors.full_name = "Nome completo é obrigatório";
    } else if (profile.full_name.trim().length < 3) {
      newErrors.full_name = "Nome deve ter pelo menos 3 caracteres";
    }

    if (profile.phone && profile.phone.replace(/\D/g, "").length < 10) {
      newErrors.phone = "Telefone inválido";
    }

    if (profile.address_street && profile.address_street.trim().length < 5) {
      newErrors.address_street = "Endereço muito curto";
    }

    if (profile.address_district && profile.address_district.trim().length < 2) {
      newErrors.address_district = "Bairro inválido";
    }

    if (profile.address_city && profile.address_city.trim().length < 2) {
      newErrors.address_city = "Cidade inválida";
    }

    if (profile.address_postcode) {
      const postcodeNumbers = profile.address_postcode.replace(/\D/g, "");
      if (postcodeNumbers.length !== 8) {
        newErrors.address_postcode = "CEP deve ter 8 dígitos";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        // Buscar perfil na tabela profiles
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        // Se não encontrar perfil, criar um com dados dos metadados do usuário
        if (profileError && profileError.code === "PGRST116") {
          // Perfil não existe, criar com dados dos metadados
          const userMetadata = user.user_metadata || {};
          const newProfile = {
            id: user.id,
            full_name: userMetadata.full_name || "",
            phone: userMetadata.phone || null,
            address_country: "Brasil",
            updated_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          };

          const { error: createError } = await supabase
            .from("profiles")
            .insert(newProfile);

          if (createError) {
            console.error("Erro ao criar perfil:", createError);
          }

          // Usar dados criados
          setProfile({
            full_name: newProfile.full_name || "",
            phone: newProfile.phone ? formatPhone(newProfile.phone) : "",
            address_street: "",
            address_district: "",
            address_city: "",
            address_postcode: "",
          });
        } else if (profileData) {
          // Perfil existe, formatar dados
          const formattedPhone = profileData.phone
            ? formatPhone(profileData.phone)
            : "";
          const formattedPostcode = profileData.address_postcode
            ? formatPostcode(profileData.address_postcode)
            : "";

          setProfile({
            full_name: profileData.full_name || "",
            phone: formattedPhone,
            address_street: profileData.address_street || "",
            address_district: profileData.address_district || "",
            address_city: profileData.address_city || "",
            address_postcode: formattedPostcode,
          });
        } else {
          // Fallback: usar dados dos metadados do usuário
          const userMetadata = user.user_metadata || {};
          setProfile({
            full_name: userMetadata.full_name || "",
            phone: userMetadata.phone ? formatPhone(userMetadata.phone) : "",
            address_street: "",
            address_district: "",
            address_city: "",
            address_postcode: "",
          });
        }
      } catch (err) {
        console.error("Erro ao carregar perfil:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    setUpdating(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Usuário não autenticado");
        setUpdating(false);
        return;
      }

      const { error: updateError } = await supabase.from("profiles").upsert({
        id: user.id,
        full_name: profile.full_name.trim(),
        phone: profile.phone.replace(/\D/g, ""),
        address_street: profile.address_street.trim(),
        address_district: profile.address_district.trim(),
        address_city: profile.address_city.trim(),
        address_postcode: profile.address_postcode.replace(/\D/g, ""),
        address_country: "Brasil",
        updated_at: new Date().toISOString(),
      });

      if (updateError) {
        logDatabaseError('Atualização de perfil', updateError);
        const errorMessage = formatDatabaseError(updateError);
        setError(errorMessage);
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 5000);
      }
    } catch (err) {
      logDatabaseError('Exceção ao atualizar perfil', err);
      const errorMessage = formatDatabaseError(err);
      setError(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setProfile({ ...profile, phone: formatted });
    if (errors.phone) {
      setErrors({ ...errors, phone: undefined });
    }
  };

  const handlePostcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPostcode(e.target.value);
    setProfile({ ...profile, address_postcode: formatted });
    if (errors.address_postcode) {
      setErrors({ ...errors, address_postcode: undefined });
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-brand-offwhite flex items-center justify-center">
        <span className="text-[10px] uppercase tracking-[0.4em] animate-pulse">
          A carregar perfil...
        </span>
      </div>
    );

  return (
    <div className="min-h-screen bg-brand-offwhite flex items-center justify-center px-6 pt-24 pb-12">
      <div className="max-w-xl w-full bg-white p-8 md:p-12 shadow-sm border border-gray-100">
        <h2 className="text-2xl font-light uppercase tracking-[0.3em] text-center mb-8 text-brand-softblack">
          O Meu Perfil
        </h2>

        {/* Mensagem de Sucesso */}
        {success && (
          <div className="mb-6 p-4 bg-brand-green/10 border border-brand-green/30 text-brand-green text-sm text-center rounded-sm">
            <div className="flex items-center justify-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Perfil atualizado com sucesso!</span>
            </div>
          </div>
        )}

        {/* Mensagem de Erro */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-600 text-sm text-center rounded-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-8">
          {/* Dados Pessoais */}
          <div>
            <h3 className="text-[11px] uppercase tracking-[0.2em] mb-6 font-medium border-l-2 border-brand-green pl-4 text-brand-softblack">
              Dados Pessoais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col md:col-span-2">
                <label
                  htmlFor="full_name"
                  className="text-[10px] uppercase tracking-widest block mb-3 opacity-70 font-medium"
                >
                  Nome Completo <span className="text-red-500">*</span>
                </label>
                <input
                  id="full_name"
                  type="text"
                  className={`w-full bg-transparent border-b py-2 focus:outline-none transition text-brand-softblack placeholder:text-gray-400 ${
                    errors.full_name
                      ? "border-red-400 focus:border-red-500"
                      : "border-gray-300 focus:border-brand-green"
                  }`}
                  value={profile.full_name}
                  onChange={(e) => {
                    setProfile({ ...profile, full_name: e.target.value });
                    if (errors.full_name) {
                      setErrors({ ...errors, full_name: undefined });
                    }
                  }}
                  placeholder="Seu nome completo"
                  required
                />
                {errors.full_name && (
                  <p className="text-[10px] text-red-500 mt-1">
                    {errors.full_name}
                  </p>
                )}
              </div>
              <div className="flex flex-col">
                <label
                  htmlFor="phone"
                  className="text-[10px] uppercase tracking-widest block mb-3 opacity-70 font-medium"
                >
                  Telefone
                </label>
                <input
                  id="phone"
                  type="tel"
                  className={`w-full bg-transparent border-b py-2 focus:outline-none transition text-brand-softblack placeholder:text-gray-400 ${
                    errors.phone
                      ? "border-red-400 focus:border-red-500"
                      : "border-gray-300 focus:border-brand-green"
                  }`}
                  value={profile.phone}
                  onChange={handlePhoneChange}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
                {errors.phone && (
                  <p className="text-[10px] text-red-500 mt-1">
                    {errors.phone}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="pt-4">
            <h3 className="text-[11px] uppercase tracking-[0.2em] mb-6 font-medium border-l-2 border-brand-green pl-4 text-brand-softblack">
              Endereço de Entrega
            </h3>

            <div className="space-y-6">
              <div className="flex flex-col">
                <label
                  htmlFor="address_street"
                  className="text-[10px] uppercase tracking-widest block mb-3 opacity-70 font-medium"
                >
                  Rua e Número
                </label>
                <input
                  id="address_street"
                  type="text"
                  className={`w-full bg-transparent border-b py-2 focus:outline-none transition text-brand-softblack placeholder:text-gray-400 ${
                    errors.address_street
                      ? "border-red-400 focus:border-red-500"
                      : "border-gray-300 focus:border-brand-green"
                  }`}
                  value={profile.address_street}
                  onChange={(e) => {
                    setProfile({ ...profile, address_street: e.target.value });
                    if (errors.address_street) {
                      setErrors({ ...errors, address_street: undefined });
                    }
                  }}
                  placeholder="Rua, número, complemento"
                />
                {errors.address_street && (
                  <p className="text-[10px] text-red-500 mt-1">
                    {errors.address_street}
                  </p>
                )}
              </div>

              <div className="flex flex-col">
                <label
                  htmlFor="address_district"
                  className="text-[10px] uppercase tracking-widest block mb-3 opacity-70 font-medium"
                >
                  Bairro
                </label>
                <input
                  id="address_district"
                  type="text"
                  className={`w-full bg-transparent border-b py-2 focus:outline-none transition text-brand-softblack placeholder:text-gray-400 ${
                    errors.address_district
                      ? "border-red-400 focus:border-red-500"
                      : "border-gray-300 focus:border-brand-green"
                  }`}
                  value={profile.address_district}
                  onChange={(e) => {
                    setProfile({ ...profile, address_district: e.target.value });
                    if (errors.address_district) {
                      setErrors({ ...errors, address_district: undefined });
                    }
                  }}
                  placeholder="Bairro"
                />
                {errors.address_district && (
                  <p className="text-[10px] text-red-500 mt-1">
                    {errors.address_district}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <label
                    htmlFor="address_city"
                    className="text-[10px] uppercase tracking-widest block mb-3 opacity-70 font-medium"
                  >
                    Cidade
                  </label>
                  <input
                    id="address_city"
                    type="text"
                    className={`w-full bg-transparent border-b py-2 focus:outline-none transition text-brand-softblack placeholder:text-gray-400 ${
                      errors.address_city
                        ? "border-red-400 focus:border-red-500"
                        : "border-gray-300 focus:border-brand-green"
                    }`}
                    value={profile.address_city}
                    onChange={(e) => {
                      setProfile({ ...profile, address_city: e.target.value });
                      if (errors.address_city) {
                        setErrors({ ...errors, address_city: undefined });
                      }
                    }}
                    placeholder="Cidade"
                  />
                  {errors.address_city && (
                    <p className="text-[10px] text-red-500 mt-1">
                      {errors.address_city}
                    </p>
                  )}
                </div>
                <div className="flex flex-col">
                  <label
                    htmlFor="address_postcode"
                    className="text-[10px] uppercase tracking-widest block mb-3 opacity-70 font-medium"
                  >
                    CEP
                  </label>
                  <input
                    id="address_postcode"
                    type="text"
                    className={`w-full bg-transparent border-b py-2 focus:outline-none transition text-brand-softblack placeholder:text-gray-400 ${
                      errors.address_postcode
                        ? "border-red-400 focus:border-red-500"
                        : "border-gray-300 focus:border-brand-green"
                    }`}
                    value={profile.address_postcode}
                    onChange={handlePostcodeChange}
                    placeholder="00000-000"
                    maxLength={9}
                  />
                  {errors.address_postcode && (
                    <p className="text-[10px] text-red-500 mt-1">
                      {errors.address_postcode}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={updating}
            className="w-full bg-brand-green text-brand-offwhite py-4 uppercase text-[10px] tracking-[0.2em] mt-8 hover:bg-brand-green/90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md font-medium"
          >
            {updating ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                A atualizar...
              </span>
            ) : (
              "Guardar Alterações"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
