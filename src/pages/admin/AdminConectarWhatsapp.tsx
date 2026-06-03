import { useCallback } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Smartphone,
  Monitor,
  ArrowLeft,
  RefreshCw,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminPageShell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  isEmbeddedSignupConfigured,
  META_APP_ID,
  META_EMBEDDED_SIGNUP_CONFIG_ID,
} from "@/lib/meta-embedded-signup";
import { useMetaEmbeddedSignup } from "@/hooks/whatsapp/useMetaEmbeddedSignup";
import { useWhatsappConnectionStatus, useWhatsappPhoneStatus } from "@/hooks/whatsapp";
import { useWhatsappEmbeddedSignupComplete } from "@/hooks/whatsapp/useWhatsappEmbeddedSignupComplete";

const LINKS = {
  developersApi:
    "https://developers.facebook.com/apps/912159588512848/whatsapp-business/wa-settings/",
  whatsappManager: "https://business.facebook.com/wa/manage/phone-numbers/",
  businessUsers: "https://business.facebook.com/latest/settings/system_users",
  transferHelp: "https://www.facebook.com/business/help/236817717885919",
  guideDoc: "/docs/COEXISTENCIA-WHATSAPP.md",
};

const STEPS = [
  {
    title: "App e pagamento ficam em Dona Rosa Pizzaria",
    body:
      "Não mova o app Dona Rosa Piuzza para outro portfólio (evita pedir cartão/pagamento de novo). Se já moveu para Janaina Developer, reverta: remova o app lá e conecte o ID 912159588512848 de volta em Dona Rosa.",
    link: { href: LINKS.transferHelp, label: "Como transferir app (Meta)" },
  },
  {
    title: "Token no servidor (portfólio Dona Rosa)",
    body:
      "Gere token no Business Suite → Usuários do sistema (Dona Rosa Pizzaria), com acesso ao app e à conta WhatsApp. Cole em supabase/secrets.meta.env e rode: npm run secrets:meta",
    link: { href: LINKS.businessUsers, label: "Usuários do sistema" },
  },
  {
    title: "Webhook e WABA",
    body:
      "No terminal: npm run meta:coexistence e npm run meta:verify (token_valid deve ser true). Webhook: messages + smb_message_echoes.",
    link: { href: LINKS.developersApi, label: "Configuração WhatsApp" },
  },
  {
    title: "Celular + QR no computador",
    body:
      "Rosa: Conta → Plataforma comercial → Conectar. Você: no PC, Gerar QR (popup Meta) — Rosa escaneia o monitor. Ou código numérico se a Meta mandar no chat Facebook Business.",
    link: { href: LINKS.whatsappManager, label: "Gerenciador (só consulta)" },
  },
  {
    title: "Validar no painel",
    body:
      "Atualizar status abaixo até “Pronto”. Envie mensagem de teste para +55 11 93061-7116 e veja em Mensagens.",
    link: null,
  },
];

