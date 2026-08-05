export type SupplierListItem = {
  id: string;
  name: string;
  contact: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  updatedAt: string;
  _count: { products: number };
};

export type SuppliersResponse = {
  items: SupplierListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type ProductSupplierLink = {
  id: string;
  supplierPrice: string;
  notes: string | null;
  updatedAt: string;
  createdAt: string;
  supplier: {
    id: string;
    name: string;
    contact: string | null;
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    address: string | null;
    updatedAt: string;
  };
};

export type SupplierOption = {
  id: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
};
