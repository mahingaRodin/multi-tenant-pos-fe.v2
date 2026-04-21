import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { ComingSoon } from "@/components/shared/ComingSoon";

export const Route = createFileRoute("/branch/dashboard")({
  component: () => (
    <AppShell allow={["ROLE_BRANCH_MANAGER"]}>
      <ComingSoon
        title="Branch Overview"
        description="Inventory, employees, shifts, and orders — coming in Phase 2."
      />
    </AppShell>
  ),
});
