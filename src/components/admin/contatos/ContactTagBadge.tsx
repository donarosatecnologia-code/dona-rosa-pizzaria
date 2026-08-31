import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ContactTagBadgeProps {
  name: string;
  color?: string | null;
  className?: string;
}

export function ContactTagBadge({ name, color, className }: ContactTagBadgeProps) {
  const hasColor = Boolean(color);

  return (
    <Badge
      variant={hasColor ? "default" : "secondary"}
      className={cn("text-[10px] border-transparent text-white", className)}
      style={
        hasColor
          ? { backgroundColor: color!, borderColor: color! }
          : undefined
      }
    >
      {name}
    </Badge>
  );
}
