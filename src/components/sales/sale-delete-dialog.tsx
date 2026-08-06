"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { formatCurrency } from "@/lib/format";

type SaleDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saleLabel?: string;
  saleTotal?: string;
  loading?: boolean;
  onConfirm: (password: string) => void | Promise<void>;
};

export function SaleDeleteDialog({
  open,
  onOpenChange,
  saleLabel,
  saleTotal,
  loading,
  onConfirm,
}: SaleDeleteDialogProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setPassword("");
    setShowPassword(false);
    setError(null);
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm();
    onOpenChange(next);
  }

  async function handleConfirm() {
    if (!password.trim()) {
      setError("Ingresá tu contraseña");
      return;
    }

    setError(null);
    try {
      await onConfirm(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar la venta");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Eliminar venta</DialogTitle>
          <DialogDescription>
            {saleLabel ? (
              <>
                Vas a eliminar la venta de <strong>{saleLabel}</strong>
                {saleTotal ? <> ({formatCurrency(saleTotal)})</> : null}. El stock de los
                productos se restaurará. Ingresá tu contraseña de administrador para confirmar.
              </>
            ) : (
              <>
                El stock de los productos se restaurará. Ingresá tu contraseña de administrador
                para confirmar.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="admin-delete-password">Contraseña</Label>
          <InputGroup className="h-9">
            <InputGroupInput
              id="admin-delete-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) {
                  void handleConfirm();
                }
              }}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                type="button"
                size="icon-xs"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          {error ? <p className="text-destructive text-xs">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={loading}
            onClick={() => {
              void handleConfirm();
            }}
          >
            {loading ? "Eliminando..." : "Eliminar venta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
