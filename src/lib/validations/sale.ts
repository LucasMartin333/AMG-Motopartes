import { z } from "zod";

export const saleItemInputSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive("La cantidad debe ser mayor a 0"),
  unitPrice: z.number().positive("El precio debe ser mayor a 0"),
});

export const createSaleSchema = z.object({
  notes: z.string().max(500).optional().or(z.literal("")),
  items: z.array(saleItemInputSchema).min(1, "Agregá al menos un producto"),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type SaleItemInput = z.infer<typeof saleItemInputSchema>;
