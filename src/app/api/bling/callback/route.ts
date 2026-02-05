import { NextRequest, NextResponse } from "next/server";
import { saveBlingTokens } from "@/lib/bling";

const BLING_TOKEN_URL = "https://www.bling.com.br/Api/v3/oauth/token";

/**
 * Callback OAuth Bling: troca o `code` por access_token e refresh_token.
 * Requer BLING_CLIENT_ID e BLING_CLIENT_SECRET no .env
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");

  if (errorParam) {
    return htmlResponse(
      400,
      `Erro na autorização Bling: ${errorParam}`,
      searchParams.get("error_description") ?? undefined,
    );
  }

  if (!code) {
    return htmlResponse(
      400,
      "Parâmetro 'code' ausente na URL. Repita o fluxo de autorização.",
    );
  }

  const clientId = process.env.BLING_CLIENT_ID;
  const clientSecret = process.env.BLING_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return htmlResponse(
      500,
      "Configuração faltando: adicione BLING_CLIENT_ID e BLING_CLIENT_SECRET no .env",
    );
  }

  try {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
    }).toString();

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
      "base64",
    );

    const res = await fetch(BLING_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body,
    });

    const rawText = await res.text();
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(rawText) as typeof data;
    } catch {
      return htmlResponse(500, "Resposta inválida do Bling", rawText.slice(0, 500));
    }

    if (!res.ok) {
      let errMsg = "Erro ao trocar code por tokens";
      if (typeof data.error === "string") {
        errMsg = data.error;
      } else if (data.error != null) {
        errMsg = JSON.stringify(data.error);
      }
      const errDetail =
        typeof data.error_description === "string"
          ? data.error_description
          : rawText;
      return htmlResponse(res.status, errMsg, errDetail);
    }

    const accessToken =
      data.access_token != null ? String(data.access_token) : "";
    const refreshToken =
      data.refresh_token != null ? String(data.refresh_token) : "";
    const expiresIn =
      typeof data.expires_in === "number" ? data.expires_in : undefined;

    if (!accessToken) {
      return htmlResponse(500, "Resposta do Bling sem access_token");
    }

    const saved = await saveBlingTokens(
      accessToken,
      refreshToken || accessToken,
      expiresIn,
    );
    if (saved) {
      console.log("[BLING CALLBACK] Tokens salvos no DB para refresh automático");
    }

    return new NextResponse(
      buildSuccessHtml(accessToken, refreshToken, expiresIn),
      {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    return htmlResponse(500, `Exceção: ${msg}`);
  }
}

function htmlResponse(
  status: number,
  title: string,
  detail?: string,
): NextResponse {
  return new NextResponse(buildErrorHtml(title, detail), {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function buildErrorHtml(title: string, detail?: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Bling OAuth - Erro</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 600px; margin: 2rem auto; padding: 0 1rem; }
    h1 { color: #c00; }
    pre { background: #f5f5f5; padding: 1rem; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>Erro</h1>
  <p>${escapeHtml(title)}</p>
  ${detail ? `<pre>${escapeHtml(detail)}</pre>` : ""}
</body>
</html>`;
}

function buildSuccessHtml(
  accessToken: string,
  refreshToken: string,
  expiresIn?: number,
): string {
  const expires = expiresIn ? ` (expira em ${expiresIn}s)` : "";
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Bling OAuth - Tokens</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 640px; margin: 2rem auto; padding: 0 1rem; }
    h1 { color: #0a0; }
    .block { margin: 1.5rem 0; }
    label { display: block; font-weight: 600; margin-bottom: 0.25rem; }
    pre, code { background: #f5f5f5; padding: 0.5rem 0.75rem; font-size: 0.9rem; overflow-x: auto; }
    pre { white-space: pre-wrap; word-break: break-all; }
    .copy { cursor: pointer; color: #06c; text-decoration: underline; font-size: 0.85rem; margin-top: 0.25rem; }
    .warn { background: #fff3cd; padding: 1rem; border-radius: 4px; margin-top: 1rem; }
  </style>
</head>
<body>
  <h1>✓ Tokens Bling obtidos</h1>
  <p>Adicione ao seu <code>.env</code>:</p>

  <div class="block">
    <label>BLING_ACCESS_TOKEN ${expires}</label>
    <pre id="access">${escapeHtml(accessToken)}</pre>
    <span class="copy" onclick="copy('access')">Copiar</span>
  </div>

  ${
    refreshToken
      ? `
  <div class="block">
    <label>BLING_REFRESH_TOKEN</label>
    <pre id="refresh">${escapeHtml(refreshToken)}</pre>
    <span class="copy" onclick="copy('refresh')">Copiar</span>
  </div>
  `
      : ""
  }

  <div class="warn">
    <strong>Atenção:</strong> O access token expira. Use o refresh token para renovar.
  </div>

  <script>
    function copy(id) {
      const el = document.getElementById(id);
      navigator.clipboard.writeText(el.textContent).then(() => alert('Copiado!'));
    }
  </script>
</body>
</html>`;
}

function escapeHtml(s: string | number | undefined | null): string {
  if (s == null) return "";
  const str = String(s);
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
