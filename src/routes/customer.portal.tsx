import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { ComingSoon } from "@/components/shared/ComingSoon";

export const Route = createFileRoute("/customer/portal")({
  component: () => (
    <AppShell allow={["ROLE_CUSTOMER"]}>
      <ComingSoon
        title="Customer Portal"
        description="Browse the store catalog and view your orders. Coming in Phase 2."
      />
    </AppShell>
  ),
});
