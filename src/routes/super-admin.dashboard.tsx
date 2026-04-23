import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useAuthStore } from "@/stores/authStore";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Store, Users, Activity, CreditCard, ChevronRight } from "lucide-react";
import { fmtMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/super-admin/dashboard")({
  component: () => (
    <AppShell allow={["ROLE_SUPER_ADMIN"]}>
      <DashboardHome />
    </AppShell>
  ),
});

// Mock data for Super Admin platform analytics
const PLATFORM_GROWTH = [
  { month: "Jan", stores: 12, revenue: 15000 },
  { month: "Feb", stores: 15, revenue: 22000 },
  { month: "Mar", stores: 22, revenue: 35000 },
  { month: "Apr", stores: 28, revenue: 48000 },
  { month: "May", stores: 35, revenue: 62000 },
  { month: "Jun", stores: 48, revenue: 85000 },
];

const REVENUE_BY_STORE = [
  { name: "MegaMart", value: 35000 },
  { name: "Downtown Groceries", value: 22000 },
  { name: "Tech Haven", value: 18000 },
  { name: "Fashion Boutique", value: 15000 },
  { name: "Local Pharmacy", value: 9000 },
];

function DashboardHome() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col overflow-auto bg-muted/20 p-6">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Platform Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome back, {user?.firstName || "Super Admin"}. Here is the current state of the
            platform.
          </p>
        </div>
        <Button onClick={() => navigate({ to: "/super-admin/stores" })}>
          Manage Stores <ChevronRight className="ml-2 size-4" />
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total Platform Revenue"
          value={fmtMoney(258000)}
          icon={CreditCard}
          trend="+24.5% vs last month"
          trendUp={true}
        />
        <StatCard
          title="Active Stores"
          value="48"
          icon={Store}
          trend="+13 this month"
          trendUp={true}
        />
        <StatCard
          title="Total Users"
          value="1,240"
          icon={Users}
          trend="+184 this month"
          trendUp={true}
        />
        <StatCard
          title="Platform Uptime"
          value="99.99%"
          icon={Activity}
          trend="All systems operational"
          trendUp={true}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {/* Platform Growth Chart */}
        <div className="col-span-1 lg:col-span-2 xl:col-span-2 rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="font-display text-lg font-bold">Platform Growth (Stores & Revenue)</h3>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={PLATFORM_GROWTH} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  dy={10}
                />
                <YAxis
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(val) => `$${val / 1000}k`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                  }}
                  formatter={(value: number, name: string) => [
                    name === "revenue" ? fmtMoney(value) : value,
                    name === "revenue" ? "Revenue" : "Stores",
                  ]}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  strokeWidth={2}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="stores"
                  stroke="hsl(var(--accent))"
                  fillOpacity={0}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Stores by Revenue */}
        <div className="col-span-1 rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="font-display text-lg font-bold">Top Stores by Revenue</h3>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={REVENUE_BY_STORE}
                layout="vertical"
                margin={{ top: 0, right: 0, left: 30, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={true}
                  vertical={false}
                  stroke="hsl(var(--muted))"
                />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(val) => `$${val / 1000}k`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }}
                  dx={-10}
                  width={100}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted)/0.5)" }}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                  }}
                  formatter={(value: number) => [fmtMoney(value), "Revenue"]}
                />
                <Bar
                  dataKey="value"
                  fill="hsl(var(--primary))"
                  radius={[0, 4, 4, 0]}
                  barSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, trendUp }: any) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
          <Icon className="size-5 text-primary" />
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-1">
        <span className="font-display text-3xl font-bold">{value}</span>
        {trend && (
          <span
            className={`text-xs font-medium ${trendUp ? "text-green-500" : "text-muted-foreground"}`}
          >
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
