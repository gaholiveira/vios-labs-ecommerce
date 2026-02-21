import { NextResponse, type NextRequest } from "next/server";

/**
 * Callback Route Handler para autenticação Supabase
 *
 * Processa:
 * - Confirmação de email (signup)
 * - Redefinição de senha (recovery)
 * - OAuth providers (Google, etc.)
 *
 * Redireciona para /auth/confirm com botão obrigatório (recomendação Supabase)
 * para evitar que scanners de email consumam o token.
 */

interface CallbackParams {
  code: string | null;
  type: string | null;
  next: string;
  error: string | null;
  errorCode: string | null;
  errorDescription: string | null;
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

  // CENÁRIO 2: Código presente — redirecionar para página com botão obrigatório
  // (recomendação Supabase: evita scanners de email consumirem o token)
  if (params.code) {
    const confirmUrl = new URL(`${origin}/auth/confirm`);
    confirmUrl.searchParams.set("code", params.code);
    if (params.type) confirmUrl.searchParams.set("type", params.type);
    if (params.next) confirmUrl.searchParams.set("next", params.next);
    return NextResponse.redirect(confirmUrl.toString());
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
