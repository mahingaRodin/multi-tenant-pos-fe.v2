import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuthStore } from "@/stores/authStore";
import { api, getApiErrorMessage } from "@/lib/api";
import type { StoreDto, PagedResponse, CustomerDto } from "@/lib/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Store,
  Users,
  Activity,
  ChevronRight,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { format } from "date-fns";

export const Route = createFileRoute("/super-admin/dashboard")({
  component: () => (
    <AppShell allow={["ROLE_SUPER_ADMIN"]}>
      <DashboardHome />
    </AppShell>
  ),
});

const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--destructive))"];

function DashboardHome() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [stores, setStores] = useState<StoreDto[]>([]);
  const [totalStores, setTotalStores] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [storeRes, customerRes] = await Promise.all([
          api.get<PagedResponse<StoreDto>>("/api/stores", { params: { page: 0, size: 100 } }),
          api.get<PagedResponse<CustomerDto>>("/api/customers", { params: { page: 0, size: 1 } }),
        ]);
        if (mounted) {
          const storeData = storeRes.data;
          setStores(Array.isArray(storeData?.content) ? storeData.content : []);
          setTotalStores(storeData?.totalElements ?? 0);
          setTotalCustomers(customerRes.data?.totalElements ?? 0);
        }
      } catch (err) {
        console.error(getApiErrorMessage(err));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, []);

  const activeCount = stores.filter((s) => s.status === "ACTIVE").length;
  const pendingCount = stores.filter((s) => s.status === "PENDING").length;
  const blockedCount = stores.filter((s) => s.status === "BLOCKED").length;

  const statusData = [
    { name: "Active", value: activeCount },
    { name: "Pending", value: pendingCount },
    { name: "Blocked", value: blockedCount },
  ].filter((d) => d.value > 0);

  const recentStores = [...stores]
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
    .slice(0, 5);

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

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <StatCard title="Total Stores" value={String(totalStores)} icon={Store} />
            <StatCard
              title="Active Stores"
              value={String(activeCount)}
              icon={ShieldCheck}
              trend={totalStores > 0 ? `${Math.round((activeCount / totalStores) * 100)}% of total` : undefined}
              trendUp={true}
            />
            <StatCard
              title="Pending / Blocked"
              value={`${pendingCount} / ${blockedCount}`}
              icon={ShieldAlert}
            />
            <StatCard title="Total Customers" value={String(totalCustomers)} icon={Users} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {/* Store Status Breakdown */}
            <div className="col-span-1 rounded-xl border bg-card p-6 shadow-sm">
              <h3 className="font-display text-lg font-bold mb-4">Store Status Breakdown</h3>
              {statusData.length > 0 ? (
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={4}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {statusData.map((_entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-10">No store data yet.</p>
              )}
            </div>

            {/* Stores by Type */}
            <div className="col-span-1 lg:col-span-1 xl:col-span-2 rounded-xl border bg-card p-6 shadow-sm">
              <h3 className="font-display text-lg font-bold mb-4">Stores by Type</h3>
              {stores.length > 0 ? (
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={Object.entries(
                        stores.reduce<Record<string, number>>((acc, s) => {
                          const type = s.storeType || "Unspecified";
                          acc[type] = (acc[type] || 0) + 1;
                          return acc;
                        }, {}),
                      ).map(([type, count]) => ({ type, count }))}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                      <XAxis
                        dataKey="type"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                        allowDecimals={false}
                      />
                      <Tooltip
                        cursor={{ fill: "hsl(var(--muted)/0.5)" }}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderRadius: "8px",
                          border: "1px solid hsl(var(--border))",
                        }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-10">No stores yet.</p>
              )}
            </div>

            {/* Recent Stores */}
            <div className="col-span-1 lg:col-span-2 xl:col-span-3 rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="p-6 border-b">
                <h3 className="font-display text-lg font-bold">Recently Registered Stores</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-6 py-4 font-medium">Brand</th>
                      <th className="px-6 py-4 font-medium">Admin</th>
                      <th className="px-6 py-4 font-medium">Type</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium">Registered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {recentStores.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                          No stores registered yet.
                        </td>
                      </tr>
                    ) : (
                      recentStores.map((store) => (
                        <tr key={store.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4 font-medium">{store.brand}</td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {store.storeAdmin
                              ? `${store.storeAdmin.firstName || ""} ${store.storeAdmin.lastName || ""} (${store.storeAdmin.email})`
                              : "-"}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs bg-muted px-2 py-0.5 rounded">
                              {store.storeType || "-"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge
                              variant={
                                store.status === "ACTIVE"
                                  ? "active"
                                  : store.status === "PENDING"
                                    ? "pending"
                                    : "danger"
                              }
                            >
                              {store.status || "ACTIVE"}
                            </StatusBadge>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Clock className="size-4" />
                              {store.createdAt
                                ? format(new Date(store.createdAt), "MMM d, yyyy")
                                : "-"}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
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
