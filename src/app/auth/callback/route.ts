import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Callback Route Handler para autenticação Supabase
 *
 * Processa:
 * - Confirmação de email (signup)
 * - Redefinição de senha (recovery)
 * - OAuth providers (Google, etc.)
 */

interface CallbackParams {
  code: string | null;
  type: string | null;
  next: string;
  error: string | null;
  errorCode: string | null;
  errorDescription: string | null;
}

interface CookieToSet {
  name: string;
  value: string;
  options?: {
    sameSite?: "lax" | "strict" | "none";
    path?: string;
    httpOnly?: boolean;
    secure?: boolean;
    maxAge?: number;
  };
}

const isDev = process.env.NODE_ENV === "development";

function createSupabaseClient(request: NextRequest, cookieStore: CookieToSet[]) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.push({
              name,
              value,
              options: {
                ...options,
                sameSite: (options?.sameSite as "lax" | "strict" | "none") || "lax",
                path: options?.path || "/",
                httpOnly: false,
                secure: process.env.NODE_ENV === "production",
                maxAge: options?.maxAge || 60 * 60 * 24 * 7,
              },
            });
          });
        },
      },
    }
  );
}

function processAuthError(
  error: string | null,
  errorCode: string | null,
  errorDescription: string | null,
  type: string | null
): { message: string; isEmailConfirmed: boolean; isRecovery: boolean } {
  const isRecovery = type === "recovery";
  let message = "Erro ao processar autenticação.";
  let isEmailConfirmed = false;

  if (errorCode === "otp_expired") {
    message = isRecovery
      ? "Link de redefinição expirado. Solicite um novo."
      : "Link de confirmação expirado. Se já confirmou, faça login.";
    isEmailConfirmed = !isRecovery;
    return { message, isEmailConfirmed, isRecovery };
  }

  if (error === "access_denied") {
    message = isRecovery
      ? "Link já utilizado. Solicite um novo."
      : "Link já utilizado. Seu email está confirmado! Faça login.";
    isEmailConfirmed = !isRecovery;
    return { message, isEmailConfirmed, isRecovery };
  }

  if (errorDescription) {
    message = decodeURIComponent(errorDescription).replace(/\+/g, " ");
    isEmailConfirmed = !isRecovery && (errorDescription.includes("already") || errorDescription.includes("used"));
    return { message, isEmailConfirmed, isRecovery };
  }

  if (error) {
    message = "Erro ao processar o link. Tente novamente.";
  }

  return { message, isEmailConfirmed, isRecovery };
}

async function exchangeCodeForSession(
  supabase: ReturnType<typeof createSupabaseClient>,
  code: string
): Promise<{ success: boolean; error?: any; user?: any; session?: any }> {
  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      if (isDev) console.error("❌ Erro exchangeCode:", error.message);
      return { success: false, error };
    }

    if (!data?.session) {
      if (isDev) console.error("❌ Sessão não criada");
      return { success: false, error: { message: "Sessão não criada" } };
    }

    return { success: true, user: data.user, session: data.session };
  } catch (err: any) {
    if (isDev) console.error("❌ Exceção exchangeCode:", err);
    return { success: false, error: err };
  }
}

function getRedirectUrl(type: string | null, next: string, origin: string): string {
  if (type === "recovery" || next === "/update-password" || next === "/reset-password") {
    return `${origin}/update-password`;
  }

  let decodedNext = next;
  try {
    decodedNext = decodeURIComponent(next);
  } catch {
    // Usar valor original
  }

  const isValid =
    decodedNext &&
    decodedNext.startsWith("/") &&
    !decodedNext.includes("//") &&
    !decodedNext.includes("..") &&
    !decodedNext.startsWith("/auth/callback");

  return `${origin}${isValid ? decodedNext : "/"}`;
}

