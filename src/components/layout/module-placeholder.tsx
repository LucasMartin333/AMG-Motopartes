import { PageHeader, EmptyState } from "@/components/layout/page-header";
import type { NavItem } from "@/config/navigation";

export function ModulePlaceholder({ module }: { module: NavItem }) {
  const Icon = module.icon;

  return (
    <div className="space-y-6">
      <PageHeader title={module.label} description={module.description} />

      <EmptyState
        title="Este módulo estará disponible próximamente"
        description="Mientras tanto, podés seguir usando el resto de las funciones del inventario."
        action={
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Icon className="size-4" />
            <span>Próximamente</span>
          </div>
        }
      />
    </div>
  );
}
