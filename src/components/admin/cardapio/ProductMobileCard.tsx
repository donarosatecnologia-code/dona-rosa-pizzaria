import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PIZZA_BROTO_PERCENT_OF_GRANDE,
  PIZZA_MINI_PERCENT_OF_GRANDE,
  pizzaSizePriceFromGrande,
} from "@/lib/pizzaPricing";
import type { ProductEditSheetProduct } from "@/components/admin/cardapio/ProductEditSheet";

interface ProductMobileCardProps {
  product: ProductEditSheetProduct;
  category: { has_pizza_size_pricing?: boolean | null };
  isWineCategory: boolean;
  onEdit: () => void;
}

function formatPriceSummary(
  product: ProductEditSheetProduct,
  category: { has_pizza_size_pricing?: boolean | null },
): string {
  if (product.is_house_wine) {
    const parts: string[] = [];
    if (product.price_glass != null) {
      parts.push(`Taça R$ ${product.price_glass.toFixed(2)}`);
    }
    if (product.price_half_carafe != null) {
      parts.push(`Meia R$ ${product.price_half_carafe.toFixed(2)}`);
    }
    if (product.price_carafe != null) {
      parts.push(`Jarra R$ ${product.price_carafe.toFixed(2)}`);
    }
    return parts.join(" · ") || "—";
  }

  let summary = `R$ ${product.price.toFixed(2)}`;
  if (category.has_pizza_size_pricing) {
    const broto = pizzaSizePriceFromGrande(product.price, PIZZA_BROTO_PERCENT_OF_GRANDE, true);
    const mini = pizzaSizePriceFromGrande(product.price, PIZZA_MINI_PERCENT_OF_GRANDE, true);
    if (broto != null || mini != null) {
      summary += broto != null ? ` · Broto R$ ${broto.toFixed(2)}` : "";
      summary += mini != null ? ` · Mini R$ ${mini.toFixed(2)}` : "";
    }
  }
  return summary;
}

export function ProductMobileCard({
  product,
  category,
  isWineCategory,
  onEdit,
}: ProductMobileCardProps) {
  return (
    <div className="flex items-start gap-3 p-4 border-t border-border">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm text-foreground">{product.name}</p>
        <p className="text-xs text-primary/80 mt-0.5">{formatPriceSummary(product, category)}</p>
        {product.short_description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.short_description}</p>
        )}
        {isWineCategory && product.country_origin && (
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mt-1">
            {product.country_origin}
          </p>
        )}
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-11 w-11 shrink-0"
        aria-label={`Editar ${product.name}`}
        onClick={onEdit}
      >
        <Pencil className="h-4 w-4" />
      </Button>
    </div>
  );
}
