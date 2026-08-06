import { z } from "zod";

export const catalogNameSchema = z.object({
  name: z
    .string()
    .min(2, "Mínimo 2 caracteres")
    .max(80, "Máximo 80 caracteres")
    .transform((v) => v.trim()),
});

export type CatalogNameInput = z.infer<typeof catalogNameSchema>;
