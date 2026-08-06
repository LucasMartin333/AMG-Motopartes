import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { getNavItemByPath } from "@/config/navigation";
import { notFound } from "next/navigation";

export default function MovimientosPage() {
  const navItem = getNavItemByPath("/movimientos");
  if (!navItem) notFound();
  return <ModulePlaceholder module={navItem} />;
}
