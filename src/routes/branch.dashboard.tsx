import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/branch/dashboard")({
  component: () => (
    <AppShell allow={["ROLE_BRANCH_MANAGER"]}>
      <div className="p-6">
        <h1 className="font-display text-2xl font-bold">Branch overview</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage inventory, cashiers, shifts, and orders for this location.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild><Link to="/branch/inventory">Inventory</Link></Button>
          <Button asChild variant="outline"><Link to="/branch/employees">Cashiers</Link></Button>
          <Button asChild variant="outline"><Link to="/branch/shifts">Shifts</Link></Button>
          <Button asChild variant="outline"><Link to="/branch/orders">Orders</Link></Button>
        </div>
      </div>
    </AppShell>
  ),
});
