import { useCallback, useEffect, useRef, useState } from "react";
import {
  META_APP_ID,
  META_EMBEDDED_SIGNUP_CONFIG_ID,
  META_GRAPH_API_VERSION,
  META_SDK_URL,
  type EmbeddedSignupCompletePayload,
  type EmbeddedSignupMessage,
} from "@/lib/meta-embedded-signup";

type SignupPhase = "idle" | "loading_sdk" | "ready" | "popup_open" | "completing" | "success" | "error";

interface UseMetaEmbeddedSignupOptions {
  onComplete: (payload: EmbeddedSignupCompletePayload) => Promise<void>;
}

function loadFacebookSdk(): Promise<void> {
  if (window.FB) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${META_SDK_URL}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("sdk_load_failed")), {
        once: true,
      });
      return;
    }

    window.fbAsyncInit = () => {
      window.FB?.init({
        appId: META_APP_ID,
        autoLogAppEvents: true,
        xfbml: true,
        version: META_GRAPH_API_VERSION,
      });
      resolve();
    };

    const script = document.createElement("script");
    script.src = META_SDK_URL;
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    script.onerror = () => reject(new Error("sdk_load_failed"));
    document.body.appendChild(script);
  });
}

export function useMetaEmbeddedSignup({ onComplete }: UseMetaEmbeddedSignupOptions) {
  const [phase, setPhase] = useState<SignupPhase>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pendingCodeRef = useRef<string | null>(null);
  const pendingSessionRef = useRef<EmbeddedSignupCompletePayload | null>(null);

  const flushCompletion = useCallback(async () => {
    const code = pendingCodeRef.current;
    const session = pendingSessionRef.current;
    if (!code || !session) {
      return;
    }

    pendingCodeRef.current = null;
    pendingSessionRef.current = null;

    setPhase("completing");
    try {
      await onComplete({ ...session, code });
      setPhase("success");
      setErrorMessage(null);
    } catch (error) {
      setPhase("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Não foi possível concluir a conexão.",
      );
    }
  }, [onComplete]);

  useEffect(() => {
    let cancelled = false;

    async function initSdk() {
      setPhase("loading_sdk");
      try {
        await loadFacebookSdk();
        if (!cancelled) {
          setPhase("ready");
        }
      } catch {
        if (!cancelled) {
          setPhase("error");
          setErrorMessage("Não foi possível carregar o login da Meta. Tente recarregar a página.");
        }
      }
    }

    void initSdk();

    function handleMessage(event: MessageEvent) {
      if (!event.origin.endsWith("facebook.com")) {
        return;
      }

      let payload: EmbeddedSignupMessage | null = null;
      try {
        payload = JSON.parse(String(event.data)) as EmbeddedSignupMessage;
      } catch {
        return;
      }

      if (payload.type !== "WA_EMBEDDED_SIGNUP") {
        return;
      }

      if (payload.event === "CANCEL" || payload.event === "ERROR") {
        setPhase("error");
        setErrorMessage(
          payload.data.error_message ||
            "Conexão cancelada. Tente de novo quando estiver pronto.",
        );
        pendingCodeRef.current = null;
        pendingSessionRef.current = null;
        return;
      }

      if (
        payload.event === "FINISH" ||
        payload.event === "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING"
      ) {
        pendingSessionRef.current = {
          code: "",
          event: payload.event,
          waba_id: payload.data.waba_id,
          phone_number_id: payload.data.phone_number_id,
          business_id: payload.data.business_id,
        };
        void flushCompletion();
      }
    }

    window.addEventListener("message", handleMessage);
    return () => {
      cancelled = true;
      window.removeEventListener("message", handleMessage);
    };
  }, [flushCompletion]);

  const launchSignup = useCallback(() => {
    if (!window.FB) {
      setPhase("error");
      setErrorMessage("SDK da Meta ainda não carregou. Aguarde um instante e tente de novo.");
      return;
    }

    if (!META_EMBEDDED_SIGNUP_CONFIG_ID) {
      setPhase("error");
      setErrorMessage("Configuração da Meta incompleta. Veja as instruções abaixo.");
      return;
    }

    setErrorMessage(null);
    setPhase("popup_open");
    pendingCodeRef.current = null;
    pendingSessionRef.current = null;

    window.FB.login(
      (response) => {
        if (response.authResponse?.code) {
          pendingCodeRef.current = response.authResponse.code;
          void flushCompletion();
          return;
        }

        setPhase((current) => {
          if (current === "completing" || current === "success") {
            return current;
          }
          return "error";
        });
        setErrorMessage("Login cancelado ou não concluído.");
      },
      {
        config_id: META_EMBEDDED_SIGNUP_CONFIG_ID,
        response_type: "code",
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: "whatsapp_business_app_onboarding",
          sessionInfoVersion: "3",
        },
      },
    );
  }, [flushCompletion]);

  return {
    phase,
    errorMessage,
    launchSignup,
    isReady: phase === "ready" || phase === "success" || phase === "error",
    isLaunching: phase === "popup_open" || phase === "completing",
  };
}