async function handlePKCEError(
  error: any,
  type: string | null,
  next: string,
  origin: string,
  supabase: ReturnType<typeof createSupabaseClient>
): Promise<NextResponse> {
  const isLinkUsedOrExpired =
    error?.message?.includes("PKCE") ||
    error?.message?.includes("code verifier") ||
    error?.message?.includes("already been used") ||
    error?.message?.includes("expired") ||
    error?.message?.includes("invalid");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const validNext = next?.startsWith("/") ? next : "/";
    return NextResponse.redirect(`${origin}${validNext}`);
  }

  if (!isLinkUsedOrExpired) {
    return NextResponse.redirect(
      `${origin}/login?error=auth-error&message=${encodeURIComponent(error?.message || "Erro ao autenticar.")}`
    );
  }

  if (type === "recovery" || next === "/update-password") {
    return NextResponse.redirect(
      `${origin}/forgot-password?error=${encodeURIComponent("Link expirado. Solicite um novo.")}`
    );
  }

  if (type === "signup") {
    return NextResponse.redirect(
      `${origin}/login?email-confirmed=true&message=${encodeURIComponent("Email já confirmado! Faça login.")}`
    );
  }

  return NextResponse.redirect(
    `${origin}/login?error=session-expired&message=${encodeURIComponent("Sessão expirada. Faça login novamente.")}`
  );
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const searchParams = requestUrl.searchParams;

  // Normalizar origin
  let origin = requestUrl.origin;
  if (origin.includes("www.")) {
    origin = origin.replace("www.", "");
  }
  if (process.env.NODE_ENV === "production" && origin.startsWith("http://")) {
    origin = origin.replace("http://", "https://");
  }

  const params: CallbackParams = {
    code: searchParams.get("code"),
    type: searchParams.get("type"),
    next: searchParams.get("next") ?? "/",
    error: searchParams.get("error"),
    errorCode: searchParams.get("error_code"),
    errorDescription: searchParams.get("error_description"),
  };

  const cookieStore: CookieToSet[] = [];
  const supabase = createSupabaseClient(request, cookieStore);

  // CENÁRIO 1: Erros explícitos
  if (params.error || params.errorCode) {
    const { message, isEmailConfirmed, isRecovery } = processAuthError(
      params.error,
      params.errorCode,
      params.errorDescription,
      params.type
    );

    if (isRecovery) {
      return NextResponse.redirect(`${origin}/forgot-password?error=${encodeURIComponent(message)}`);
    }

    if (isEmailConfirmed) {
      return NextResponse.redirect(`${origin}/login?email-confirmed=true&message=${encodeURIComponent(message)}`);
    }

    return NextResponse.redirect(`${origin}/login?error=auth-error&message=${encodeURIComponent(message)}`);
  }

  // CENÁRIO 2: Código presente
  if (params.code) {
    const result = await exchangeCodeForSession(supabase, params.code);

    if (result.success && result.session) {
      // Recovery: verificar sessão
      if (params.type === "recovery") {
        await new Promise((resolve) => setTimeout(resolve, 100));
        const { error: verifyError } = await supabase.auth.getSession();

        if (verifyError) {
          return NextResponse.redirect(
            `${origin}/forgot-password?error=${encodeURIComponent("Erro ao processar. Solicite novo link.")}`
          );
        }
      }

      const redirectUrl = getRedirectUrl(params.type, params.next, origin);
      const redirectResponse = NextResponse.redirect(redirectUrl);

      // Aplicar cookies
      cookieStore.forEach(({ name, value, options }) => {
        redirectResponse.cookies.set(name, value, options);
      });

      return redirectResponse;
    }

    return await handlePKCEError(result.error, params.type, params.next, origin, supabase);
  }

  // CENÁRIO 3: URL inválida
  if (params.type === "recovery") {
    return NextResponse.redirect(
      `${origin}/forgot-password?error=${encodeURIComponent("Link inválido. Solicite um novo.")}`
    );
  }

  return NextResponse.redirect(
    `${origin}/login?error=no-code&message=${encodeURIComponent("Link inválido. Verifique seu email.")}`
  );
}
