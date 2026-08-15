import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { api, getApiErrorMessage } from "@/lib/api";
import type { AnalyticsSummary } from "@/lib/types";
import { AnimatedBarChart, AnimatedLineChart } from "@/components/charts/AnimatedCharts";
import { fmtMoney } from "@/lib/format";

export const Route = createFileRoute("/super-admin/analytics")({
  component: () => (
    <AppShell allow={["ROLE_SUPER_ADMIN"]}>
      <AnalyticsPage />
    </AppShell>
  ),
});

function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get<AnalyticsSummary>("/api/analytics/platform");
        if (mounted) {
          setData(res.data);
          toast.success("Analytics loaded");
        }
      } catch (err) {
        toast.error(getApiErrorMessage(err));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const daily = (data?.daily ?? []).map((d) => ({ name: d.day.slice(5), revenue: d.revenue }));
  const branches = (data?.byBranch ?? []).map((b) => ({ name: b.name, sales: b.value }));
  const maxBranch = Math.max(1, ...branches.map((b) => b.sales));

  return (
    <div className="min-h-full bg-background p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">System Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">Live revenue from orders recorded in POSify.</p>
      </div>
      {loading ? (
        <div className="flex h-60 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            <Metric label="Total Revenue" value={fmtMoney(data?.revenue)} />
            <Metric label="Orders" value={String(data?.orderCount ?? 0)} />
            <Metric label="Active stores" value={`${data?.storeCount ?? 0}`} />
          </div>
          <div className="mb-6 h-[280px] rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold">Daily revenue</h3>
            <AnimatedLineChart data={daily.length ? daily : [{ name: "—", revenue: 0 }]} xKey="name" yKey="revenue" />
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-xl border bg-card p-6 shadow-sm lg:col-span-2">
              <h3 className="mb-6 text-base font-semibold">Revenue by branch</h3>
              {branches.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No sales yet.</p>
              ) : (
                <div className="space-y-4">
                  {branches.slice(0, 8).map((b) => (
                    <div key={b.name}>
                      <div className="mb-1.5 flex justify-between text-sm">
                        <span className="font-medium">{b.name}</span>
                        <span className="font-mono text-muted-foreground">{fmtMoney(b.sales)}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.max(4, (b.sales / maxBranch) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="h-[280px] rounded-xl border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold">Branch volume</h3>
              <AnimatedBarChart data={branches.length ? branches.slice(0, 8) : [{ name: "—", sales: 0 }]} xKey="name" yKey="sales" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm landing-fade-up">
      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="mt-2 font-mono text-3xl font-bold">{value}</div>
    </div>
  );
}
