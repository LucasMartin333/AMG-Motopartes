"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Textarea } from "@/components/ui/textarea";
import { supplierSchema, type SupplierInput } from "@/lib/validations/supplier";
import type { SupplierListItem } from "@/types/suppliers";

type SupplierFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: SupplierListItem | null;
  onSuccess: () => void;
};

const emptyValues: SupplierInput = {
  name: "",
  contact: "",
  phone: "",
  whatsapp: "",
  email: "",
  address: "",
};

export function SupplierFormDialog({
  open,
  onOpenChange,
  supplier,
  onSuccess,
}: SupplierFormDialogProps) {
  const isEditing = !!supplier;

  const form = useForm<SupplierInput>({
    resolver: zodResolver(supplierSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (!open) return;

    if (supplier) {
      form.reset({
        name: supplier.name,
        contact: supplier.contact ?? "",
        phone: supplier.phone ?? "",
        whatsapp: supplier.whatsapp ?? "",
        email: supplier.email ?? "",
        address: supplier.address ?? "",
      });
    } else {
      form.reset(emptyValues);
    }
  }, [open, supplier, form]);

  async function onSubmit(values: SupplierInput) {
    const payload = {
      ...values,
      contact: values.contact || null,
      phone: values.phone || null,
      whatsapp: values.whatsapp || null,
      email: values.email || null,
      address: values.address || null,
    };

    const res = await fetch(
      isEditing ? `/api/suppliers/${supplier!.id}` : "/api/suppliers",
      {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error ?? "Error al guardar");
    }

    onOpenChange(false);
    onSuccess();
    return json;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar proveedor" : "Nuevo proveedor"}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(async (values) => {
            try {
              await onSubmit(values);
            } catch (error) {
              form.setError("root", {
                message: error instanceof Error ? error.message : "Error al guardar",
              });
            }
          })}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" {...form.register("name")} />
            {form.formState.errors.name ? (
              <p className="text-destructive text-xs">{form.formState.errors.name.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact">Contacto</Label>
            <Input id="contact" {...form.register("contact")} placeholder="Nombre de referencia" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" {...form.register("phone")} placeholder="11-4567-8901" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input id="whatsapp" {...form.register("whatsapp")} placeholder="+54911..." />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...form.register("email")} />
            {form.formState.errors.email ? (
              <p className="text-destructive text-xs">{form.formState.errors.email.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Textarea id="address" rows={2} {...form.register("address")} />
          </div>

          {form.formState.errors.root ? (
            <p className="text-destructive text-sm">{form.formState.errors.root.message}</p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Guardando..." : isEditing ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
