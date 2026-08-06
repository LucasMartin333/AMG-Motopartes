"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CatalogAddDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "category" | "brand";
  onSuccess: (item: { id: string; name: string }) => void;
};

export function CatalogAddDialog({
  open,
  onOpenChange,
  type,
  onSuccess,
}: CatalogAddDialogProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const title = type === "category" ? "Nueva categoría" : "Nueva marca";
  const endpoint = type === "category" ? "/api/categories" : "/api/brands";

  function handleOpenChange(next: boolean) {
    if (!next) {
      setName("");
      setError(null);
    }
    onOpenChange(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Error al guardar");
      }

      toast.success(type === "category" ? "Categoría creada" : "Marca creada");
      onSuccess(json);
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="catalog-name">Nombre</Label>
            <Input
              id="catalog-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder={type === "category" ? "Ej. Accesorios" : "Ej. Honda"}
              autoFocus
            />
            {error ? <p className="text-destructive text-xs">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting || name.trim().length < 2}>
              {submitting ? "Guardando..." : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
