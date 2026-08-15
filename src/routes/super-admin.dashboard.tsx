import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { api, getApiErrorMessage } from "@/lib/api";
import type { StoreDto, PagedResponse, BranchDto, AdminNotification, AnalyticsSummary } from "@/lib/types";
import { normalizeStoreStatus } from "@/lib/types";
import { Loader2, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/super-admin/dashboard")({
  component: () => (
    <AppShell allow={["ROLE_SUPER_ADMIN"]}>
      <DashboardHome />
    </AppShell>
  ),
});

function formatRevenue(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`;
  return `$${amount.toFixed(2)}`;
}

function DashboardHome() {
  const navigate = useNavigate();

  const [stores, setStores] = useState<StoreDto[]>([]);
  const [totalStores, setTotalStores] = useState(0);
  const [totalBranches, setTotalBranches] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [systemRevenue, setSystemRevenue] = useState(0);
  const [branchCountByStore, setBranchCountByStore] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ticker, setTicker] = useState<AdminNotification[]>([]);

  const fetchData = async (silent = false) => {
    if (silent) setRefreshing(true); else setLoading(true);
    try {
      api.get<{ items: AdminNotification[] }>("/api/admin/notifications/ticker")
        .then((r) => setTicker(r.data.items ?? []))
        .catch(() => undefined);
      // 1. Fetch all stores — vary size to bust Spring Pageable cache key
      const bustSize = 100 + (Date.now() % 4);
      const storeRes = await api.get<PagedResponse<StoreDto>>("/api/stores", {
        params: { page: 0, size: bustSize, direction: "DESC" },
      });
      const storeData = storeRes.data;
      const storeList: StoreDto[] = (Array.isArray(storeData?.content) ? storeData.content : []).map((s) => ({
        ...s,
        status: normalizeStoreStatus(s.status),
      }));
      setStores(storeList);
      setTotalStores(storeData?.totalElements ?? storeList.length);

      // 2. Fetch branches for every store in parallel
      const branchMap: Record<string, number> = {};
      storeList.forEach((s) => { if (s.id) branchMap[s.id] = 0; });

      const branchResults = await Promise.allSettled(
        storeList
          .filter((s) => s.id)
          .map((s) =>
            api
              .get<PagedResponse<BranchDto>>(`/api/branches/store/${s.id}`, {
                params: { page: 0, size: 200 },
              })
              .then((r) => {
                const content = r.data?.content ?? [];
                const total = r.data?.totalElements ?? content.length;
                return { storeId: s.id!, total: Math.max(total, content.length), branches: content };
              })
          )
      );

      let allBranches: BranchDto[] = [];
      branchResults.forEach((r) => {
        if (r.status === "fulfilled") {
          branchMap[r.value.storeId] = r.value.total;
          allBranches = allBranches.concat(r.value.branches);
        }
      });
      const totalBranchCount = Object.values(branchMap).reduce((a, b) => a + b, 0);
      setBranchCountByStore(branchMap);
      setTotalBranches(totalBranchCount);

      const [analyticsRes] = await Promise.all([
        api.get<AnalyticsSummary>("/api/analytics/platform"),
      ]);
      const analytics = analyticsRes.data;
      setTotalOrders(analytics.orderCount ?? 0);
      setSystemRevenue(analytics.revenue ?? 0);
      setTotalBranches(analytics.branchCount ?? totalBranchCount);
      toast.success("Dashboard updated");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeCount  = stores.filter((s) => s.status === "ACTIVE").length;
  const pendingCount = stores.filter((s) => s.status === "PENDING").length;
  const blockedCount = stores.filter((s) => s.status === "BLOCKED").length;
  const activePercent  = totalStores > 0 ? Math.round((activeCount  / totalStores) * 100) : 0;
  const pendingPercent = totalStores > 0 ? Math.round((pendingCount / totalStores) * 100) : 0;
  const blockedPercent = totalStores > 0 ? Math.round((blockedCount / totalStores) * 100) : 0;

  const recentStores = [...stores]
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
    .slice(0, 5);

  const statusBadge = (status?: StoreDto["status"]) => {
    const normalized = normalizeStoreStatus(status);
    if (normalized === "ACTIVE")
      return <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wider">Active</span>;
    if (normalized === "PENDING")
      return <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[11px] font-bold uppercase tracking-wider">Pending</span>;
    return <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-[11px] font-bold uppercase tracking-wider">{normalized || "BLOCKED"}</span>;
  };

  return (
    <div className="min-h-full bg-background p-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          System Overview
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            title="Refresh data"
            className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => navigate({ to: "/super-admin/stores" })}
            className="bg-primary hover:bg-[var(--primary-hover)] text-white py-2 px-4 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium"
          >
            <span className="text-lg leading-none">＋</span>
            Add Store
          </button>
        </div>
      </div>

      {ticker.length > 0 && (
        <div className="mb-6 overflow-hidden rounded-lg border border-primary/40 bg-primary/10 py-2">
          <div className="landing-marquee px-4 text-sm font-medium text-foreground">
            {ticker.map((t) => t.title).join("   •   ")}   •   {ticker.map((t) => t.title).join("   •   ")}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex h-60 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
              label="Total Stores"
              value={totalStores.toLocaleString()}
              icon="storefront"
              iconBg="bg-primary/10"
              iconColor="text-primary"
            />
            <MetricCard
              label="Active Branches"
              value={totalBranches.toLocaleString()}
              icon="location_on"
              iconBg="bg-blue-500/10"
              iconColor="text-blue-400"
            />
            <MetricCard
              label="Total Orders"
              value={totalOrders.toLocaleString()}
              icon="receipt_long"
              iconBg="bg-amber-500/10"
              iconColor="text-amber-400"
            />
            <MetricCard
              label="System Revenue"
              value={formatRevenue(systemRevenue)}
              icon="payments"
              iconBg="bg-primary/10"
              iconColor="text-primary"
            />
          </div>

          {/* 2-Col Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* All Stores Table — col-span-2 */}
            <div className="lg:col-span-2 bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h3 className="text-base font-semibold text-card-foreground">All Stores</h3>
                <button
                  onClick={() => navigate({ to: "/super-admin/stores" })}
                  className="text-primary text-sm font-medium hover:underline"
                >
                  View All
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted border-b border-border">
                      <th className="py-3 px-6 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Name</th>
                      <th className="py-3 px-6 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Owner</th>
                      <th className="py-3 px-6 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-center">Branches</th>
                      <th className="py-3 px-6 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-center">Status</th>
                      <th className="py-3 px-6 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-right">Created</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-border">
                    {recentStores.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground text-sm">
                          No stores registered yet.
                        </td>
                      </tr>
                    ) : (
                      recentStores.map((store) => (
                        <tr key={store.id} className="hover:bg-muted/50 transition-colors">
                          <td className="py-4 px-6 font-medium text-card-foreground">{store.brand}</td>
                          <td className="py-4 px-6 text-muted-foreground">
                            {store.storeAdmin
                              ? `${store.storeAdmin.firstName || ""} ${store.storeAdmin.lastName || ""}`.trim() || store.storeAdmin.email
                              : "—"}
                          </td>
                          <td className="py-4 px-6 text-center text-card-foreground font-mono text-sm">
                            {store.id !== undefined && store.id in branchCountByStore
                              ? branchCountByStore[store.id]
                              : "—"}
                          </td>
                          <td className="py-4 px-6 text-center">{statusBadge(store.status)}</td>
                          <td className="py-4 px-6 text-right text-muted-foreground font-mono text-xs">
                            {store.createdAt ? format(new Date(store.createdAt), "MMM d, yyyy") : "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-6">
              {/* Recent Activity — derived from latest stores */}
              <div className="bg-card border border-border rounded-xl shadow-sm p-6 flex-1">
                <h3 className="text-base font-semibold text-card-foreground mb-6">Recent Activity</h3>
                <div className="space-y-5 relative before:absolute before:inset-y-0 before:left-[7px] before:w-px before:bg-border">
                  {recentStores.length === 0 ? (
                    <p className="text-sm text-muted-foreground pl-8">No recent activity.</p>
                  ) : (
                    recentStores.slice(0, 3).map((store, i) => (
                      <div key={store.id ?? i} className="flex gap-4 relative z-10">
                        <div className={`w-4 h-4 rounded-full shrink-0 mt-0.5 border-4 border-card ${store.status === "ACTIVE" ? "bg-primary" : store.status === "PENDING" ? "bg-amber-400" : "bg-red-400"}`} />
                        <div>
                          <p className="text-sm text-card-foreground">
                            <span className="font-medium">{store.brand}</span> registered{" "}
                            <span className={normalizeStoreStatus(store.status) === "ACTIVE" ? "text-primary" : normalizeStoreStatus(store.status) === "PENDING" ? "text-amber-500" : "text-red-400"}>
                              ({(normalizeStoreStatus(store.status) ?? "blocked").toLowerCase()})
                            </span>
                          </p>
                          <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                            {store.createdAt ? format(new Date(store.createdAt), "MMM d, yyyy") : "—"}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Stores by Status */}
              <div className="bg-card border border-border rounded-xl shadow-sm p-6 flex-1">
                <h3 className="text-base font-semibold text-card-foreground mb-5">Stores by Status</h3>
                <div className="flex items-center justify-center mb-6">
                  <div className="relative w-36 h-36">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3.8" />
                      {activePercent > 0 && (
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3.8"
                          strokeDasharray={`${activePercent} ${100 - activePercent}`} />
                      )}
                      {pendingPercent > 0 && (
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#F59E0B" strokeWidth="3.8"
                          strokeDasharray={`${pendingPercent} ${100 - pendingPercent}`}
                          strokeDashoffset={`${-activePercent}`} />
                      )}
                      {blockedPercent > 0 && (
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#EF4444" strokeWidth="3.8"
                          strokeDasharray={`${blockedPercent} ${100 - blockedPercent}`}
                          strokeDashoffset={`${-(activePercent + pendingPercent)}`} />
                      )}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold text-card-foreground font-mono">{totalStores}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 border-t border-border pt-4">
                  {[
                    { color: "bg-primary", label: "Active",  count: activeCount,  pct: `${activePercent}%`  },
                    { color: "bg-amber-400",  label: "Pending", count: pendingCount, pct: `${pendingPercent}%` },
                    { color: "bg-red-400",    label: "Blocked", count: blockedCount, pct: `${blockedPercent}%` },
                  ].map((item) => (
                    <div key={item.label} className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <div className={`w-2 h-2 rounded-full ${item.color}`} />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{item.label}</span>
                      </div>
                      <span className="text-sm font-mono font-semibold text-card-foreground">{item.pct}</span>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{item.count} store{item.count !== 1 ? "s" : ""}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({ label, value, icon, iconBg, iconColor }: {
  label: string; value: string; icon: string;
  iconBg: string; iconColor: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
        <span className={`material-symbols-outlined ${iconColor} ${iconBg} p-2 rounded-lg text-[20px]`}>
          {icon}
        </span>
      </div>
      <span className="text-3xl font-bold text-card-foreground font-mono">{value}</span>
    </div>
  );
}
