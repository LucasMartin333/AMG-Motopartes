import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { getNavItemByPath } from "@/config/navigation";
import { notFound } from "next/navigation";

export default function VentasPage() {
  const module = getNavItemByPath("/ventas");
  if (!module) notFound();
  return <ModulePlaceholder module={module} />;
}
