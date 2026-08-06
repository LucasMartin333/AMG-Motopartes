"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, Pencil, Plus, Search, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDebounce } from "@/hooks/use-debounce";
import { formatCurrency } from "@/lib/format";
import type { ProductListItem, ProductsResponse } from "@/types/products";
import type { SaleCartLine } from "@/types/sales";

type SalePosSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function SalePosSheet({ open, onOpenChange, onSuccess }: SalePosSheetProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [notes, setNotes] = useState("");
  const [cart, setCart] = useState<SaleCartLine[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const debouncedSearch = useDebounce(search, 250);

  const { data: searchResults, isFetching } = useQuery({
    queryKey: ["sale-product-search", debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: "1",
        pageSize: "12",
        ...(debouncedSearch && { search: debouncedSearch }),
      });
      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error("Error al buscar productos");
      return res.json() as Promise<ProductsResponse>;
    },
    enabled: open,
  });

  const total = useMemo(
    () => cart.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0),
    [cart],
  );

  const totalItems = useMemo(
    () => cart.reduce((sum, line) => sum + line.quantity, 0),
    [cart],
  );

  function resetForm() {
    setSearch("");
    setNotes("");
    setCart([]);
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm();
    onOpenChange(next);
  }

  function addProduct(product: ProductListItem) {
    if (product.stock <= 0) {
      toast.error(`"${product.name}" no tiene stock disponible`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((line) => line.productId === product.id);
      if (existing) {
        const nextQty = existing.quantity + 1;
        if (nextQty > product.stock) {
          toast.error(`Stock máximo disponible: ${product.stock}`);
          return prev;
        }
        return prev.map((line) =>
          line.productId === product.id
            ? { ...line, quantity: nextQty, stock: product.stock }
            : line,
        );
      }

      return [
        ...prev,
        {
          productId: product.id,
          code: product.code,
          name: product.name,
          stock: product.stock,
          quantity: 1,
          unitPrice: Number(product.salePrice),
          priceLocked: true,
        },
      ];
    });

    toast.success(`${product.name} agregado`);
  }

  function updateQuantity(productId: string, raw: string) {
    const qty = Number.parseInt(raw, 10);
    if (Number.isNaN(qty) || qty < 1) return;

    setCart((prev) =>
      prev.map((line) => {
        if (line.productId !== productId) return line;
        if (qty > line.stock) {
          toast.error(`Stock máximo disponible: ${line.stock}`);
          return line;
        }
        return { ...line, quantity: qty };
      }),
    );
  }

  function updatePrice(productId: string, raw: string) {
    const price = Number.parseFloat(raw);
    if (Number.isNaN(price) || price <= 0) return;

    setCart((prev) =>
      prev.map((line) =>
        line.productId === productId ? { ...line, unitPrice: price } : line,
      ),
    );
  }

  function togglePriceLock(productId: string) {
    setCart((prev) =>
      prev.map((line) =>
        line.productId === productId
          ? { ...line, priceLocked: !line.priceLocked }
          : line,
      ),
    );
  }

  function removeLine(productId: string) {
    setCart((prev) => prev.filter((line) => line.productId !== productId));
  }

  async function submitSale() {
    if (cart.length === 0) {
      toast.error("Agregá al menos un producto");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes,
          items: cart.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
          })),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al registrar la venta");

      toast.success(`Venta registrada — ${formatCurrency(json.total)}`);
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      onSuccess();
      handleOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al registrar la venta");
    } finally {
      setSubmitting(false);
    }
  }

  const products = searchResults?.items ?? [];

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="size-5" />
            Registrar venta
          </SheetTitle>
          <SheetDescription>
            Buscá repuestos, armá el ticket y confirmá. El stock se descuenta al instante.
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="space-y-3 border-b p-4">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                placeholder="Buscar por código o nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>

            <ScrollArea className="h-36 rounded-lg border">
              <div className="p-1">
                {isFetching && !products.length ? (
                  <p className="text-muted-foreground p-3 text-sm">Buscando...</p>
                ) : products.length ? (
                  products.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => addProduct(product)}
                      className="hover:bg-accent flex w-full items-start gap-3 rounded-md px-3 py-2 text-left transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{product.name}</p>
                        <p className="text-muted-foreground font-mono text-xs">{product.code}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold">{formatCurrency(product.salePrice)}</p>
                        <p
                          className={`text-xs ${product.stock <= product.minStock ? "text-amber-600" : "text-muted-foreground"}`}
                        >
                          Stock: {product.stock}
                        </p>
                      </div>
                      <Plus className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                    </button>
                  ))
                ) : (
                  <p className="text-muted-foreground p-3 text-sm">
                    {debouncedSearch
                      ? "No se encontraron productos"
                      : "Escribí para buscar repuestos"}
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Ticket ({totalItems} unidades)</h3>
                {cart.length > 0 ? (
                  <Button variant="ghost" size="sm" onClick={() => setCart([])}>
                    Vaciar
                  </Button>
                ) : null}
              </div>

              {cart.length === 0 ? (
                <div className="text-muted-foreground rounded-lg border border-dashed py-10 text-center text-sm">
                  Agregá productos desde la búsqueda de arriba
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((line) => (
                    <div key={line.productId} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{line.name}</p>
                          <p className="text-muted-foreground font-mono text-xs">{line.code}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeLine(line.productId)}
                        >
                          <Trash2 className="text-destructive size-4" />
                        </Button>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Cantidad</Label>
                          <Input
                            type="number"
                            min={1}
                            max={line.stock}
                            value={line.quantity}
                            onChange={(e) => updateQuantity(line.productId, e.target.value)}
                          />
                          <p className="text-muted-foreground text-[11px]">Máx. {line.stock}</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Precio unit.</Label>
                          <div className="flex gap-1">
                            <Input
                              type="number"
                              min={0.01}
                              step="0.01"
                              value={line.unitPrice}
                              readOnly={line.priceLocked}
                              onChange={(e) => updatePrice(line.productId, e.target.value)}
                              className={line.priceLocked ? "bg-muted/50" : ""}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon-sm"
                              title={line.priceLocked ? "Editar precio" : "Bloquear precio"}
                              onClick={() => togglePriceLock(line.productId)}
                            >
                              {line.priceLocked ? (
                                <Pencil className="size-3.5" />
                              ) : (
                                <Lock className="size-3.5" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <Badge variant="secondary" className="font-normal">
                          Subtotal
                        </Badge>
                        <span className="text-sm font-semibold">
                          {formatCurrency(line.quantity * line.unitPrice)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="sale-notes">Notas (opcional)</Label>
                <Textarea
                  id="sale-notes"
                  placeholder="Cliente, observaciones..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </ScrollArea>
        </div>

        <SheetFooter className="border-t bg-muted/30 px-4 py-4">
          <div className="flex w-full flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Total</span>
              <span className="text-2xl font-bold">{formatCurrency(total)}</span>
            </div>
            <Button
              className="w-full"
              size="lg"
              disabled={submitting || cart.length === 0}
              onClick={() => {
                void submitSale();
              }}
            >
              {submitting ? "Registrando..." : "Confirmar venta"}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
