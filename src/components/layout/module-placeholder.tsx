import { Construction } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import type { NavItem } from "@/config/navigation";

export function ModulePlaceholder({ module }: { module: NavItem }) {
  const Icon = module.icon;

  return (
    <div className="space-y-6">
      <PageHeader
        title={module.label}
        description={module.description}
      >
        <Badge variant="secondary">Fase {module.phase}</Badge>
      </PageHeader>

      <EmptyState
        title="Módulo en construcción"
        description="La base del sistema ya está lista. Este módulo se implementará en los siguientes pasos del plan."
        action={
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Icon className="size-4" />
            <Construction className="size-4" />
            <span>Próximamente disponible</span>
          </div>
        }
      />
    </div>
  );
}
