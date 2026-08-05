export type ProductListItem = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  stock: number;
  minStock: number;
  salePrice: string;
  category: { id: string; name: string };
  brand: { id: string; name: string };
};

export type ProductsResponse = {
  items: ProductListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type CategoryOption = { id: string; name: string };
export type BrandOption = { id: string; name: string };

export type StockFilter = "all" | "critical" | "ok";
