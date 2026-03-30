import loadingPizzaImg from "@/assets/loading-pizza.png";

/**
 * Pizza ilustrada com rotação — usada no loader global e no painel admin.
 */
export function LoadingPizzaSpinner({ className = "" }: { className?: string }) {
  return (
    <img
      src={loadingPizzaImg}
      alt=""
      className={className}
      width={120}
      height={120}
      decoding="async"
      draggable={false}
    />
  );
}

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = "Carregando conteúdo…" }: LoadingScreenProps) {
  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-6 bg-background/95 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="animate-[spin_2.2s_linear_infinite]">
        <LoadingPizzaSpinner className="h-24 w-24 md:h-28 md:w-28" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  );
}
