"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CatalogItem = { id: string; name: string };

type CatalogEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "category" | "brand";
  item: CatalogItem | null;
  onUpdated: (item: CatalogItem) => void;
  onDeleted: (id: string) => void;
};

export function CatalogEditDialog({
  open,
  onOpenChange,
  type,
  item,
  onUpdated,
  onDeleted,
}: CatalogEditDialogProps) {
  const [name, setName] = useState(item?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const label = type === "category" ? "categoría" : "marca";
  const endpointBase = type === "category" ? "/api/categories" : "/api/brands";

  function handleOpenChange(next: boolean) {
    if (!next) {
      setName("");
      setError(null);
    }
    onOpenChange(next);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return;

    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`${endpointBase}/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Error al guardar");
      }

      toast.success(type === "category" ? "Categoría actualizada" : "Marca actualizada");
      onUpdated(json);
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!item) return;

    const confirmed = window.confirm(
      `¿Eliminar la ${label} "${item.name}"? Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;

    setError(null);
    setDeleting(true);

    try {
      const res = await fetch(`${endpointBase}/${item.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Error al eliminar");
      }

      toast.success(type === "category" ? "Categoría eliminada" : "Marca eliminada");
      onDeleted(item.id);
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Editar {label}</DialogTitle>
          <DialogDescription>
            Modificá el nombre o eliminá esta {label} si no está en uso.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="catalog-edit-name">Nombre</Label>
            <Input
              id="catalog-edit-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              autoFocus
            />
            {error ? <p className="text-destructive text-xs">{error}</p> : null}
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col sm:items-stretch">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => handleOpenChange(false)}
                disabled={submitting || deleting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={submitting || deleting || name.trim().length < 2}
              >
                {submitting ? "Guardando..." : "Guardar"}
              </Button>
            </div>
            <Button
              type="button"
              variant="destructive"
              disabled={submitting || deleting}
              onClick={() => {
                void handleDelete();
              }}
            >
              {deleting ? "Eliminando..." : `Eliminar ${label}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
