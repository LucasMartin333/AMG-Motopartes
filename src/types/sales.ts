export type SaleListItem = {
  id: string;
  total: string;
  notes: string | null;
  createdAt: string;
  itemCount: number;
  user: {
    id: string;
    name: string;
  };
};

export type SalesResponse = {
  items: SaleListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type SaleDetailItem = {
  id: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
  product: {
    id: string;
    code: string;
    name: string;
  };
};

export type SaleDetail = {
  id: string;
  total: string;
  notes: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  items: SaleDetailItem[];
};

export type SaleCartLine = {
  productId: string;
  code: string;
  name: string;
  stock: number;
  quantity: number;
  unitPrice: number;
  priceLocked: boolean;
};
