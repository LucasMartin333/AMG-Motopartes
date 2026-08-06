import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { getNavItemByPath } from "@/config/navigation";
import { notFound } from "next/navigation";

export default function AlertasPage() {
  const navItem = getNavItemByPath("/alertas");
  if (!navItem) notFound();
  return <ModulePlaceholder module={navItem} />;
}
