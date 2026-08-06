export type LowStockProductSummary = {
  id: string;
  code: string;
  name: string;
  stock: number;
  minStock: number;
};

export type DashboardStats = {
  totalProducts: number;
  inventoryValue: number;
  lowStockCount: number;
  totalSuppliers: number;
  lowStockProducts: LowStockProductSummary[];
};
