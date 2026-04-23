import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useAuthStore, dashboardPathFor } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Store, BarChart3, Users } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { token, role } = useAuthStore();
  if (token) return <Navigate to={dashboardPathFor(role)} />;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShoppingBag className="size-5" />
            </div>
            <span className="font-display text-xl font-bold">RetailOS</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent-foreground">
            Multi-tenant Point of Sale
          </span>
          <h1 className="mt-6 font-display text-5xl font-bold leading-tight md:text-6xl">
            Run your retail. <span className="text-accent">Everywhere.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            One platform for stores, branches, cashiers, and customers — with a fast POS terminal,
            real-time inventory, and shift-level reporting.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button size="lg" asChild>
              <Link to="/login">Open POS</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/signup">Create account</Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-20 grid max-w-5xl gap-6 md:grid-cols-3">
          {[
            {
              icon: Store,
              title: "Multi-store",
              body: "Manage tenants and branches from one console.",
            },
            {
              icon: BarChart3,
              title: "Live analytics",
              body: "Sales, shifts, and top products in real time.",
            },
            {
              icon: Users,
              title: "Role-based",
              body: "Admins, managers, cashiers, and customers.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border bg-card p-6 shadow-sm">
              <f.icon className="size-6 text-accent" />
              <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
