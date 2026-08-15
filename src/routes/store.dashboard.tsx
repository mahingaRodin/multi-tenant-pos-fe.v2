import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Package, Store, ShoppingBag, DollarSign } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { AnimatedBarChart, AnimatedLineChart } from "@/components/charts/AnimatedCharts";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import type { AnalyticsSummary } from "@/lib/types";
import { fmtMoney } from "@/lib/format";

export const Route = createFileRoute("/store/dashboard")({
  component: () => (
    <AppShell allow={["ROLE_STORE_ADMIN", "ROLE_STORE_MANAGER"]}>
      <StoreDashboard />
    </AppShell>
  ),
});

function StoreDashboard() {
  const { user, storeId } = useAuthStore();
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get<AnalyticsSummary>(`/api/analytics/store/${storeId}`);
        if (mounted) setData(res.data);
      } catch (e) {
        toast.error(getApiErrorMessage(e));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [storeId]);

  const daily = (data?.daily ?? []).map((d) => ({ name: d.day.slice(5), revenue: d.revenue }));
  const branches = (data?.byBranch ?? []).map((b) => ({ name: b.name, sales: b.value }));

  return (
    <div className="flex h-full flex-col bg-muted/20 p-6">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Store Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back, {user?.firstName || user?.email}. Figures below are live sales from this store.
        </p>
      </div>
      {loading ? (
        <div className="flex h-60 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Revenue" value={fmtMoney(data?.revenue)} icon={DollarSign} />
            <StatCard title="Total Orders" value={String(data?.orderCount ?? 0)} icon={ShoppingBag} />
            <StatCard title="Active Branches" value={String(data?.branchCount ?? 0)} icon={Store} />
            <StatCard title="Total Products" value={String(data?.productCount ?? 0)} icon={Package} />
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
            <div className="col-span-1 rounded-xl border bg-card p-6 shadow-sm lg:col-span-2 xl:col-span-2">
              <h3 className="mb-4 font-display text-lg font-bold">Revenue over time</h3>
              <div className="h-[300px] w-full">
                <AnimatedLineChart data={daily.length ? daily : [{ name: "—", revenue: 0 }]} xKey="name" yKey="revenue" />
              </div>
            </div>
            <div className="col-span-1 rounded-xl border bg-card p-6 shadow-sm">
              <h3 className="mb-4 font-display text-lg font-bold">Top products</h3>
              <div className="space-y-4">
                {(data?.topProducts ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No sales yet.</p>
                ) : (
                  data!.topProducts.map((product, index) => (
                    <div key={product.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">
                          #{index + 1}
                        </div>
                        <span className="text-sm font-medium">{product.name}</span>
                      </div>
                      <span className="text-sm font-bold">{product.value} sold</span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="col-span-1 mb-6 rounded-xl border bg-card p-6 shadow-sm lg:col-span-2 xl:col-span-3">
              <h3 className="mb-4 font-display text-lg font-bold">Sales by branch</h3>
              <div className="h-[300px] w-full">
                <AnimatedBarChart data={branches.length ? branches : [{ name: "—", sales: 0 }]} xKey="name" yKey="sales" />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon }: { title: string; value: string; icon: typeof DollarSign }) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md landing-fade-up">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
          <Icon className="size-5 text-primary" />
        </div>
      </div>
      <div className="mt-4">
        <span className="font-display text-3xl font-bold">{value}</span>
      </div>
    </div>
  );
}
