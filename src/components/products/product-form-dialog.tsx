"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ImagePlus, Loader2, Pencil, Plus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { productSchema, type ProductInput } from "@/lib/validations/product";
import { CatalogAddDialog } from "@/components/products/catalog-add-dialog";
import { CatalogEditDialog } from "@/components/products/catalog-edit-dialog";
import type { BrandOption, CategoryOption, ProductListItem } from "@/types/products";

type ProductFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: ProductListItem | null;
  categories: CategoryOption[];
  brands: BrandOption[];
  canManageCatalog?: boolean;
  onSuccess: () => void;
  onCategoryAdded: (item: CategoryOption) => void;
  onBrandAdded: (item: BrandOption) => void;
  onCategoryUpdated: (item: CategoryOption) => void;
  onBrandUpdated: (item: BrandOption) => void;
  onCategoryDeleted: (id: string) => void;
  onBrandDeleted: (id: string) => void;
};

const emptyValues: ProductInput = {
  code: "",
  name: "",
  description: "",
  imageUrl: "",
  stock: 0,
  minStock: 0,
  salePrice: 0,
  categoryId: "",
  brandId: "",
};

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  categories,
  brands,
  canManageCatalog,
  onSuccess,
  onCategoryAdded,
  onBrandAdded,
  onCategoryUpdated,
  onBrandUpdated,
  onCategoryDeleted,
  onBrandDeleted,
}: ProductFormDialogProps) {
  const isEditing = !!product;
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [addBrandOpen, setAddBrandOpen] = useState(false);
  const [editCategoryOpen, setEditCategoryOpen] = useState(false);
  const [editBrandOpen, setEditBrandOpen] = useState(false);

  const form = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (!open) return;

    if (product) {
      form.reset({
        code: product.code,
        name: product.name,
        description: product.description ?? "",
        imageUrl: product.imageUrl ?? "",
        stock: product.stock,
        minStock: product.minStock,
        salePrice: Number(product.salePrice),
        categoryId: product.category.id,
        brandId: product.brand.id,
      });
      setPreviewUrl(product.imageUrl);
    } else {
      form.reset(emptyValues);
      setPreviewUrl(null);
    }
  }, [open, product, form]);

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "Error al subir imagen");
      }

      form.setValue("imageUrl", json.url, { shouldValidate: true });
      toast.success("Imagen subida");
    } catch (error) {
      setPreviewUrl(product?.imageUrl ?? null);
      toast.error(error instanceof Error ? error.message : "Error al subir imagen");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function onSubmit(values: ProductInput) {
    try {
      const payload = {
        ...values,
        description: values.description || null,
        imageUrl: values.imageUrl || null,
      };

      const res = await fetch(isEditing ? `/api/products/${product!.id}` : "/api/products", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Error al guardar");
      }

      toast.success(isEditing ? "Producto actualizado" : "Producto creado");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
    }
  }

  const imageUrl = form.watch("imageUrl");
  const categoryId = form.watch("categoryId");
  const brandId = form.watch("brandId");

  const categoryLabel =
    categories.find((c) => c.id === categoryId)?.name ?? "Seleccionar categoría";
  const brandLabel = brands.find((b) => b.id === brandId)?.name ?? "Seleccionar marca";

  const selectedCategory = categories.find((c) => c.id === categoryId) ?? null;
  const selectedBrand = brands.find((b) => b.id === brandId) ?? null;

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar producto" : "Nuevo producto"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex flex-col items-center gap-2">
              <div className="bg-muted relative flex size-28 items-center justify-center overflow-hidden rounded-lg border">
                {previewUrl || imageUrl ? (
                  <Image
                    src={previewUrl || imageUrl || ""}
                    alt="Vista previa"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <ImagePlus className="text-muted-foreground size-8" />
                )}
                {uploading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Loader2 className="size-6 animate-spin text-white" />
                  </div>
                ) : null}
              </div>
              <Label htmlFor="image" className="cursor-pointer">
                <span className="text-primary text-sm hover:underline">Subir imagen</span>
                <input
                  id="image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  onChange={handleImageChange}
                  disabled={uploading}
                />
              </Label>
            </div>

            <div className="grid flex-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" {...form.register("name")} />
                {form.formState.errors.name ? (
                  <p className="text-destructive text-xs">{form.formState.errors.name.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Código único</Label>
                <Input
                  id="code"
                  {...form.register("code")}
                  className="uppercase"
                  placeholder="FRN-001"
                />
                {form.formState.errors.code ? (
                  <p className="text-destructive text-xs">{form.formState.errors.code.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="salePrice">Precio de venta</Label>
                <Input id="salePrice" type="number" step="0.01" {...form.register("salePrice", { valueAsNumber: true })} />
                {form.formState.errors.salePrice ? (
                  <p className="text-destructive text-xs">
                    {form.formState.errors.salePrice.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>Categoría</Label>
                  {canManageCatalog ? (
                    <div className="flex items-center gap-0.5">
                      {categoryId ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="size-7"
                          title="Editar categoría"
                          onClick={() => setEditCategoryOpen(true)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground h-7 px-2 text-xs"
                        onClick={() => setAddCategoryOpen(true)}
                      >
                        <Plus className="size-3.5" />
                        Nueva
                      </Button>
                    </div>
                  ) : null}
                </div>
                <Select
                  value={categoryId || null}
                  onValueChange={(value) =>
                    form.setValue("categoryId", value ?? "", { shouldValidate: true })
                  }
                >
                  <SelectTrigger className="w-full">
                    <span className="truncate">{categoryLabel}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.categoryId ? (
                  <p className="text-destructive text-xs">
                    {form.formState.errors.categoryId.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>Marca</Label>
                  {canManageCatalog ? (
                    <div className="flex items-center gap-0.5">
                      {brandId ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="size-7"
                          title="Editar marca"
                          onClick={() => setEditBrandOpen(true)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground h-7 px-2 text-xs"
                        onClick={() => setAddBrandOpen(true)}
                      >
                        <Plus className="size-3.5" />
                        Nueva
                      </Button>
                    </div>
                  ) : null}
                </div>
                <Select
                  value={brandId || null}
                  onValueChange={(value) =>
                    form.setValue("brandId", value ?? "", { shouldValidate: true })
                  }
                >
                  <SelectTrigger className="w-full">
                    <span className="truncate">{brandLabel}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.brandId ? (
                  <p className="text-destructive text-xs">
                    {form.formState.errors.brandId.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock">Stock actual</Label>
                <Input id="stock" type="number" {...form.register("stock", { valueAsNumber: true })} />
                {form.formState.errors.stock ? (
                  <p className="text-destructive text-xs">{form.formState.errors.stock.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="minStock">Stock mínimo</Label>
                <Input id="minStock" type="number" {...form.register("minStock", { valueAsNumber: true })} />
                {form.formState.errors.minStock ? (
                  <p className="text-destructive text-xs">
                    {form.formState.errors.minStock.message}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" rows={3} {...form.register("description")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting || uploading}>
              {form.formState.isSubmitting ? "Guardando..." : isEditing ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    {canManageCatalog ? (
      <>
        <CatalogAddDialog
          open={addCategoryOpen}
          onOpenChange={setAddCategoryOpen}
          type="category"
          onSuccess={(item) => {
            onCategoryAdded(item);
            form.setValue("categoryId", item.id, { shouldValidate: true });
          }}
        />
        <CatalogAddDialog
          open={addBrandOpen}
          onOpenChange={setAddBrandOpen}
          type="brand"
          onSuccess={(item) => {
            onBrandAdded(item);
            form.setValue("brandId", item.id, { shouldValidate: true });
          }}
        />
        <CatalogEditDialog
          key={`form-edit-category-${selectedCategory?.id ?? "none"}-${editCategoryOpen}`}
          open={editCategoryOpen}
          onOpenChange={setEditCategoryOpen}
          type="category"
          item={selectedCategory}
          onUpdated={onCategoryUpdated}
          onDeleted={(id) => {
            onCategoryDeleted(id);
            if (categoryId === id) {
              form.setValue("categoryId", "", { shouldValidate: true });
            }
          }}
        />
        <CatalogEditDialog
          key={`form-edit-brand-${selectedBrand?.id ?? "none"}-${editBrandOpen}`}
          open={editBrandOpen}
          onOpenChange={setEditBrandOpen}
          type="brand"
          item={selectedBrand}
          onUpdated={onBrandUpdated}
          onDeleted={(id) => {
            onBrandDeleted(id);
            if (brandId === id) {
              form.setValue("brandId", "", { shouldValidate: true });
            }
          }}
        />
      </>
    ) : null}
    </>
  );
}
