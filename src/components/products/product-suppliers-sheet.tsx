"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Mail, Phone, Plus, Trash2, User } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/layout/confirm-dialog";
import { formatCurrency, formatDate } from "@/lib/format";
import type { ProductListItem } from "@/types/products";
import type { ProductSupplierLink, SupplierOption } from "@/types/suppliers";

type ProductSuppliersSheetProps = {
  product: ProductListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManage: boolean;
};

export function ProductSuppliersSheet({
  product,
  open,
  onOpenChange,
  canManage,
}: ProductSuppliersSheetProps) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [supplierId, setSupplierId] = useState("");
  const [supplierPrice, setSupplierPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newWhatsapp, setNewWhatsapp] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<ProductSupplierLink | null>(null);
  const [removing, setRemoving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["product-suppliers", product?.id],
    queryFn: async () => {
      const res = await fetch(`/api/products/${product!.id}/suppliers`);
      if (!res.ok) throw new Error("Error al cargar proveedores");
      return res.json() as Promise<{ product: { name: string; code: string }; links: ProductSupplierLink[] }>;
    },
    enabled: open && !!product?.id,
  });

  const { data: supplierOptions = [] } = useQuery<SupplierOption[]>({
    queryKey: ["suppliers-options"],
    queryFn: async () => {
      const res = await fetch("/api/suppliers?pageSize=100");
      if (!res.ok) throw new Error("Error");
      const json = await res.json();
      return json.items.map((s: SupplierOption & { name: string }) => ({
        id: s.id,
        name: s.name,
        phone: s.phone,
        whatsapp: s.whatsapp,
        email: s.email,
      }));
    },
    enabled: open && canManage,
  });

  function resetForm() {
    setMode("existing");
    setSupplierId("");
    setSupplierPrice("");
    setNotes("");
    setNewName("");
    setNewPhone("");
    setNewWhatsapp("");
    setNewEmail("");
  }

  function handleSheetOpenChange(next: boolean) {
    if (next) resetForm();
    onOpenChange(next);
  }

  async function handleAddLink(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;

    setSubmitting(true);
    try {
      if (mode === "existing" && !supplierId) {
        toast.error("Seleccioná un proveedor");
        return;
      }

      const payload =
        mode === "existing"
          ? { supplierId, supplierPrice: Number(supplierPrice), notes: notes || null }
          : {
              newSupplier: {
                name: newName,
                phone: newPhone || null,
                whatsapp: newWhatsapp || null,
                email: newEmail || null,
              },
              supplierPrice: Number(supplierPrice),
              notes: notes || null,
            };

      const res = await fetch(`/api/products/${product.id}/suppliers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al vincular");

      toast.success("Proveedor vinculado");
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["product-suppliers", product.id] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers-options"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al vincular");
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmRemove() {
    if (!removeTarget || !product) return;
    setRemoving(true);
    try {
      const res = await fetch(
        `/api/products/${product.id}/suppliers/${removeTarget.id}`,
        { method: "DELETE" },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al desvincular");

      toast.success("Proveedor desvinculado");
      setRemoveTarget(null);
      queryClient.invalidateQueries({ queryKey: ["product-suppliers", product.id] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al desvincular");
    } finally {
      setRemoving(false);
    }
  }

  const linkedIds = new Set(data?.links.map((l) => l.supplier.id) ?? []);
  const availableSuppliers = supplierOptions.filter((s) => !linkedIds.has(s.id));

  const supplierLabel = supplierId
    ? (availableSuppliers.find((s) => s.id === supplierId)?.name ??
      supplierOptions.find((s) => s.id === supplierId)?.name ??
      "Ninguno")
    : "Ninguno";

  return (
    <>
      <Sheet open={open} onOpenChange={handleSheetOpenChange}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Proveedores del producto</SheetTitle>
            <SheetDescription>
              {product ? `${product.name} (${product.code})` : ""}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 px-4 pb-6">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : data?.links.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Este producto no tiene proveedores vinculados.
              </p>
            ) : (
              <div className="space-y-3">
                {data?.links.map((link) => (
                  <div key={link.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{link.supplier.name}</p>
                        <p className="text-muted-foreground text-xs">
                          Precio mayorista: {formatCurrency(link.supplierPrice)}
                        </p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          Actualizado: {formatDate(link.updatedAt)}
                        </p>
                      </div>
                      {canManage ? (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setRemoveTarget(link)}
                          aria-label="Desvincular"
                        >
                          <Trash2 className="text-destructive size-4" />
                        </Button>
                      ) : null}
                    </div>

                    <div className="text-muted-foreground mt-3 space-y-1 text-sm">
                      {link.supplier.contact ? (
                        <p className="flex items-center gap-2">
                          <User className="size-3.5" />
                          {link.supplier.contact}
                        </p>
                      ) : null}
                      {link.supplier.phone ? (
                        <p className="flex items-center gap-2">
                          <Phone className="size-3.5" />
                          {link.supplier.phone}
                        </p>
                      ) : null}
                      {link.supplier.whatsapp ? (
                        <p className="flex items-center gap-2">
                          <Phone className="size-3.5" />
                          WhatsApp: {link.supplier.whatsapp}
                        </p>
                      ) : null}
                      {link.supplier.email ? (
                        <p className="flex items-center gap-2">
                          <Mail className="size-3.5" />
                          {link.supplier.email}
                        </p>
                      ) : null}
                    </div>

                    {link.notes ? (
                      <p className="text-muted-foreground mt-2 text-xs italic">{link.notes}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}

            {canManage ? (
              <>
                <Separator />
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
                    <Plus className="size-4" />
                    Agregar proveedor
                  </h3>

                  <div className="mb-4 flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={mode === "existing" ? "default" : "outline"}
                      onClick={() => setMode("existing")}
                    >
                      Existente
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={mode === "new" ? "default" : "outline"}
                      onClick={() => setMode("new")}
                    >
                      Nuevo proveedor
                    </Button>
                  </div>

                  <form onSubmit={handleAddLink} className="space-y-3">
                    {mode === "existing" ? (
                      <div className="space-y-2">
                        <Label>Proveedor</Label>
                        <Select
                          value={supplierId || "none"}
                          onValueChange={(v) => setSupplierId(v === "none" ? "" : (v ?? ""))}
                        >
                          <SelectTrigger className="w-full">
                            <span className="truncate">{supplierLabel}</span>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Ninguno</SelectItem>
                            {availableSuppliers.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2 sm:col-span-2">
                          <Label>Nombre</Label>
                          <Input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Teléfono</Label>
                          <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>WhatsApp</Label>
                          <Input
                            value={newWhatsapp}
                            onChange={(e) => setNewWhatsapp(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Precio mayorista</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={supplierPrice}
                        onChange={(e) => setSupplierPrice(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Notas</Label>
                      <Textarea
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting ? "Guardando..." : "Vincular proveedor"}
                    </Button>
                  </form>
                </div>
              </>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(o) => !o && setRemoveTarget(null)}
        title="Desvincular proveedor"
        description={
          removeTarget
            ? `¿Quitar a "${removeTarget.supplier.name}" de este producto?`
            : undefined
        }
        confirmLabel="Desvincular"
        loading={removing}
        onConfirm={confirmRemove}
      />
    </>
  );
}
