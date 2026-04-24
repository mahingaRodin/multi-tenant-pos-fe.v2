import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuthStore } from "@/stores/authStore";
import { api, getApiErrorMessage } from "@/lib/api";
import type { StoreDto, PagedResponse, CustomerDto } from "@/lib/types";
import { Loader2, TrendingUp } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/super-admin/dashboard")({
  component: () => (
    <AppShell allow={["ROLE_SUPER_ADMIN"]}>
      <DashboardHome />
    </AppShell>
  ),
});

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
  const activePercent = totalStores > 0 ? Math.round((activeCount / totalStores) * 100) : 0;
  const pendingPercent = totalStores > 0 ? Math.round((pendingCount / totalStores) * 100) : 0;
  const blockedPercent = totalStores > 0 ? Math.round((blockedCount / totalStores) * 100) : 0;

  const recentStores = [...stores]
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
    .slice(0, 5);

  const statusBadge = (status?: string) => {
    if (status === "ACTIVE")
      return <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#14B8A6]/10 text-[#14B8A6] text-[11px] font-bold uppercase tracking-wider">Active</span>;
    if (status === "PENDING")
      return <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[11px] font-bold uppercase tracking-wider">Pending</span>;
    return <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-[11px] font-bold uppercase tracking-wider">{status || "BLOCKED"}</span>;
  };

  return (
    <div className="min-h-full bg-background p-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          System Overview
        </h1>
        <button
          onClick={() => navigate({ to: "/super-admin/stores" })}
          className="bg-[#14B8A6] hover:bg-teal-600 text-white py-2 px-4 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium"
        >
          <span className="text-lg leading-none">＋</span>
          Add Store
        </button>
      </div>

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
              iconBg="bg-[#14B8A6]/10"
              iconColor="text-[#14B8A6]"
              trend="+12%"
              trendUp
            />
            <MetricCard
              label="Active Branches"
              value={activeCount.toLocaleString()}
              icon="location_on"
              iconBg="bg-blue-50"
              iconColor="text-blue-400"
              trend="+8.4%"
              trendUp
            />
            <MetricCard
              label="Total Users"
              value={totalCustomers > 0 ? totalCustomers.toLocaleString() : "—"}
              icon="group"
              iconBg="bg-amber-50"
              iconColor="text-amber-400"
              trend="+24%"
              trendUp
            />
            <MetricCard
              label="System Revenue"
              value="$2.4M"
              icon="payments"
              iconBg="bg-[#14B8A6]/10"
              iconColor="text-[#14B8A6]"
              trend="+18%"
              trendUp
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
                  className="text-[#14B8A6] text-sm font-medium hover:underline"
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
                          <td className="py-4 px-6 text-center text-foreground font-mono text-sm">—</td>
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
              {/* Recent Activity */}
              <div className="bg-card border border-border rounded-xl shadow-sm p-6 flex-1">
                <h3 className="text-base font-semibold text-card-foreground mb-6">Recent Activity</h3>
                <div className="space-y-5 relative before:absolute before:inset-y-0 before:left-[7px] before:w-px before:bg-border">
                  {[
                    { dot: "bg-[#14B8A6]", text: "New store registered on the platform", time: "10:45 AM today" },
                    { dot: "bg-slate-300", text: "System backup completed successfully.", time: "02:00 AM today" },
                    { dot: "bg-[#14B8A6]", text: "Store status updated to Active.", time: "Yesterday, 4:30 PM" },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 relative z-10">
                      <div className={`w-4 h-4 rounded-full ${item.dot} border-4 border-card shrink-0 mt-0.5`} />
                      <div>
                        <p className="text-sm text-card-foreground">{item.text}</p>
                        <p className="text-[11px] font-mono text-muted-foreground mt-0.5">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stores by Status */}
              <div className="bg-card border border-border rounded-xl shadow-sm p-6 flex-1">
                <h3 className="text-base font-semibold text-card-foreground mb-5">Stores by Status</h3>
                <div className="flex items-center justify-center mb-6">
                  {/* CSS donut chart */}
                  <div className="relative w-36 h-36">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3.8" />
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#14B8A6" strokeWidth="3.8"
                        strokeDasharray={`${activePercent} ${100 - activePercent}`} />
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#F59E0B" strokeWidth="3.8"
                        strokeDasharray={`${pendingPercent} ${100 - pendingPercent}`}
                        strokeDashoffset={`${-(activePercent)}`} />
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#EF4444" strokeWidth="3.8"
                        strokeDasharray={`${blockedPercent} ${100 - blockedPercent}`}
                        strokeDashoffset={`${-(activePercent + pendingPercent)}`} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold text-card-foreground font-mono">{totalStores}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 border-t border-border pt-4">
                  {[
                    { color: "bg-[#14B8A6]", label: "Active", pct: `${activePercent}%` },
                    { color: "bg-amber-400", label: "Pending", pct: `${pendingPercent}%` },
                    { color: "bg-red-400", label: "Blocked", pct: `${blockedPercent}%` },
                  ].map((item) => (
                    <div key={item.label} className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <div className={`w-2 h-2 rounded-full ${item.color}`} />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{item.label}</span>
                      </div>
                      <span className="text-sm font-mono font-semibold text-card-foreground">{item.pct}</span>
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

function MetricCard({ label, value, icon, iconBg, iconColor, trend, trendUp }: {
  label: string; value: string; icon: string;
  iconBg: string; iconColor: string; trend?: string; trendUp?: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
        <span className={`material-symbols-outlined ${iconColor} ${iconBg} p-2 rounded-lg text-[20px]`}
          style={{}}>
          {icon}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-card-foreground font-mono">{value}</span>
        {trend && (
          <span className={`text-sm font-medium flex items-center gap-0.5 ${trendUp ? "text-[#14B8A6]" : "text-slate-400"}`}>
            {trendUp && <TrendingUp className="size-3" />}
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
