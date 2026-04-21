import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { ComingSoon } from "@/components/shared/ComingSoon";

export const Route = createFileRoute("/pos/shift")({
  component: () => (
    <AppShell allow={["ROLE_BRANCH_CASHIER"]}>
      <ComingSoon
        title="Shift Report"
        description="Full shift breakdown, hourly sales chart, and order history will be available in Phase 2."
      />
    </AppShell>
  ),
});
