import type { StockFilter } from "@/types/products";

export const STOCK_FILTER_OPTIONS: { value: StockFilter; label: string }[] = [
  { value: "all", label: "Todo el stock" },
  { value: "critical", label: "Stock crítico" },
  { value: "ok", label: "Stock OK" },
];

export function getStockFilterLabel(value: StockFilter) {
  return STOCK_FILTER_OPTIONS.find((o) => o.value === value)?.label ?? "Todo el stock";
}

export function getCategoryFilterLabel(
  categoryId: string,
  categories: { id: string; name: string }[],
) {
  if (!categoryId) return "Todas las categorías";
  return categories.find((c) => c.id === categoryId)?.name ?? "Todas las categorías";
}

export function getBrandFilterLabel(
  brandId: string,
  brands: { id: string; name: string }[],
) {
  if (!brandId) return "Todas las marcas";
  return brands.find((b) => b.id === brandId)?.name ?? "Todas las marcas";
}
