import { z } from "zod";

export const supplierSchema = z.object({
  name: z.string().min(2, "Nombre requerido").max(200),
  contact: z.string().max(200).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  whatsapp: z.string().max(50).optional().nullable(),
  email: z.string().email("Email inválido").optional().nullable().or(z.literal("")),
  address: z.string().max(300).optional().nullable(),
});

export const productSupplierLinkSchema = z.object({
  supplierId: z.string().optional(),
  newSupplier: supplierSchema.optional(),
  supplierPrice: z.number().positive("Precio mayorista requerido"),
  notes: z.string().max(500).optional().nullable(),
}).refine(
  (data) => data.supplierId || data.newSupplier,
  { message: "Seleccioná un proveedor o creá uno nuevo" },
);

export type SupplierInput = z.infer<typeof supplierSchema>;
export type ProductSupplierLinkInput = z.infer<typeof productSupplierLinkSchema>;
