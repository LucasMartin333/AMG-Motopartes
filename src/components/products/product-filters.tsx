"use client";

import { useState } from "react";
import { Pencil, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { CatalogAddDialog } from "@/components/products/catalog-add-dialog";
import { CatalogEditDialog } from "@/components/products/catalog-edit-dialog";
import {
  getBrandFilterLabel,
  getCategoryFilterLabel,
  getStockFilterLabel,
  STOCK_FILTER_OPTIONS,
} from "@/lib/product-filters";
import type { BrandOption, CategoryOption, StockFilter } from "@/types/products";

type ProductFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  categoryId: string;
  brandId: string;
  stockFilter: StockFilter;
  categories: CategoryOption[];
  brands: BrandOption[];
  canManageCatalog?: boolean;
  onCategoryChange: (categoryId: string) => void;
  onBrandChange: (brandId: string) => void;
  onStockFilterChange: (value: StockFilter) => void;
  onCategoryAdded: (item: CategoryOption) => void;
  onBrandAdded: (item: BrandOption) => void;
  onCategoryUpdated: (item: CategoryOption) => void;
  onBrandUpdated: (item: BrandOption) => void;
  onCategoryDeleted: (id: string) => void;
  onBrandDeleted: (id: string) => void;
};

export function ProductFilters({
  search,
  onSearchChange,
  categoryId,
  brandId,
  stockFilter,
  categories,
  brands,
  canManageCatalog,
  onCategoryChange,
  onBrandChange,
  onStockFilterChange,
  onCategoryAdded,
  onBrandAdded,
  onCategoryUpdated,
  onBrandUpdated,
  onCategoryDeleted,
  onBrandDeleted,
}: ProductFiltersProps) {
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [addBrandOpen, setAddBrandOpen] = useState(false);
  const [editCategoryOpen, setEditCategoryOpen] = useState(false);
  const [editBrandOpen, setEditBrandOpen] = useState(false);

  const selectedCategory = categories.find((c) => c.id === categoryId) ?? null;
  const selectedBrand = brands.find((b) => b.id === brandId) ?? null;

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="relative flex-1">
          <Label htmlFor="product-search" className="mb-1.5 block text-xs font-medium">
            Buscar
          </Label>
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              id="product-search"
              placeholder="Código o nombre..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs font-medium">Categoría</Label>
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
              value={categoryId || "all"}
              onValueChange={(v) => onCategoryChange(v === "all" ? "" : (v ?? ""))}
            >
              <SelectTrigger className="w-full">
                <span className="truncate">
                  {getCategoryFilterLabel(categoryId, categories)}
                </span>
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
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs font-medium">Marca</Label>
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
              value={brandId || "all"}
              onValueChange={(v) => onBrandChange(v === "all" ? "" : (v ?? ""))}
            >
              <SelectTrigger className="w-full">
                <span className="truncate">{getBrandFilterLabel(brandId, brands)}</span>
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
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Stock</Label>
            <Select
              value={stockFilter}
              onValueChange={(v) => onStockFilterChange((v ?? "all") as StockFilter)}
            >
              <SelectTrigger className="w-full">
                <span className="truncate">{getStockFilterLabel(stockFilter)}</span>
              </SelectTrigger>
              <SelectContent>
                {STOCK_FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <CatalogAddDialog
        open={addCategoryOpen}
        onOpenChange={setAddCategoryOpen}
        type="category"
        onSuccess={(item) => {
          onCategoryAdded(item);
          onCategoryChange(item.id);
        }}
      />

      <CatalogAddDialog
        open={addBrandOpen}
        onOpenChange={setAddBrandOpen}
        type="brand"
        onSuccess={(item) => {
          onBrandAdded(item);
          onBrandChange(item.id);
        }}
      />

      <CatalogEditDialog
        key={`edit-category-${selectedCategory?.id ?? "none"}-${editCategoryOpen}`}
        open={editCategoryOpen}
        onOpenChange={setEditCategoryOpen}
        type="category"
        item={selectedCategory}
        onUpdated={onCategoryUpdated}
        onDeleted={(id) => {
          onCategoryDeleted(id);
          if (categoryId === id) onCategoryChange("");
        }}
      />

      <CatalogEditDialog
        key={`edit-brand-${selectedBrand?.id ?? "none"}-${editBrandOpen}`}
        open={editBrandOpen}
        onOpenChange={setEditBrandOpen}
        type="brand"
        item={selectedBrand}
        onUpdated={onBrandUpdated}
        onDeleted={(id) => {
          onBrandDeleted(id);
          if (brandId === id) onBrandChange("");
        }}
      />
    </>
  );
}
