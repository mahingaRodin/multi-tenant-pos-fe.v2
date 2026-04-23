import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useAuthStore } from "@/stores/authStore";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { Store, Package, Users, TrendingUp, DollarSign, ShoppingBag } from "lucide-react";
import { fmtMoney } from "@/lib/format";

export const Route = createFileRoute("/store/dashboard")({
  component: () => (
    <AppShell allow={["ROLE_STORE_ADMIN", "ROLE_STORE_MANAGER"]}>
      <StoreDashboard />
    </AppShell>
  ),
});

// Mock data for charts
const REVENUE_DATA = [
  { name: "Mon", revenue: 4000 },
  { name: "Tue", revenue: 3000 },
  { name: "Wed", revenue: 5000 },
  { name: "Thu", revenue: 2780 },
  { name: "Fri", revenue: 6890 },
  { name: "Sat", revenue: 8390 },
  { name: "Sun", revenue: 7490 },
];

const BRANCH_SALES_DATA = [
  { name: "Downtown", sales: 4000 },
  { name: "Westside", sales: 3000 },
  { name: "North Mall", sales: 2000 },
  { name: "Airport", sales: 2780 },
];

const TOP_PRODUCTS = [
  { name: "Wireless Earbuds", sales: 450 },
  { name: "Smart Watch V2", sales: 380 },
  { name: "Phone Case", sales: 300 },
  { name: "USB-C Cable", sales: 280 },
  { name: "Power Bank", sales: 210 },
];

function StoreDashboard() {
  const { user } = useAuthStore();

  return (
    <div className="flex h-full flex-col overflow-auto bg-muted/20 p-6">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Store Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back, {user?.firstName || user?.email}. Here's what's happening at your store
          today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total Revenue"
          value={fmtMoney(37550)}
          icon={DollarSign}
          trend="+12.5%"
          trendUp={true}
        />
        <StatCard
          title="Total Orders"
          value="1,240"
          icon={ShoppingBag}
          trend="+8.2%"
          trendUp={true}
        />
        <StatCard title="Active Branches" value="4" icon={Store} />
        <StatCard title="Total Products" value="342" icon={Package} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {/* Revenue Chart */}
        <div className="col-span-1 lg:col-span-2 xl:col-span-2 rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-bold">Revenue Over Time</h3>
            <TrendingUp className="size-5 text-muted-foreground" />
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={REVENUE_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                  }}
                  formatter={(value) => [fmtMoney(Number(value)), "Revenue"]}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "hsl(var(--primary))" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="col-span-1 rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-bold">Top Products</h3>
            <Package className="size-5 text-muted-foreground" />
          </div>
          <div className="space-y-4">
            {TOP_PRODUCTS.map((product, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded bg-primary/10 font-bold text-primary text-xs">
                    #{index + 1}
                  </div>
                  <span className="text-sm font-medium">{product.name}</span>
                </div>
                <span className="text-sm font-bold">{product.sales} sold</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sales by Branch */}
        <div className="col-span-1 lg:col-span-2 xl:col-span-3 rounded-xl border bg-card p-6 shadow-sm mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-bold">Sales by Branch</h3>
            <Store className="size-5 text-muted-foreground" />
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={BRANCH_SALES_DATA}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted)/0.5)" }}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                  }}
                  formatter={(value) => [fmtMoney(Number(value)), "Sales"]}
                />
                <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
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
      <div className="mt-4 flex items-baseline gap-2">
        <span className="font-display text-3xl font-bold">{value}</span>
        {trend && (
          <span className={`text-xs font-medium ${trendUp ? "text-green-500" : "text-red-500"}`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
