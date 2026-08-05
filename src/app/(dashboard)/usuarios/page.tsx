import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { getNavItemByPath } from "@/config/navigation";
import { notFound } from "next/navigation";

export default function UsuariosPage() {
  const module = getNavItemByPath("/usuarios");
  if (!module) notFound();
  return <ModulePlaceholder module={module} />;
}
