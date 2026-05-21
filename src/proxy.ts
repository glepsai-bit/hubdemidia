// Proxy (antigo "middleware" no Next < 16). Faz duas coisas:
//  1) Protege /dashboard (exige sessão).
//  2) Multi-tenant: requisições em domínios/subdomínios de sites são reescritas para /tenants/<host>.
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const ROOT_DOMAIN = (process.env.ROOT_DOMAIN ?? "localhost:3000").split(":")[0];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const hostname = (req.headers.get("host") ?? "").split(":")[0];

  // 1) Guard do painel
  if (pathname.startsWith("/dashboard") && !req.auth) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // Rotas internas do painel/app não sofrem rewrite de tenant.
  const isAppRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/tenants");

  // 2) Host de tenant (não é o domínio raiz nem localhost) → renderiza o site público.
  const isRootHost =
    hostname === ROOT_DOMAIN || hostname === `www.${ROOT_DOMAIN}` || hostname === "localhost";

  if (!isRootHost && !isAppRoute) {
    const url = req.nextUrl.clone();
    url.pathname = `/tenants/${hostname}${pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
});

export const config = {
  // Roda em tudo, menos assets estáticos e arquivos com extensão.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
