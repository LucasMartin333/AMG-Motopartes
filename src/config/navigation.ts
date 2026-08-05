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
  phase: number;
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
        label: "Dashboard",
        icon: LayoutDashboard,
        description: "Resumen y accesos rápidos al sistema",
        phase: 1,
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
        phase: 2,
      },
      {
        href: "/proveedores",
        label: "Proveedores",
        icon: Truck,
        description: "Contactos y precios mayoristas",
        phase: 2,
      },
      {
        href: "/alertas",
        label: "Alertas",
        icon: AlertTriangle,
        description: "Productos con stock bajo el mínimo",
        phase: 2,
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
        phase: 3,
      },
      {
        href: "/ventas",
        label: "Ventas",
        icon: Wrench,
        description: "Salidas de repuestos y registro de ventas",
        phase: 3,
      },
      {
        href: "/movimientos",
        label: "Movimientos",
        icon: ArrowLeftRight,
        description: "Historial de cambios de stock",
        phase: 3,
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
        phase: 2,
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
