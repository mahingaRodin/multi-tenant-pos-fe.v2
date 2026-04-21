import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { ComingSoon } from "@/components/shared/ComingSoon";

export const Route = createFileRoute("/store/dashboard")({
  component: () => (
    <AppShell allow={["ROLE_STORE_ADMIN", "ROLE_STORE_MANAGER"]}>
      <ComingSoon
        title="Store Dashboard"
        description="Branches, products, employees, and analytics — coming in Phase 2."
      />
    </AppShell>
  ),
});
