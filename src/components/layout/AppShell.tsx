import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import {
  ShoppingBag,
  LayoutDashboard,
  Store,
  Users,
  Boxes,
  Package,
  Tags,
  BarChart3,
  GitBranch,
  ClipboardList,
  Receipt,
  RotateCcw,
  ScrollText,
  UserCircle,
  LogOut,
  Moon,
  Sun,
  Menu,
} from "lucide-react";

import { useAuthStore, dashboardPathFor } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";
import type { Role } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: typeof Store;
}

const NAV: Record<Role, NavItem[]> = {
  ROLE_SUPER_ADMIN: [
    { to: "/super-admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/super-admin/stores", label: "Stores", icon: Store },
    { to: "/super-admin/users", label: "Users", icon: Users },
  ],
  ROLE_STORE_ADMIN: [
    { to: "/store/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/store/branches", label: "Branches", icon: GitBranch },
    { to: "/store/products", label: "Products", icon: Package },
    { to: "/store/categories", label: "Categories", icon: Tags },
    { to: "/store/employees", label: "Employees", icon: Users },
    { to: "/store/analytics", label: "Analytics", icon: BarChart3 },
  ],
  ROLE_STORE_MANAGER: [
    { to: "/store/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/store/branches", label: "Branches", icon: GitBranch },
    { to: "/store/products", label: "Products", icon: Package },
    { to: "/store/categories", label: "Categories", icon: Tags },
    { to: "/store/employees", label: "Employees", icon: Users },
    { to: "/store/analytics", label: "Analytics", icon: BarChart3 },
  ],
  ROLE_BRANCH_MANAGER: [
    { to: "/branch/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/branch/inventory", label: "Inventory", icon: Boxes },
    { to: "/branch/employees", label: "Employees", icon: Users },
    { to: "/branch/shifts", label: "Shifts", icon: ClipboardList },
    { to: "/branch/orders", label: "Orders", icon: Receipt },
  ],
  ROLE_BRANCH_CASHIER: [
    { to: "/pos", label: "POS Terminal", icon: ShoppingBag },
    { to: "/pos/shift", label: "Shift Report", icon: ScrollText },
    { to: "/pos/refunds", label: "Refunds", icon: RotateCcw },
  ],
  ROLE_CUSTOMER: [
    { to: "/customer/portal", label: "Shop", icon: ShoppingBag },
    { to: "/customer/orders", label: "My Orders", icon: Receipt },
    { to: "/customer/profile", label: "Profile", icon: UserCircle },
  ],
};

interface AppShellProps {
  allow?: Role[]; // if set, only these roles can access
  children?: ReactNode;
}

export function AppShell({ allow, children }: AppShellProps) {
  const { token, role, user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar, theme, toggleTheme } = useUIStore();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!token) navigate({ to: "/login" });
  }, [token, navigate]);

  if (!token || !role) return null;

  if (allow && !allow.includes(role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="max-w-md text-center">
          <div className="font-display text-7xl font-bold text-destructive">403</div>
          <h1 className="mt-4 font-display text-2xl font-bold">Unauthorized</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your role ({roleLabel(role)}) does not have access to this page.
          </p>
          <Button className="mt-6" onClick={() => navigate({ to: dashboardPathFor(role) })}>
            Go to my dashboard
          </Button>
        </div>
      </div>
    );
  }

  const items = NAV[role];

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside
        className={cn(
          "flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-200",
          sidebarOpen ? "w-64" : "w-16",
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <ShoppingBag className="size-5" />
          </div>
          {sidebarOpen && <span className="font-display text-lg font-bold">RetailOS</span>}
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {items.map((item) => {
            const active = pathname === item.to || pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
                title={item.label}
              >
                <item.icon className="size-4 shrink-0" />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <button
            onClick={() => {
              logout();
              navigate({ to: "/login" });
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            title="Sign out"
          >
            <LogOut className="size-4 shrink-0" />
            {sidebarOpen && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-card px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={toggleSidebar}>
              <Menu className="size-4" />
            </Button>
            <div>
              <p className="text-xs text-muted-foreground">{roleLabel(role)}</p>
              <p className="text-sm font-medium">
                {user?.firstName ?? ""} {user?.lastName ?? user?.email ?? ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} title="Toggle theme">
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto">{children ?? <Outlet />}</main>
      </div>
    </div>
  );
}

export function roleLabel(role: Role): string {
  return (
    {
      ROLE_SUPER_ADMIN: "Super Admin",
      ROLE_STORE_ADMIN: "Store Admin",
      ROLE_STORE_MANAGER: "Store Manager",
      ROLE_BRANCH_MANAGER: "Branch Manager",
      ROLE_BRANCH_CASHIER: "Cashier",
      ROLE_CUSTOMER: "Customer",
    } as const
  )[role];
}
