import { useLocation } from "react-router-dom";
import CookieConsentBanner from "@/components/CookieConsentBanner";

const AUTH_PATHS = new Set(["/login", "/recuperar-senha", "/redefinir-senha"]);

function isPublicMarketingRoute(pathname: string): boolean {
  return !pathname.startsWith("/admin") && !AUTH_PATHS.has(pathname);
}

/** Banner de cookies e outros elementos globais do site público (fora do /admin). */
export function PublicSiteChromeExtras() {
  const { pathname } = useLocation();

  if (!isPublicMarketingRoute(pathname)) {
    return null;
  }

  return <CookieConsentBanner />;
}
