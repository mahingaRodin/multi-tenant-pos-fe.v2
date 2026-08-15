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

export const Route = createFileRoute("/store/analytics")({
  component: () => (
    <AppShell allow={["ROLE_STORE_ADMIN", "ROLE_STORE_MANAGER"]}>
      <StoreAnalytics />
    </AppShell>
  ),
});

function StoreAnalytics() {
  const { storeId } = useAuthStore();
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) return;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get<AnalyticsSummary>(`/api/analytics/store/${storeId}`);
        setData(res.data);
        toast.success("Analytics loaded");
      } catch (e) {
        toast.error(getApiErrorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [storeId]);

  const daily = (data?.daily ?? []).map((d) => ({ name: d.day.slice(5), revenue: d.revenue, orders: d.orders }));
  const branches = (data?.byBranch ?? []).map((b) => ({ name: b.name, sales: b.value }));

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl font-bold">Store analytics</h1>
      <p className="mt-1 text-sm text-muted-foreground">Live revenue from orders recorded in this store.</p>
      {loading ? (
        <div className="flex h-60 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Metric label="Revenue" value={fmtMoney(data?.revenue)} />
            <Metric label="Orders" value={String(data?.orderCount ?? 0)} />
            <Metric label="Branches" value={String(data?.branchCount ?? 0)} />
          </div>
          <div className="mt-6 h-[320px] rounded-xl border bg-card p-6">
            <h3 className="mb-4 font-semibold">Daily revenue</h3>
            <AnimatedLineChart data={daily.length ? daily : [{ name: "—", revenue: 0 }]} xKey="name" yKey="revenue" />
          </div>
          <div className="mt-6 h-[320px] rounded-xl border bg-card p-6">
            <h3 className="mb-4 font-semibold">Sales by branch</h3>
            <AnimatedBarChart data={branches.length ? branches : [{ name: "—", sales: 0 }]} xKey="name" yKey="sales" />
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-5 landing-fade-up">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}
