import { useCallback } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  ExternalLink,
  Loader2,
  Smartphone,
  Monitor,
  ArrowLeft,
  RefreshCw,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminPageShell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  isEmbeddedSignupConfigured,
  META_APP_ID,
} from "@/lib/meta-embedded-signup";
import { useMetaEmbeddedSignup } from "@/hooks/whatsapp/useMetaEmbeddedSignup";
import { useWhatsappConnectionStatus, useWhatsappPhoneStatus } from "@/hooks/whatsapp";
import { useWhatsappEmbeddedSignupComplete } from "@/hooks/whatsapp/useWhatsappEmbeddedSignupComplete";

const LINKS = {
  developersWebhook:
    "https://developers.facebook.com/apps/912159588512848/whatsapp-business/wa-settings/",
  whatsappManager: "https://business.facebook.com/wa/manage/phone-numbers/",
};

interface SetupStep {
  title: string;
  body: string;
  done: boolean;
  link?: { href: string; label: string };
}

function StepIcon({ done }: { done: boolean }) {
  if (done) {
    return <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />;
  }
  return <Circle className="h-5 w-5 shrink-0 text-amber-500" aria-hidden />;
}

export default function AdminConectarWhatsapp() {
  const queryClient = useQueryClient();
  const { isConnected, lastWebhookAt, config, isLoading: statusLoading } =
    useWhatsappConnectionStatus();
  const phoneStatus = useWhatsappPhoneStatus(true);
  const completeSignup = useWhatsappEmbeddedSignupComplete();

  const handleComplete = useCallback(
    async (payload: Parameters<typeof completeSignup.mutateAsync>[0]) => {
      const result = await completeSignup.mutateAsync(payload);
      toast.success(result.message ?? "Etapa concluída. Confira o celular e atualize o status.");
      await queryClient.invalidateQueries({ queryKey: ["whatsapp", "phone-status"] });
      await queryClient.invalidateQueries({ queryKey: ["whatsapp", "connection-status"] });
    },
    [completeSignup, queryClient],
  );

  const { errorMessage, currentStep, launchSignup, isReady, isLaunching } =
    useMetaEmbeddedSignup({ onComplete: handleComplete });

  const configured = isEmbeddedSignupConfigured();
  const isBusy = isLaunching || completeSignup.isPending;
  const cloudReady = phoneStatus.data?.phone?.is_cloud_ready ?? false;
  const tokenBroken = phoneStatus.data?.ok === false;
  const infraReady = phoneStatus.data?.ok === true && !tokenBroken;
  const needsPhoneSession = infraReady && !cloudReady;

  const setupSteps: SetupStep[] = [
    {
      title: "App aprovado pela Meta",
      body: "Permissões whatsapp_business_management e whatsapp_business_messaging liberadas.",
      done: true,
    },
    {
      title: "Servidor e webhook configurados",
      body: "Secrets no Supabase, webhook ativo e token válido para o número +55 11 93061-7116.",
      done: infraReady || isConnected,
      link: { href: LINKS.developersWebhook, label: "Conferir webhook na Meta" },
    },
    {
      title: "Sessão no celular com a Rosa (coexistência)",
      body:
        "WhatsApp Business da loja + QR no computador, no mesmo horário. Até concluir, o celular atende normalmente; o painel ainda não recebe mensagens.",
      done: cloudReady,
    },
    {
      title: "Testar no painel",
      body: "Enviar mensagem de teste e conferir em Mensagens.",
      done: cloudReady,
      link: cloudReady ? { href: "/admin/conversas", label: "Abrir Mensagens" } : undefined,
    },
  ];

  const qrButtonDisabled =
    cloudReady || tokenBroken || !configured || !isReady || isBusy;

  const qrButtonLabel = cloudReady
    ? "Conexão concluída"
    : isBusy
      ? "Aguardando Meta…"
      : "Gerar QR no computador";

  const qrButtonHint = cloudReady
    ? null
    : tokenBroken
      ? "Atualize o token Meta no Supabase (Ajustes → equipe técnica)."
      : !configured
        ? "Inclua VITE_META_EMBEDDED_SIGNUP_CONFIG_ID no .env antes do build HostGator."
        : !isReady
          ? "Carregando login da Meta… recarregue em alguns segundos."
          : needsPhoneSession
            ? "Combine horário com a Rosa antes de clicar — ela precisa escanear o QR."
            : null;

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
        description="Celular da pizzaria + painel. App Meta aprovado — falta só a sessão com a Rosa."
      />

      {cloudReady ? (
        <Alert className="mb-4 border-emerald-200 bg-emerald-50 text-emerald-950">
          <CheckCircle2 className="h-4 w-4 text-emerald-700" />
          <AlertTitle className="text-emerald-900">Tudo pronto</AlertTitle>
          <AlertDescription className="text-emerald-900/90 text-sm space-y-2">
            <p>
              O número está <strong>CONNECTED</strong> na Cloud API. Mensagens do celular e do painel
              ficam sincronizadas.
            </p>
            <Button asChild size="sm" className="mt-1 min-h-[44px]">
              <Link to="/admin/conversas">
                <MessageCircle className="h-4 w-4 mr-2" />
                Ir para Mensagens
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="mb-4 border-sky-200 bg-sky-50 text-sky-950">
          <CheckCircle2 className="h-4 w-4 text-sky-700" />
          <AlertTitle className="text-sky-900">Infraestrutura pronta — aguardando celular</AlertTitle>
          <AlertDescription className="text-sky-900/90 text-sm space-y-1">
            <p>
              App Review concluído, servidor e webhook OK. O WhatsApp no celular da loja{" "}
              <strong>continua atendendo clientes</strong> normalmente.
            </p>
            <p>
              Falta uma sessão de ~15 minutos com a Rosa: ela escaneia o QR no computador. Depois disso,
              as conversas aparecem em <strong>Mensagens</strong>.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {!configured && !cloudReady && (
        <Alert className="mb-4 border-amber-200 bg-amber-50 text-amber-950">
          <AlertTriangle className="h-4 w-4 text-amber-700" />
          <AlertTitle>Build HostGator</AlertTitle>
          <AlertDescription className="text-sm">
            Para o botão de QR funcionar, defina{" "}
            <code className="text-xs">VITE_META_EMBEDDED_SIGNUP_CONFIG_ID</code> no{" "}
            <code className="text-xs">.env</code> antes de{" "}
            <code className="text-xs">npm run build:hostgator</code>. As instruções para a Rosa no
            celular funcionam mesmo sem esse botão.
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
                    Aguardando sessão no celular
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
                Status Meta: {phoneStatus.data.phone.status} / {phoneStatus.data.phone.platform_type}
              </p>
              <p>{phoneStatus.data.user_hint}</p>
              <p className="font-medium">{phoneStatus.data.next_step}</p>
            </>
          ) : tokenBroken ? (
            <div className="space-y-2 text-amber-800">
              <p className="font-medium">Token Meta precisa ser atualizado no Supabase</p>
              <p className="text-sm">{phoneStatus.data?.user_hint ?? phoneStatus.data?.message}</p>
              <p className="text-sm">{phoneStatus.data?.next_step}</p>
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
          <CardTitle className="text-sm">Progresso da configuração</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {setupSteps.map((step) => (
            <div key={step.title} className="flex gap-3">
              <StepIcon done={step.done} />
              <div className="min-w-0">
                <p className={`font-medium ${step.done ? "text-foreground" : "text-amber-900"}`}>
                  {step.title}
                </p>
                <p className="text-muted-foreground mt-0.5">{step.body}</p>
                {step.link &&
                  (step.link.href.startsWith("/") ? (
                    <Link
                      to={step.link.href}
                      className="text-primary underline inline-flex items-center gap-1 mt-1 text-xs"
                    >
                      {step.link.label}
                    </Link>
                  ) : (
                    <a
                      href={step.link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline inline-flex items-center gap-1 mt-1 text-xs"
                    >
                      {step.link.label}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {!cloudReady && (
        <>
          <Alert className="mb-4 border-amber-200 bg-amber-50/80">
            <Smartphone className="h-4 w-4 text-amber-700" />
            <AlertTitle className="text-amber-900">Para a Rosa (quando puder — ~15 min)</AlertTitle>
            <AlertDescription className="text-sm text-amber-950/90 space-y-2">
              <p>Peça para ela fazer <strong>antes</strong> de escanear o QR:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>WhatsApp Business → <strong>Aparelhos conectados</strong> → desconectar WhatsApp Web</li>
                <li>Voltar → <strong>Configurações</strong> → <strong>Conta</strong></li>
                <li>Toque em <strong>Plataforma comercial</strong> → <strong>Conectar</strong></li>
                <li>Escolha <strong>Escanear QR code</strong> e deixe a câmera aberta</li>
              </ol>
              <p className="text-xs">
                Não apague a conta. Não use “Conectar dispositivo” (isso é WhatsApp Web).
              </p>
            </AlertDescription>
          </Alert>

          <div className="grid gap-4 sm:grid-cols-2 mb-4">
            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-primary" />
                  Celular (Rosa)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>Ela mantém a tela de escaneamento aberta enquanto você gera o QR no PC.</p>
                <p>Se a Meta enviar código numérico no chat Facebook Business, use “Inserir código”.</p>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-primary" />
                  Computador (você)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3">
                <p>
                  Login Facebook com conta <strong>admin Dona Rosa Pizzaria</strong>. No popup: conectar
                  app existente → número +55 11 93061-7116.
                </p>
                <Button
                  type="button"
                  size="lg"
                  className="min-h-[44px] w-full"
                  disabled={qrButtonDisabled}
                  title={qrButtonHint ?? undefined}
                  onClick={() => launchSignup()}
                >
                  {isBusy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {qrButtonLabel}
                </Button>
                {qrButtonHint && (
                  <p className="text-xs text-muted-foreground">{qrButtonHint}</p>
                )}
                {currentStep && (
                  <p className="text-xs text-muted-foreground">Etapa Meta: {currentStep}</p>
                )}
                {errorMessage && (
                  <Alert variant="destructive" className="text-left">
                    <AlertTitle className="text-sm">Popup Meta</AlertTitle>
                    <AlertDescription className="whitespace-pre-line text-xs">
                      {errorMessage}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <Card className="mb-4 border-dashed">
        <CardContent className="pt-6 space-y-2">
          <p className="text-sm font-medium">Webhook (servidor)</p>
          {statusLoading ? (
            <p className="text-xs text-muted-foreground">Verificando…</p>
          ) : isConnected || infraReady ? (
            <p className="text-xs text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Ativo
              {config?.display_name ? ` · ${config.display_name}` : ""}
              {!cloudReady && " — aguardando celular para receber mensagens"}
            </p>
          ) : (
            <p className="text-xs text-amber-700">Verificando conexão · App {META_APP_ID}</p>
          )}
          {lastWebhookAt && (
            <p className="text-xs text-muted-foreground">
              Último evento: {new Date(lastWebhookAt).toLocaleString("pt-BR")}
            </p>
          )}
          <a
            href={LINKS.whatsappManager}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline inline-flex items-center gap-1 text-xs"
          >
            Gerenciador WhatsApp (consulta)
            <ExternalLink className="h-3 w-3" />
          </a>
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
