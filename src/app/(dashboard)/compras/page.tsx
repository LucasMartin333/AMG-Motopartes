import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { getNavItemByPath } from "@/config/navigation";
import { notFound } from "next/navigation";

export default function ComprasPage() {
  const navItem = getNavItemByPath("/compras");
  if (!navItem) notFound();
  return <ModulePlaceholder module={navItem} />;
}
