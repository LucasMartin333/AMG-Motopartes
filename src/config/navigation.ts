import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowLeftRight,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  Users,
  Wrench,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  description: string;
};

export type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

export const navigationGroups: NavGroup[] = [
  {
    id: "general",
    label: "General",
    items: [
      {
        href: "/",
        label: "Principal",
        icon: LayoutDashboard,
        description: "Resumen del inventario y accesos rápidos",
      },
    ],
  },
  {
    id: "inventario",
    label: "Inventario",
    items: [
      {
        href: "/productos",
        label: "Productos",
        icon: Package,
        description: "Catálogo de repuestos, stock y precios",
      },
      {
        href: "/proveedores",
        label: "Proveedores",
        icon: Truck,
        description: "Contactos y precios mayoristas",
      },
      {
        href: "/alertas",
        label: "Alertas",
        icon: AlertTriangle,
        description: "Productos con stock bajo el mínimo",
      },
    ],
  },
  {
    id: "operaciones",
    label: "Operaciones",
    items: [
      {
        href: "/compras",
        label: "Compras",
        icon: ShoppingCart,
        description: "Ingresos de mercadería y actualización de stock",
      },
      {
        href: "/ventas",
        label: "Ventas",
        icon: Wrench,
        description: "Salidas de repuestos y registro de ventas",
      },
      {
        href: "/movimientos",
        label: "Movimientos",
        icon: ArrowLeftRight,
        description: "Historial de cambios de stock",
      },
    ],
  },
  {
    id: "administracion",
    label: "Administración",
    items: [
      {
        href: "/usuarios",
        label: "Usuarios",
        icon: Users,
        adminOnly: true,
        description: "Gestión de cuentas y roles del equipo",
      },
    ],
  },
];

export const allNavItems = navigationGroups.flatMap((group) => group.items);

export function getNavItemByPath(pathname: string): NavItem | undefined {
  if (pathname === "/") {
    return allNavItems.find((item) => item.href === "/");
  }
  return allNavItems.find(
    (item) => item.href !== "/" && pathname.startsWith(item.href),
  );
}
