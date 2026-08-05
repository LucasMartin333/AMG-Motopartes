"use client";

import { useState } from "react";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/layout/confirm-dialog";
import { ProductFormDialog } from "@/components/products/product-form-dialog";
import { ProductSuppliersSheet } from "@/components/products/product-suppliers-sheet";
import { ProductsTable } from "@/components/products/products-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";
import { canManageProducts } from "@/lib/permissions";
import type {
  BrandOption,
  CategoryOption,
  ProductListItem,
  ProductsResponse,
  StockFilter,
} from "@/types/products";

const PAGE_SIZE = 25;

async function fetchProducts(params: URLSearchParams): Promise<ProductsResponse> {
  const res = await fetch(`/api/products?${params.toString()}`);
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.error ?? "Error al cargar productos");
  }
  return res.json();
}

export default function ProductosPage() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const canManage = canManageProducts(session?.user);

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [suppliersProduct, setSuppliersProduct] = useState<ProductListItem | null>(null);
  const [suppliersOpen, setSuppliersOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const { data: categories = [] } = useQuery<CategoryOption[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Error al cargar categorías");
      return res.json();
    },
  });

  const { data: brands = [] } = useQuery<BrandOption[]>({
    queryKey: ["brands"],
    queryFn: async () => {
      const res = await fetch("/api/brands");
      if (!res.ok) throw new Error("Error al cargar marcas");
      return res.json();
    },
  });

  const queryParams = new URLSearchParams({
    page: String(page),
    pageSize: String(PAGE_SIZE),
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(categoryId && { categoryId }),
    ...(brandId && { brandId }),
    ...(stockFilter !== "all" && { stockFilter }),
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["products", debouncedSearch, categoryId, brandId, stockFilter, page],
    queryFn: () => fetchProducts(queryParams),
    placeholderData: keepPreviousData,
  });

  function invalidateProducts() {
    queryClient.invalidateQueries({ queryKey: ["products"] });
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleFilterChange(
    type: "category" | "brand" | "stock",
    value: string,
  ) {
    if (type === "category") setCategoryId(value === "all" ? "" : value);
    if (type === "brand") setBrandId(value === "all" ? "" : value);
    if (type === "stock") setStockFilter(value as StockFilter);
    setPage(1);
  }

  function openCreate() {
    setEditingProduct(null);
    setFormOpen(true);
  }

  function openEdit(product: ProductListItem) {
    setEditingProduct(product);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${deleteTarget.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al eliminar");
      toast.success("Producto eliminado");
      setDeleteTarget(null);
      invalidateProducts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Productos"
        description="Catálogo de repuestos con stock, precios e imágenes"
      >
        {canManage ? (
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Nuevo producto
          </Button>
        ) : null}
      </PageHeader>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="Buscar por código o nombre..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Select
            value={categoryId || "all"}
            onValueChange={(v) => handleFilterChange("category", v ?? "all")}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={brandId || "all"}
            onValueChange={(v) => handleFilterChange("brand", v ?? "all")}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Marca" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las marcas</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand.id} value={brand.id}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={stockFilter}
            onValueChange={(v) => handleFilterChange("stock", v ?? "all")}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo el stock</SelectItem>
              <SelectItem value="critical">Stock crítico</SelectItem>
              <SelectItem value="ok">Stock OK</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ProductsTable
        data={data?.items ?? []}
        loading={isLoading || isFetching}
        canManage={canManage}
        page={page}
        pageSize={PAGE_SIZE}
        totalPages={data?.totalPages ?? 1}
        total={data?.total ?? 0}
        onPageChange={setPage}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
        onViewSuppliers={(product) => {
          setSuppliersProduct(product);
          setSuppliersOpen(true);
        }}
      />

      <ProductSuppliersSheet
        product={suppliersProduct}
        open={suppliersOpen}
        onOpenChange={setSuppliersOpen}
        canManage={canManage}
      />

      {canManage ? (
        <>
          <ProductFormDialog
            open={formOpen}
            onOpenChange={setFormOpen}
            product={editingProduct}
            categories={categories}
            brands={brands}
            onSuccess={invalidateProducts}
          />

          <ConfirmDialog
            open={!!deleteTarget}
            onOpenChange={(open) => !open && setDeleteTarget(null)}
            title="Eliminar producto"
            description={
              deleteTarget
                ? `¿Eliminar "${deleteTarget.name}" (${deleteTarget.code})? Esta acción no se puede deshacer.`
                : undefined
            }
            confirmLabel="Eliminar"
            loading={deleting}
            onConfirm={confirmDelete}
          />
        </>
      ) : null}
    </div>
  );
}
