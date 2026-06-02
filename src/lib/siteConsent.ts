/** Preferências de cookies / analytics — persistidas em localStorage (limpas ao apagar dados do site). */

export const SITE_CONSENT_STORAGE_KEY = "dr_site_consent";
export const SITE_CONSENT_VERSION = 1;
export const GTM_CONTAINER_ID = "GTM-5XMWJRLK";

export interface SiteConsentRecord {
  version: number;
  acceptedAt: string;
}

export function readSiteConsent(): SiteConsentRecord | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(SITE_CONSENT_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as SiteConsentRecord;
    if (parsed.version !== SITE_CONSENT_VERSION) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function hasAcceptedSiteCookies(): boolean {
  return readSiteConsent() !== null;
}

export function persistSiteConsent(): SiteConsentRecord {
  const record: SiteConsentRecord = {
    version: SITE_CONSENT_VERSION,
    acceptedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(SITE_CONSENT_STORAGE_KEY, JSON.stringify(record));
  return record;
}

export function loadGoogleTagManager(): void {
  if (typeof document === "undefined" || document.getElementById("gtm-script")) {
    return;
  }

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });

  const script = document.createElement("script");
  script.id = "gtm-script";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_CONTAINER_ID}`;
  document.head.appendChild(script);

  if (!document.getElementById("gtm-noscript")) {
    const noscript = document.createElement("noscript");
    noscript.id = "gtm-noscript";
    noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_CONTAINER_ID}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
    document.body.prepend(noscript);
  }
}

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}
