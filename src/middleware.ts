import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // IMPORTANTE: Pular middleware para webhooks (Pagar.me)
  // Webhooks precisam processar requisições raw sem interferência
  if (request.nextUrl.pathname.startsWith("/api/webhooks/pagarme")) {
    return NextResponse.next();
  }

  // IMPORTANTE: Pular middleware para auth callback
  // O callback precisa processar o código OAuth/PKCE antes de qualquer refresh de sessão
  if (request.nextUrl.pathname.startsWith("/auth/callback")) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANTE: Refrescar a sessão antes de continuar
  // Isso garante que o token não expire durante a navegação
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Proteger rotas que requerem autenticação
  if (!user && request.nextUrl.pathname.startsWith("/profile")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Se o usuário está logado e tenta acessar login/register/forgot-password, redirecionar para home
  // EXCETO /update-password e /reset-password que podem ser acessados durante o fluxo de redefinição
  if (
    user &&
    (request.nextUrl.pathname === "/login" ||
      request.nextUrl.pathname === "/register" ||
      request.nextUrl.pathname === "/forgot-password")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Permitir acesso a /update-password e /reset-password mesmo com sessão ativa (necessário para fluxo de redefinição)
  // O próprio componente update-password vai validar se a sessão é válida para reset

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/webhooks/pagarme (webhooks do Pagar.me - processados diretamente)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|api/webhooks/pagarme|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
