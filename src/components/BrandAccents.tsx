import alecrim from "@/assets/alecrim.png";
import linhaDecorativa from "@/assets/linha-decorativa.png";
import tomilhoB from "@/assets/tomilho-b.png";
import tomilho from "@/assets/tomilho.png";
import trigo from "@/assets/trigo.png";

const base = "pointer-events-none select-none";

export const brandAssets = {
  alecrim,
  linhaDecorativa,
  tomilhoB,
  tomilho,
  trigo,
} as const;

export function BrandAlecrim({ className = "" }: { className?: string }) {
  return <img src={alecrim} alt="" aria-hidden className={`${base} ${className}`} />;
}

export function BrandLinhaDecorativa({ className = "" }: { className?: string }) {
  return <img src={linhaDecorativa} alt="" aria-hidden className={`${base} ${className}`} />;
}

export function BrandTomilhoB({ className = "" }: { className?: string }) {
  return <img src={tomilhoB} alt="" aria-hidden className={`${base} ${className}`} />;
}

export function BrandTomilho({ className = "" }: { className?: string }) {
  return <img src={tomilho} alt="" aria-hidden className={`${base} ${className}`} />;
}

export function BrandTrigo({ className = "" }: { className?: string }) {
  return <img src={trigo} alt="" aria-hidden className={`${base} ${className}`} />;
}

/** Home hero — alecrim + trigo (desktop) */
export function BrandHeroAccents() {
  return (
    <>
      <BrandAlecrim className="absolute left-0 top-20 h-72 opacity-40 hidden lg:block" />
      <BrandTrigo className="absolute right-4 bottom-10 h-64 opacity-40 hidden lg:block" />
    </>
  );
}

/** Rodapé — linha central discreta */
export function BrandFooterAccent() {
  return (
    <div className="flex justify-center mb-8 opacity-[0.35]">
      <BrandLinhaDecorativa className="h-8 w-auto max-w-[min(100%,12rem)] object-contain" />
    </div>
  );
}
