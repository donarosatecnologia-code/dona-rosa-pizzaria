import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  hasAcceptedSiteCookies,
  loadGoogleTagManager,
  persistSiteConsent,
} from "@/lib/siteConsent";

function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (hasAcceptedSiteCookies()) {
      loadGoogleTagManager();
      setVisible(false);
      return;
    }

    setVisible(true);
  }, []);

  function handleAccept() {
    persistSiteConsent();
    loadGoogleTagManager();
    setVisible(false);
  }

  if (!visible) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-border bg-background/95 p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] backdrop-blur-sm sm:p-5"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3 sm:items-start">
          <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <div className="space-y-1">
            <p id="cookie-consent-title" className="text-sm font-semibold text-foreground">
              Usamos cookies para melhorar sua experiência
            </p>
            <p id="cookie-consent-desc" className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
              Guardamos preferências no seu navegador e usamos cookies de medição (Google Tag Manager) para entender
              como o site é usado. Ao continuar, você concorda com nossa{" "}
              <Link to="/politica-de-privacidade" className="font-medium text-primary underline-offset-2 hover:underline">
                Política de Privacidade
              </Link>
              . Você pode retirar o consentimento limpando os dados do site nas configurações do navegador.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          <Button type="button" size="sm" className="min-h-11 px-6" onClick={handleAccept}>
            Aceitar cookies
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CookieConsentBanner;
