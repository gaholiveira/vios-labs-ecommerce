/**
 * Rate limiter em memória com sliding window.
 *
 * NOTA: Em ambientes serverless (Vercel), cada instância tem memória isolada,
 * portanto este limiter é por instância. Para rate limiting global em produção
 * com alto tráfego, usar Redis (ex: Upstash). Para a escala atual do VIOS Labs
 * esta abordagem é suficiente.
 */

interface WindowEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, WindowEntry>();

/** Remove entradas expiradas periodicamente para evitar memory leak */
function cleanup() {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key);
  }
}

let cleanupScheduled = false;
function scheduleCleanup() {
  if (cleanupScheduled) return;
  cleanupScheduled = true;
  setTimeout(() => {
    cleanup();
    cleanupScheduled = false;
  }, 60_000);
}

export interface RateLimitOptions {
  /** Número máximo de requisições permitidas na janela */
  limit: number;
  /** Duração da janela em milissegundos */
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  /** Requisições restantes na janela atual */
  remaining: number;
  /** Timestamp Unix (ms) de quando a janela reinicia */
  resetAt: number;
}

/**
 * Verifica se o identificador (IP, userId etc.) excedeu o limite.
 *
 * @param identifier - String que identifica o cliente (IP, email, etc.)
 * @param options - Configuração de limite e janela
 */
export function rateLimit(
  identifier: string,
  options: RateLimitOptions,
): RateLimitResult {
  const now = Date.now();
  const key = `${identifier}:${options.windowMs}:${options.limit}`;
  scheduleCleanup();

  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + options.windowMs });
    return { success: true, remaining: options.limit - 1, resetAt: now + options.windowMs };
  }

  if (entry.count >= options.limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return {
    success: true,
    remaining: options.limit - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Extrai o IP do cliente a partir do NextRequest.
 * Respeita headers de proxy (Vercel, Cloudflare).
 */
export function getClientIp(req: { headers: { get: (key: string) => string | null } }): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