export default function AdminConectarWhatsapp() {
  const queryClient = useQueryClient();
  const { isConnected, lastWebhookAt, config, isLoading: statusLoading } =
    useWhatsappConnectionStatus();
  const phoneStatus = useWhatsappPhoneStatus(true);
  const completeSignup = useWhatsappEmbeddedSignupComplete();

  const handleComplete = useCallback(
    async (payload: Parameters<typeof completeSignup.mutateAsync>[0]) => {
      const result = await completeSignup.mutateAsync(payload);
      toast.success(result.message ?? "Etapa no site concluída. Confira o celular.");
      await queryClient.invalidateQueries({ queryKey: ["whatsapp", "phone-status"] });
      await queryClient.invalidateQueries({ queryKey: ["whatsapp", "connection-status"] });
    },
    [completeSignup, queryClient],
  );

  const { phase, errorMessage, currentStep, launchSignup, isReady, isLaunching } =
    useMetaEmbeddedSignup({ onComplete: handleComplete });

  const configured = isEmbeddedSignupConfigured();
  const isBusy = isLaunching || completeSignup.isPending;
  const cloudReady = phoneStatus.data?.phone?.is_cloud_ready ?? false;
  const tokenBroken = phoneStatus.data?.ok === false;

  return (
    <AdminPageShell width="md">
      <Button variant="ghost" size="sm" className="mb-3 -ml-2" asChild>
        <Link to="/admin/configuracoes">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar aos ajustes
        </Link>
      </Button>

      <AdminPageHeader
        title="Conectar WhatsApp"
        description="Coexistência: celular da pizzaria + painel. Sem mudar cobrança de portfólio."
      />

      <Alert className="mb-4 border-emerald-200 bg-emerald-50 text-emerald-950">
        <CheckCircle2 className="h-4 w-4 text-emerald-700" />
        <AlertTitle className="text-emerald-900">Caminho recomendado (sem Janaina Developer)</AlertTitle>
        <AlertDescription className="text-emerald-900/90 text-sm space-y-2">
          <p>
            O passo principal é no <strong>celular</strong> (Plataforma comercial), depois do token no
            portfólio <strong>Dona Rosa Pizzaria</strong>. O botão &quot;Iniciar conexão&quot; é{" "}
            <strong>opcional</strong> e costuma falhar se o app e a pizzaria estão no mesmo portfólio —
            isso é limitação da Meta, não do site.
          </p>
          <p className="text-xs">
            Guia completo no repositório: <code>docs/COEXISTENCIA-WHATSAPP.md</code>
          </p>
        </AlertDescription>
      </Alert>

      {!configured && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Deploy do site</AlertTitle>
          <AlertDescription>
            Defina <code>VITE_META_EMBEDDED_SIGNUP_CONFIG_ID</code> no build (opcional para o popup).
          </AlertDescription>
        </Alert>
      )}

      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Situação do número</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {phoneStatus.isLoading ? (
            <p className="text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Consultando a Meta…
            </p>
          ) : phoneStatus.data?.phone ? (
            <>
              <div className="flex flex-wrap gap-2">
                {cloudReady ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                    <CheckCircle2 className="h-4 w-4" />
                    Pronto — celular e painel sincronizados
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                    <AlertTriangle className="h-4 w-4" />
                    Falta ligar o celular à API (passo 4)
                  </span>
                )}
              </div>
              <p className="text-muted-foreground">
                {phoneStatus.data.phone.display_phone_number ?? "—"}
                {phoneStatus.data.phone.verified_name
                  ? ` · ${phoneStatus.data.phone.verified_name}`
                  : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                {phoneStatus.data.phone.status} / {phoneStatus.data.phone.platform_type}
              </p>
              <p>{phoneStatus.data.user_hint}</p>
              <p className="font-medium">{phoneStatus.data.next_step}</p>
            </>
          ) : tokenBroken ? (
            <div className="space-y-2 text-amber-800">
              <p className="font-medium">Atualize o token no Supabase (portfólio Dona Rosa)</p>
              <p className="text-sm">{phoneStatus.data?.user_hint ?? phoneStatus.data?.message}</p>
              <p className="text-sm">{phoneStatus.data?.next_step}</p>
              {phoneStatus.data?.message?.includes("does not belong") && (
                <p className="text-xs">
                  Isso aparece quando o app foi movido de portfólio. Reverta para Dona Rosa e gere token
                  novo no <strong>Usuário do sistema</strong> desse portfólio.
                </p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">Não foi possível consultar. Tente Atualizar status.</p>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={phoneStatus.isFetching}
            onClick={() => void phoneStatus.refetch()}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${phoneStatus.isFetching ? "animate-spin" : ""}`} />
            Atualizar status
          </Button>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Passo a passo (ordem)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {STEPS.map((step, index) => (
            <div key={step.title} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                {index + 1}
              </span>
              <div>
                <p className="font-medium">{step.title}</p>
                <p className="text-muted-foreground mt-0.5">{step.body}</p>
                {step.link && (
                  <a
                    href={step.link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline inline-flex items-center gap-1 mt-1 text-xs"
                  >
                    {step.link.label}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-primary" />
              Celular (obrigatório)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>1)</strong> Dispositivos conectados → desconecte todos os Chrome (4/4).
            </p>
            <p>
              <strong>2)</strong> Voltar → Configurações → <strong>Conta</strong> → Plataforma
              comercial (não use “Conectar dispositivo”).
            </p>
            <p>Não apague a conta. Não use verificação SMS no Gerenciador.</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-900">
              <Monitor className="h-4 w-4" />
              Popup no site — desativado
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-amber-900/90 space-y-2">
            <p>Não abra o login da Meta pelo site. Use o celular (card ao lado).</p>
            <p>Se Dona Rosa aparecer cinza no popup, fechar — é limitação da Meta, não bug do site.</p>
          </CardContent>
        </Card>
      </div>

      {!cloudReady && (
        <Alert className="mb-4 border-primary/30 bg-primary/5">
          <Smartphone className="h-4 w-4 text-primary" />
          <AlertTitle className="text-primary">QR para a Rosa escanear</AlertTitle>
          <AlertDescription className="text-sm space-y-2">
            <p>
              O QR aparece no <strong>monitor do computador</strong> (popup Meta), não no celular. Rosa
              abre Plataforma comercial → escanear → aponta para a tela do PC.
            </p>
            <p>
              Ative no build: <code>VITE_META_ALLOW_EMBEDDED_SIGNUP_POPUP=true</code> e use o botão
              abaixo. Login Facebook: conta <strong>admin Dona Rosa</strong> (evite Janaina Developer
              no popup).
            </p>
            <p className="text-xs">
              Se só houver portfólio cinza + Janaina: não clique Avançar; defina{" "}
              <code>VITE_META_BUSINESS_ID</code> e refaça o build.
            </p>
          </AlertDescription>
        </Alert>
      )}

      <Card className="mb-4 border-dashed">
        <CardContent className="pt-6 space-y-4">
          <div>
            <p className="text-sm font-medium">Webhook (servidor)</p>
            {statusLoading ? (
              <p className="text-xs text-muted-foreground">Verificando…</p>
            ) : cloudReady ? (
              <p className="text-xs text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Conectado
                {config?.display_name ? ` · ${config.display_name}` : ""}
              </p>
            ) : (
              <p className="text-xs text-amber-700">
                {isConnected ? "Webhook ok — falta ligar o celular" : "Aguardando"} · App {META_APP_ID}
              </p>
            )}
            {lastWebhookAt && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Último evento: {new Date(lastWebhookAt).toLocaleString("pt-BR")}
              </p>
            )}
          </div>

          {(import.meta.env.VITE_META_ALLOW_EMBEDDED_SIGNUP_POPUP === "true" || !cloudReady) && (
            <>
              {import.meta.env.VITE_META_ALLOW_EMBEDDED_SIGNUP_POPUP !== "true" && (
                <p className="text-xs text-amber-800">
                  Para ver o botão em produção, adicione{" "}
                  <code>VITE_META_ALLOW_EMBEDDED_SIGNUP_POPUP=true</code> no .env e rode o build de
                  novo.
                </p>
              )}
              <Button
                type="button"
                variant="default"
                size="lg"
                className="min-h-[44px] w-full sm:w-auto"
                disabled={
                  import.meta.env.VITE_META_ALLOW_EMBEDDED_SIGNUP_POPUP !== "true" ||
                  !configured ||
                  !isReady ||
                  isBusy ||
                  tokenBroken ||
                  cloudReady
                }
                onClick={launchSignup}
              >
                {isBusy ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Abrindo Meta…
                  </>
                ) : (
                  "Gerar QR no computador (popup Meta)"
                )}
              </Button>
              {errorMessage && (
                <Alert variant="destructive">
                  <AlertTitle>Popup Meta</AlertTitle>
                  <AlertDescription className="whitespace-pre-line text-sm">
                    {errorMessage}
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
