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
  Menu,
  Settings,
  HelpCircle,
  Heart,
  ShoppingCart,
  Briefcase,
} from "lucide-react";

import { BrandLogo } from "@/components/brand/BrandLogo";
import { useAuthStore, dashboardPathFor } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";
import type { Role } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

interface NavItem {
  to: string;
  label: string;
  icon: typeof Store;
}

const NAV: Record<Role, NavItem[]> = {
  ROLE_SUPER_ADMIN: [
    { to: "/super-admin/dashboard", label: "Dashboard",  icon: LayoutDashboard },
    { to: "/super-admin/stores",    label: "Stores",     icon: Store },
    { to: "/super-admin/businesses", label: "Businesses", icon: Briefcase },
    { to: "/super-admin/orders",    label: "Orders",     icon: Receipt },
    { to: "/super-admin/users",     label: "Users",      icon: Users },
    { to: "/super-admin/analytics", label: "Analytics",  icon: BarChart3 },
    { to: "/super-admin/settings",  label: "Settings",   icon: Settings },
    { to: "/profile", label: "Profile", icon: UserCircle },
  ],
  ROLE_STORE_ADMIN: [
    { to: "/store/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/store/branches", label: "Branches", icon: GitBranch },
    { to: "/store/products", label: "Products", icon: Package },
    { to: "/store/categories", label: "Categories", icon: Tags },
    { to: "/store/employees", label: "Employees", icon: Users },
    { to: "/store/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/profile", label: "Profile", icon: UserCircle },
  ],
  ROLE_STORE_MANAGER: [
    { to: "/store/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/store/branches", label: "Branches", icon: GitBranch },
    { to: "/store/products", label: "Products", icon: Package },
    { to: "/store/categories", label: "Categories", icon: Tags },
    { to: "/store/employees", label: "Employees", icon: Users },
    { to: "/store/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/profile", label: "Profile", icon: UserCircle },
  ],
  ROLE_BRANCH_MANAGER: [
    { to: "/branch/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/branch/inventory", label: "Inventory", icon: Boxes },
    { to: "/branch/employees", label: "Employees", icon: Users },
    { to: "/branch/shifts", label: "Shifts", icon: ClipboardList },
    { to: "/branch/orders", label: "Orders", icon: Receipt },
    { to: "/branch/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/profile", label: "Profile", icon: UserCircle },
  ],
  ROLE_BRANCH_CASHIER: [
    { to: "/pos", label: "POS Terminal", icon: ShoppingBag },
    { to: "/pos/shift", label: "Shift Report", icon: ScrollText },
    { to: "/pos/refunds", label: "Refunds", icon: RotateCcw },
    { to: "/profile", label: "Profile", icon: UserCircle },
  ],
  ROLE_CUSTOMER: [
    { to: "/customer/portal", label: "Shop", icon: ShoppingBag },
    { to: "/customer/favorites", label: "Favorites", icon: Heart },
    { to: "/customer/cart", label: "Cart", icon: ShoppingCart },
    { to: "/customer/orders", label: "My Orders", icon: Receipt },
    { to: "/profile", label: "Profile", icon: UserCircle },
  ],
};

interface AppShellProps {
  allow?: Role[]; // if set, only these roles can access
  children?: ReactNode;
}

export function AppShell({ allow, children }: AppShellProps) {
  const { token, role, user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();
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

  const showNewSale = role === "ROLE_BRANCH_CASHIER";
  const userInitials =
    ((user?.firstName?.[0] ?? "") + (user?.lastName?.[0] ?? "")).toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "U";

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <aside
        className={cn(
          "sticky top-0 flex h-screen shrink-0 flex-col overflow-hidden",
          sidebarOpen ? "w-[220px]" : "w-16",
        )}
        style={{ background: "#0F172A" }}
      >
        {/* Logo */}
        <div className={cn("flex items-center gap-2 px-5 h-16 shrink-0", !sidebarOpen && "justify-center px-0")}>
          <BrandLogo to={false} wordmark={false} size="sm" />
          {sidebarOpen && (
            <div>
              <div className="text-white text-sm font-bold leading-none">POSify</div>
              <div className="text-slate-400 text-[10px] leading-none mt-0.5">{user?.firstName ? `${user.firstName}'s Branch` : roleLabel(role)}</div>
            </div>
          )}
        </div>

        {/* New Sale CTA */}
        {showNewSale && sidebarOpen && (
          <div className="px-4 pb-3">
            <Link
              to="/pos"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-bold text-white transition-colors"
              style={{ background: 'var(--primary)' }}
            >
              <span className="text-lg leading-none font-bold">+</span>
              New Sale
            </Link>
          </div>
        )}

        {/* Nav Items */}
        <nav className="min-h-0 flex-1 overflow-hidden py-2">
          {items.map((item) => {
            const active = pathname === item.to || pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                title={item.label}
                className={cn(
                  "flex items-center gap-3 py-2.5 text-sm font-medium transition-all duration-150 border-l-4",
                  sidebarOpen ? "px-5" : "px-0 justify-center",
                  active
                    ? "border-primary bg-white/5 text-white"
                    : "border-transparent text-slate-400 hover:text-white hover:bg-white/5",
                )}
              >
                <item.icon className="size-[18px] shrink-0" />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-800 py-3">
          <button
            onClick={() => navigate({ to: dashboardPathFor(role) })}
            className={cn(
              "flex items-center gap-3 w-full py-2 text-slate-400 hover:text-white transition-colors text-sm",
              sidebarOpen ? "px-5" : "px-0 justify-center",
            )}
            title="Help Center"
          >
            <HelpCircle className="size-4 shrink-0" />
            {sidebarOpen && <span>Help Center</span>}
          </button>
          <button
            onClick={() => { logout(); navigate({ to: "/login" }); }}
            className={cn(
              "flex items-center gap-3 w-full py-2 text-slate-400 hover:text-white transition-colors text-sm",
              sidebarOpen ? "px-5" : "px-0 justify-center",
            )}
            title="Logout"
          >
            <LogOut className="size-4 shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6 shrink-0">
          <div className="flex items-center gap-3 flex-1">
            <button onClick={toggleSidebar} className="text-slate-400 hover:text-slate-600 transition-colors mr-1">
              <Menu className="size-5" />
            </button>
            <div className="relative flex-1 max-w-md">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-2 bg-muted rounded-lg text-sm border border-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:bg-card"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            {/* Register Status badge (super admin) */}
            {role === "ROLE_SUPER_ADMIN" && (
              <button className="hidden sm:flex border border-primary text-primary text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-colors">
                Register Status
              </button>
            )}
            {/* Bell */}
            <button className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors relative">
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            {/* Theme toggle */}
            <ThemeToggle />
            <Link
              to="/profile"
              className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold ml-1 overflow-hidden"
            >
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt="" className="size-full object-cover" />
              ) : (
                userInitials
              )}
            </Link>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto bg-background">{children ?? <Outlet />}</main>
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
