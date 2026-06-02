import { useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AppScrollArea } from "@/components/ui/app-scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toAdminUserMessage } from "@/lib/adminUserMessage";

const WINE_COUNTRY_OPTIONS = [
  "Argentina",
  "Chile",
  "Portugal",
  "Itália",
  "França",
  "Espanha",
  "Brasil",
  "Uruguai",
];

export interface ProductEditSheetProduct {
  id: number;
  name: string;
  price: number;
  short_description?: string | null;
  country_origin?: string | null;
  is_house_wine?: boolean;
  price_glass?: number | null;
  price_half_carafe?: number | null;
  price_carafe?: number | null;
}

interface ProductEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductEditSheetProduct | null;
  categoryName: string;
  isWineCategory: boolean;
  hasPizzaSizePricing: boolean;
  onSave: (data: {
    name: string;
    price: number;
    short_description?: string;
    country_origin?: string | null;
    is_house_wine?: boolean;
    price_glass?: number | null;
    price_half_carafe?: number | null;
    price_carafe?: number | null;
  }) => Promise<unknown>;
  onDelete: () => void;
  isSaving?: boolean;
}

function parseOptionalNumber(value: string): number | null {
  if (!value.trim()) {
    return null;
  }
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed)) {
    return Number.NaN;
  }
  return parsed;
}

export function ProductEditSheet({
  open,
  onOpenChange,
  product,
  categoryName,
  isWineCategory,
  hasPizzaSizePricing,
  onSave,
  onDelete,
  isSaving = false,
}: ProductEditSheetProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [desc, setDesc] = useState("");
  const [countryOrigin, setCountryOrigin] = useState("");
  const [isHouseWine, setIsHouseWine] = useState(false);
  const [priceGlass, setPriceGlass] = useState("");
  const [priceHalfCarafe, setPriceHalfCarafe] = useState("");
  const [priceCarafe, setPriceCarafe] = useState("");

  useEffect(() => {
    if (!product || !open) {
      return;
    }
    setName(product.name);
    setPrice(product.price.toString());
    setDesc(product.short_description ?? "");
    setCountryOrigin(product.country_origin ?? "");
    setIsHouseWine(!!product.is_house_wine);
    setPriceGlass(product.price_glass?.toString() ?? "");
    setPriceHalfCarafe(product.price_half_carafe?.toString() ?? "");
    setPriceCarafe(product.price_carafe?.toString() ?? "");
  }, [product, open]);

  async function handleSave() {
    if (!product || !name.trim()) {
      toast.error("Preencha o nome do item.");
      return;
    }

    let parsedPrice = Number.parseFloat(price);
    let parsedGlass: number | null = null;
    let parsedHalf: number | null = null;
    let parsedCarafe: number | null = null;

    if (isWineCategory && isHouseWine) {
      parsedGlass = parseOptionalNumber(priceGlass);
      parsedHalf = parseOptionalNumber(priceHalfCarafe);
      parsedCarafe = parseOptionalNumber(priceCarafe);
      if (
        Number.isNaN(parsedGlass) ||
        Number.isNaN(parsedHalf) ||
        Number.isNaN(parsedCarafe)
      ) {
        toast.error("Confira os preços de taça, meia jarra e jarra.");
        return;
      }
      if (parsedGlass === null && parsedHalf === null && parsedCarafe === null) {
        toast.error("Preencha ao menos um preço (taça, meia jarra ou jarra).");
        return;
      }
      parsedPrice = parsedCarafe ?? parsedHalf ?? parsedGlass ?? 0;
    } else {
      parsedPrice = Number.parseFloat(price);
      if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
        toast.error("Preencha um preço válido.");
        return;
      }
    }

    try {
      await onSave({
        name: name.trim(),
        price: parsedPrice,
        short_description: desc.trim() || undefined,
        country_origin: isWineCategory && !isHouseWine ? (countryOrigin || null) : null,
        is_house_wine: isWineCategory ? isHouseWine : false,
        price_glass: isWineCategory && isHouseWine ? parsedGlass : null,
        price_half_carafe: isWineCategory && isHouseWine ? parsedHalf : null,
        price_carafe: isWineCategory && isHouseWine ? parsedCarafe : null,
      });
      toast.success("Item salvo!");
      onOpenChange(false);
    } catch (err) {
      toast.error(toAdminUserMessage(err instanceof Error ? err.message : undefined));
    }
  }

  function handleDelete() {
    if (!product) {
      return;
    }
    if (confirm(`Excluir "${product.name}"?`)) {
      onDelete();
      onOpenChange(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="flex h-[90dvh] flex-col gap-0 rounded-t-2xl p-0">
        <SheetHeader className="shrink-0 px-6 pt-6">
          <SheetTitle>Editar item</SheetTitle>
          <SheetDescription>
            {categoryName}
            {hasPizzaSizePricing && " · Broto e mini: ajuste no computador"}
          </SheetDescription>
        </SheetHeader>

        {product && (
          <AppScrollArea className="flex-1 min-h-0">
            <div className="px-6 mt-4 space-y-4 pb-4">
            <div className="space-y-2">
              <Label htmlFor="product-name">Nome</Label>
              <Input
                id="product-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="min-h-[44px]"
              />
            </div>

            {isWineCategory && (
              <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <Label htmlFor="house-wine" className="text-sm">Vinho da casa</Label>
                <Switch id="house-wine" checked={isHouseWine} onCheckedChange={setIsHouseWine} />
              </div>
            )}

            {isWineCategory && isHouseWine ? (
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="price-glass">Taça (R$)</Label>
                  <Input id="price-glass" type="number" step="0.01" value={priceGlass} onChange={(e) => setPriceGlass(e.target.value)} className="min-h-[44px]" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price-half">Meia jarra (R$)</Label>
                  <Input id="price-half" type="number" step="0.01" value={priceHalfCarafe} onChange={(e) => setPriceHalfCarafe(e.target.value)} className="min-h-[44px]" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price-carafe">Jarra (R$)</Label>
                  <Input id="price-carafe" type="number" step="0.01" value={priceCarafe} onChange={(e) => setPriceCarafe(e.target.value)} className="min-h-[44px]" />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="product-price">Preço (R$)</Label>
                <Input
                  id="product-price"
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="min-h-[44px]"
                />
              </div>
            )}

            {isWineCategory && !isHouseWine && (
              <div className="space-y-2">
                <Label>País de origem</Label>
                <Select value={countryOrigin || undefined} onValueChange={setCountryOrigin}>
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue placeholder="Selecione o país" />
                  </SelectTrigger>
                  <SelectContent>
                    {WINE_COUNTRY_OPTIONS.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="product-desc">Descrição</Label>
              <Textarea
                id="product-desc"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
            </div>
          </AppScrollArea>
        )}

        <SheetFooter className="shrink-0 p-4 bg-background border-t flex-row gap-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            type="button"
            variant="destructive"
            className="min-h-[44px]"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Excluir
          </Button>
          <Button
            type="button"
            className="min-h-[44px] flex-1"
            disabled={isSaving}
            onClick={() => void handleSave()}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
