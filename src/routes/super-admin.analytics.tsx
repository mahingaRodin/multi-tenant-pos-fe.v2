import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, TrendingUp } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { api, getApiErrorMessage } from "@/lib/api";
import type { StoreDto, PagedResponse } from "@/lib/types";
import { normalizeStoreStatus } from "@/lib/types";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export const Route = createFileRoute("/super-admin/analytics")({
  component: () => (
    <AppShell allow={["ROLE_SUPER_ADMIN"]}>
      <AnalyticsPage />
    </AppShell>
  ),
});

const MONTHLY_DATA = [
  { month: "Jan", revenue: 820 },
  { month: "Feb", revenue: 932 },
  { month: "Mar", revenue: 901 },
  { month: "Apr", revenue: 1234 },
  { month: "May", revenue: 1290 },
  { month: "Jun", revenue: 1150 },
  { month: "Jul", revenue: 1680 },
  { month: "Aug", revenue: 1540 },
  { month: "Sep", revenue: 1920 },
  { month: "Oct", revenue: 2100 },
  { month: "Nov", revenue: 2350 },
  { month: "Dec", revenue: 2400 },
];

function AnalyticsPage() {
  const [stores, setStores] = useState<StoreDto[]>([]);
  const [totalStores, setTotalStores] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("Last 30 Days");

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.get<PagedResponse<StoreDto>>("/api/stores", {
          params: { page: 0, size: 100 },
        });
        if (mounted) {
          const data = res.data;
          const list = (Array.isArray(data?.content) ? data.content : []).map((s) => ({
            ...s,
            status: normalizeStoreStatus(s.status),
          }));
          setStores(list);
          setTotalStores(data?.totalElements ?? 0);
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
  const topStores = [...stores]
    .sort((a, b) => (b.brand || "").localeCompare(a.brand || ""))
    .slice(0, 5);
  const maxVal = 450;

  return (
    <div className="min-h-full bg-background p-8">
      {/* Page Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            System Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time overview of enterprise performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-border bg-card rounded-lg py-2 px-3 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
          >
            <option>Last 30 Days</option>
            <option>Last Quarter</option>
            <option>Year to Date</option>
          </select>
          <button className="bg-[#14B8A6] hover:bg-teal-600 text-white py-2 px-4 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium">
            Export Report
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-60 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Top Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Revenue</span>
                <span className="text-[#14B8A6]">💳</span>
              </div>
              <div className="text-3xl font-bold text-card-foreground font-mono">$2.4M</div>
              <div className="flex items-center gap-1 text-sm mt-1">
                <TrendingUp className="size-4 text-emerald-500" />
                <span className="text-emerald-600 font-medium">+14.5%</span>
                <span className="text-muted-foreground text-xs">vs last month</span>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">System Growth</span>
                <span className="text-[#14B8A6]">📈</span>
              </div>
              <div className="text-3xl font-bold text-card-foreground font-mono">18.2%</div>
              <div className="flex items-center gap-1 text-sm mt-1">
                <TrendingUp className="size-4 text-emerald-500" />
                <span className="text-emerald-600 font-medium">+2.1%</span>
                <span className="text-muted-foreground text-xs">vs last month</span>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Active Stores</span>
                <span className="text-[#14B8A6]">🏪</span>
              </div>
              <div className="text-3xl font-bold text-card-foreground font-mono">{activeCount}</div>
              <div className="flex items-center gap-1 text-sm mt-1">
                <span className="text-amber-600 font-medium">of {totalStores} total</span>
              </div>
            </div>
          </div>

          {/* Revenue Area Chart */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-semibold text-card-foreground">Monthly Revenue</h3>
              <div className="flex gap-2">
                {["Daily", "Monthly"].map((t) => (
                  <button
                    key={t}
                    className={`px-3 py-1 text-xs rounded border transition-colors ${
                      t === "Monthly"
                        ? "border-[#14B8A6] bg-[#14B8A6]/10 text-[#14B8A6] font-medium"
                        : "border-border bg-card text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MONTHLY_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#14B8A6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#94a3b8" }}
                    dy={8}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#94a3b8" }}
                    tickFormatter={(v: number) => `$${v}`}
                  />
                  <Tooltip
                    contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "8px", color: "var(--color-card-foreground)" }}
                    formatter={(v) => [`$${v}k`, "Revenue"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#14B8A6"
                    strokeWidth={2}
                    fill="url(#revenueGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bottom Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Performing Stores */}
            <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="text-base font-semibold text-card-foreground mb-6">Top Performing Stores</h3>
              <div className="space-y-4">
                {topStores.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No store data available.</p>
                ) : (
                  topStores.map((store, i) => {
                    const pct = Math.max(20, 90 - i * 15);
                    return (
                      <div key={store.id}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="font-medium text-card-foreground">{store.brand}</span>
                          <span className="font-mono text-muted-foreground">{pct}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-[#14B8A6] h-2 rounded-full transition-all"
                            style={{ width: `${pct}%`, opacity: 1 - i * 0.15 }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* System Health */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col">
              <h3 className="text-base font-semibold text-card-foreground mb-6">System Health</h3>
              <div className="mb-6">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Uptime (90 Days)</span>
                  <span className="font-mono text-lg font-bold text-emerald-600">99.99%</span>
                </div>
                <div className="w-full h-7 bg-muted rounded flex overflow-hidden gap-px">
                  {Array.from({ length: 10 }, (_, i) => (
                    <div
                      key={i}
                      className={`flex-1 ${i === 5 ? "bg-amber-400" : "bg-emerald-500"}`}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-3 flex-1">
                {[
                  { label: "Avg Process Time", value: "124ms" },
                  { label: "Database Load", value: "42%" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex justify-between items-center p-3 bg-muted rounded-lg border border-border"
                  >
                    <span className="text-sm text-card-foreground">{item.label}</span>
                    <span className="font-mono text-sm font-semibold text-card-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-border">
                <a href="#" className="text-sm text-[#14B8A6] font-medium hover:underline flex items-center justify-center gap-1">
                  View Detailed Logs →
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
