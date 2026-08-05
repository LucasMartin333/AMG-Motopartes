import { z } from "zod";

export const productSchema = z.object({
  code: z
    .string()
    .min(1, "El código es requerido")
    .max(50, "Máximo 50 caracteres")
    .regex(/^[A-Za-z0-9\-_]+$/, "Solo letras, números, guiones y guiones bajos"),
  name: z.string().min(2, "Nombre requerido").max(200),
  description: z.string().max(1000).optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  stock: z.number().int().min(0, "Stock no puede ser negativo"),
  minStock: z.number().int().min(0, "Stock mínimo no puede ser negativo"),
  salePrice: z.number().positive("Precio debe ser mayor a 0"),
  categoryId: z.string().min(1, "Seleccioná una categoría"),
  brandId: z.string().min(1, "Seleccioná una marca"),
});

export type ProductInput = z.infer<typeof productSchema>;
