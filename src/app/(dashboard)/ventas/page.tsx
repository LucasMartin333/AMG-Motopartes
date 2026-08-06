import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { getNavItemByPath } from "@/config/navigation";
import { notFound } from "next/navigation";

export default function VentasPage() {
  const navItem = getNavItemByPath("/ventas");
  if (!navItem) notFound();
  return <ModulePlaceholder module={navItem} />;
}
