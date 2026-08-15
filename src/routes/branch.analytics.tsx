import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AnimatedBarChart, AnimatedLineChart } from "@/components/charts/AnimatedCharts";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import type { AnalyticsSummary } from "@/lib/types";
import { fmtMoney } from "@/lib/format";

export const Route = createFileRoute("/branch/analytics")({
  component: () => (
    <AppShell allow={["ROLE_BRANCH_MANAGER"]}>
      <BranchAnalytics />
    </AppShell>
  ),
});

function BranchAnalytics() {
  const { branchId } = useAuthStore();
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!branchId) return;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get<AnalyticsSummary>(`/api/analytics/branch/${branchId}`);
        setData(res.data);
        toast.success("Branch analytics loaded");
      } catch (e) {
        toast.error(getApiErrorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [branchId]);

  const daily = (data?.daily ?? []).map((d) => ({ name: d.day.slice(5), revenue: d.revenue, orders: d.orders }));
  const products = (data?.topProducts ?? []).map((p) => ({ name: p.name, sales: p.value }));

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl font-bold">Branch analytics</h1>
      <p className="mt-1 text-sm text-muted-foreground">Revenue and volume from this branch only.</p>
      {loading ? (
        <div className="flex h-60 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border bg-card p-5 landing-fade-up">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Revenue</p>
              <p className="mt-2 font-display text-3xl font-bold">{fmtMoney(data?.revenue)}</p>
            </div>
            <div className="rounded-xl border bg-card p-5 landing-fade-up">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Orders</p>
              <p className="mt-2 font-display text-3xl font-bold">{data?.orderCount ?? 0}</p>
            </div>
          </div>
          <div className="mt-6 h-[320px] rounded-xl border bg-card p-6">
            <h3 className="mb-4 font-semibold">Daily revenue</h3>
            <AnimatedLineChart data={daily.length ? daily : [{ name: "—", revenue: 0 }]} xKey="name" yKey="revenue" />
          </div>
          <div className="mt-6 h-[320px] rounded-xl border bg-card p-6">
            <h3 className="mb-4 font-semibold">Top products (units)</h3>
            <AnimatedBarChart
              data={products.length ? products : [{ name: "—", sales: 0 }]}
              xKey="name"
              yKey="sales"
              money={false}
              yLabel="Units"
            />
          </div>
        </>
      )}
    </div>
  );
}
