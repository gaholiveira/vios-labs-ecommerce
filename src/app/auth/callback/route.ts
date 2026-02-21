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
  // Recovery tem prioridade — nunca redirecionar para home quando for reset de senha
  if (
    type === "recovery" ||
    next === "/update-password" ||
    next === "/reset-password"
  ) {
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

  // Signup ou fluxo sem type: instruir a fazer login (evita "sessão expirada" confuso)
  return NextResponse.redirect(
    `${origin}/login?email-confirmed=true&message=${encodeURIComponent("Link expirado ou já utilizado. Se você já confirmou, faça login com seu email e senha.")}`
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
      // Recovery: next=/update-password tem prioridade (Supabase pode enviar type=email para ambos os fluxos)
      const isRecovery =
        params.type === "recovery" ||
        params.next === "/update-password" ||
        params.next === "/reset-password";
      if (isRecovery) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        const { error: verifyError } = await supabase.auth.getSession();

        if (verifyError) {
          return NextResponse.redirect(
            `${origin}/forgot-password?error=${encodeURIComponent("Erro ao processar. Solicite novo link.")}`
          );
        }
      }

      // Signup/confirmação: apenas quando NÃO for recovery
      const isSignup =
        !isRecovery &&
        (params.type === "signup" || params.type === "email");
      if (isSignup) {
        return NextResponse.redirect(
          `${origin}/login?email-confirmed=true&message=${encodeURIComponent("Email confirmado! Faça login com o email e senha que você definiu no cadastro.")}`
        );
      }

      const redirectUrl = getRedirectUrl(params.type, params.next, origin);
      const redirectResponse = NextResponse.redirect(redirectUrl);

      // Aplicar cookies (OAuth, recovery)
      cookieStore.forEach(({ name, value, options }) => {
        redirectResponse.cookies.set(name, value, options);
      });

      return redirectResponse;
    }

    return await handlePKCEError(result.error, params.type, params.next, origin, supabase);
  }

  // CENÁRIO 3: Sem code na query — tokens podem estar no fragment (hash)
  // O servidor NUNCA recebe o fragment; apenas o cliente vê. Servimos HTML
  // que processa o hash no browser e redireciona para update-password ou login.
  return new NextResponse(getAuthCallbackFallbackHtml(origin), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function getAuthCallbackFallbackHtml(origin: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const base = origin.replace(/\/$/, "");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Processando…</title>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
</head>
<body>
  <p style="font-family:system-ui;text-align:center;padding:2rem;">Processando…</p>
  <script>
(function() {
  var hash = window.location.hash && window.location.hash.slice(1);
  if (!hash) {
    window.location.replace("${base}/login?error=no-code&message=" + encodeURIComponent("Link inválido. Verifique seu email."));
    return;
  }
  var params = new URLSearchParams(hash);
  var accessToken = params.get("access_token");
  var refreshToken = params.get("refresh_token");
  var type = params.get("type");
  var error = params.get("error");
  var errorDescription = params.get("error_description");
  var nextParam = new URLSearchParams(window.location.search).get("next");
  var isRecovery = type === "recovery" || nextParam === "/update-password" || nextParam === "/reset-password";
  if (error) {
    var msg = errorDescription ? decodeURIComponent(errorDescription.replace(/\\+/g, " ")) : "Erro ao processar o link.";
    var target = type === "recovery" ? "${base}/forgot-password?error=" : "${base}/login?error=auth-error&message=";
    window.location.replace(target + encodeURIComponent(msg));
    return;
  }
  if (!accessToken || !refreshToken) {
    window.location.replace("${base}/login?error=no-code&message=" + encodeURIComponent("Link inválido. Verifique seu email."));
    return;
  }
  var supabase = window.supabase.createClient("${supabaseUrl}", "${supabaseKey}");
  supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
    .then(function() {
      if (isRecovery) {
        window.location.replace("${base}/update-password");
      } else if (type === "signup" || type === "email") {
        window.location.replace("${base}/login?email-confirmed=true&message=" + encodeURIComponent("Email confirmado! Faça login com o email e senha que você definiu no cadastro."));
      } else {
        window.location.replace("${base}/");
      }
    })
    .catch(function(err) {
      console.error(err);
      window.location.replace("${base}/login?error=auth-error&message=" + encodeURIComponent("Erro ao processar. Tente novamente."));
    });
})();
  </script>
</body>
</html>`;
}
