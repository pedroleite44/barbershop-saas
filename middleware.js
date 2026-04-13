import { NextResponse } from "next/server";

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth_token")?.value;

  // 1. Ignorar arquivos estáticos, imagens e APIs internas
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') || 
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Rotas Fixas (Não são barbearias)
  const fixedRoutes = ['/login', '/register', '/superadmin', '/dashboard'];
  if (fixedRoutes.some(route => pathname.startsWith(route))) {
    // Proteção básica de Dashboard
    if (pathname.startsWith('/dashboard') && !token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // 3. Roteamento Dinâmico por Slug (Opção A)
  // Exemplo: /barbearia-sanja -> vira parâmetro interno
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0) {
    const slug = segments[0];
    
    // Injetar o slug nos headers para as páginas lerem
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-tenant-slug', slug);

    // Se for a raiz da barbearia (/barbearia-sanja), 
    // podemos redirecionar internamente para a página de agendamento
    if (segments.length === 1) {
       // Opcional: Redirecionar para a landing page ou agenda daquela barbearia
       // url.pathname = `/agendamento/agendar`;
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};