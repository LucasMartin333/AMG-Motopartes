import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { getNavItemByPath } from "@/config/navigation";
import { notFound } from "next/navigation";

export default function ComprasPage() {
  const module = getNavItemByPath("/compras");
  if (!module) notFound();
  return <ModulePlaceholder module={module} />;
}
