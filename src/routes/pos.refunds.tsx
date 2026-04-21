import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { ComingSoon } from "@/components/shared/ComingSoon";

export const Route = createFileRoute("/pos/refunds")({
  component: () => (
    <AppShell allow={["ROLE_BRANCH_CASHIER"]}>
      <ComingSoon
        title="Refunds"
        description="Process and review refunds. Coming in Phase 2."
      />
    </AppShell>
  ),
});
