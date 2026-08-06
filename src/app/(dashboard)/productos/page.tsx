"use client";

import { useState } from "react";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/layout/confirm-dialog";
import { ProductFormDialog } from "@/components/products/product-form-dialog";
import { ProductSuppliersSheet } from "@/components/products/product-suppliers-sheet";
import { ProductFilters } from "@/components/products/product-filters";
import { ProductsTable } from "@/components/products/products-table";
import { Button } from "@/components/ui/button";
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
const CATALOG_STALE_MS = 5 * 60 * 1000;

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
    staleTime: CATALOG_STALE_MS,
  });

  const { data: brands = [] } = useQuery<BrandOption[]>({
    queryKey: ["brands"],
    queryFn: async () => {
      const res = await fetch("/api/brands");
      if (!res.ok) throw new Error("Error al cargar marcas");
      return res.json();
    },
    staleTime: CATALOG_STALE_MS,
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
    staleTime: 30_000,
  });

  function invalidateProducts() {
    queryClient.invalidateQueries({ queryKey: ["products"] });
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleCategoryChange(value: string) {
    setCategoryId(value);
    setPage(1);
  }

  function handleBrandChange(value: string) {
    setBrandId(value);
    setPage(1);
  }

  function handleStockFilterChange(value: StockFilter) {
    setStockFilter(value);
    setPage(1);
  }

  function handleCategoryAdded(item: CategoryOption) {
    queryClient.setQueryData<CategoryOption[]>(["categories"], (prev = []) =>
      [...prev, item].sort((a, b) => a.name.localeCompare(b.name, "es")),
    );
  }

  function handleBrandAdded(item: BrandOption) {
    queryClient.setQueryData<BrandOption[]>(["brands"], (prev = []) =>
      [...prev, item].sort((a, b) => a.name.localeCompare(b.name, "es")),
    );
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

      <ProductFilters
        search={search}
        onSearchChange={handleSearchChange}
        categoryId={categoryId}
        brandId={brandId}
        stockFilter={stockFilter}
        categories={categories}
        brands={brands}
        canManageCatalog={canManage}
        onCategoryChange={handleCategoryChange}
        onBrandChange={handleBrandChange}
        onStockFilterChange={handleStockFilterChange}
        onCategoryAdded={handleCategoryAdded}
        onBrandAdded={handleBrandAdded}
      />

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
