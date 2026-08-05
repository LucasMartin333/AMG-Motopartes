import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Header } from "@/components/layout/header";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="bg-sidebar border-sidebar-border hidden w-64 shrink-0 border-r lg:block">
        <div className="border-sidebar-border border-b p-4">
          <h2 className="text-lg font-semibold">Inventario Motos</h2>
          <p className="text-muted-foreground text-xs">Gestión de repuestos</p>
        </div>
        <SidebarNav />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
