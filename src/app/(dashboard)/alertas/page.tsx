import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { getNavItemByPath } from "@/config/navigation";
import { notFound } from "next/navigation";

export default function AlertasPage() {
  const module = getNavItemByPath("/alertas");
  if (!module) notFound();
  return <ModulePlaceholder module={module} />;
}
