import { createFileRoute } from "@tanstack/react-router";
import { AppShell, roleLabel } from "@/components/layout/AppShell";
import { useAuthStore } from "@/stores/authStore";

export const Route = createFileRoute("/super-admin/dashboard")({
  component: () => (
    <AppShell allow={["ROLE_SUPER_ADMIN"]}>
      <DashboardHome />
    </AppShell>
  ),
});

function DashboardHome() {
  const { user, role } = useAuthStore();
  return (
    <div className="p-6">
      <h1 className="font-display text-3xl font-bold">Super Admin</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Welcome {user?.firstName ?? user?.email} — signed in as {role && roleLabel(role)}.
      </p>
      <div className="mt-8 rounded-xl border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Stores, users, and platform analytics will appear here in Phase 2.
        </p>
      </div>
    </div>
  );
}
