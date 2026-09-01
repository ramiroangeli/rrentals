import { NextRequest, NextResponse } from "next/server";
import { decrypt, COOKIE_NAME } from "@/lib/session";

// El login: no requiere sesión, y si ya estás logueado te saca de ahí.
const AUTH_PATH = "/login";

// /nuevo-alquiler y /firmar son públicas a propósito: las completa el
// inquilino, que nunca tiene sesión - pero a diferencia de /login, un usuario
// logueado (Ramiro) también puede entrar ahí sin que lo redirija (para
// probar el formulario o revisar un contrato antes de mandar el link).
// /privacidad también es pública: la pide Google como requisito para
// publicar la app de OAuth (ver /sop).
const OPEN_PATHS = ["/nuevo-alquiler", "/firmar", "/privacidad"];

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isAuthPath = path.startsWith(AUTH_PATH);
  const isOpenPath = OPEN_PATHS.some((p) => path.startsWith(p));

  if (isOpenPath) return NextResponse.next();

  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  const session = await decrypt(cookie);
  const isAuthenticated = !!session?.authenticated;

  if (!isAuthenticated && !isAuthPath) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isAuthenticated && isAuthPath) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icons/|manifest.webmanifest|sw.js|favicon.ico).*)"],
};
