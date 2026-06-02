import * as React from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface AppScrollAreaProps extends React.ComponentPropsWithoutRef<typeof ScrollArea> {
  horizontal?: boolean;
}

/** Scroll padronizado (shadcn ScrollArea) — usar no lugar de overflow nativo. */
export function AppScrollArea({
  className,
  children,
  horizontal = false,
  ...props
}: AppScrollAreaProps) {
  return (
    <ScrollArea className={cn("relative h-full w-full", className)} {...props}>
      {children}
      {horizontal && <ScrollBar orientation="horizontal" />}
    </ScrollArea>
  );
}
