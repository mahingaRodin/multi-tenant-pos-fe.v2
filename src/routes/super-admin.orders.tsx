import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { AppShell } from "@/components/layout/AppShell";
import { api, getApiErrorMessage } from "@/lib/api";
import type { StoreDto, BranchDto, OrderDto, PagedResponse } from "@/lib/types";

export const Route = createFileRoute("/super-admin/orders")({
  component: () => (
    <AppShell allow={["ROLE_SUPER_ADMIN"]}>
      <OrdersPage />
    </AppShell>
  ),
});

interface EnrichedOrder extends OrderDto {
  storeBrand?: string;
  branchName?: string;
}

const PAGE_SIZE = 15;

function paymentBadge(type?: string) {
  if (type === "CASH")
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wider">Cash</span>;
  if (type === "CARD")
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wider">Card</span>;
  if (type === "UPI")
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-700 uppercase tracking-wider">UPI</span>;
  return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-muted text-muted-foreground uppercase tracking-wider">{type ?? "—"}</span>;
}

function OrdersPage() {
  const [allOrders, setAllOrders] = useState<EnrichedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        // 1. Fetch all stores
        const storeRes = await api.get<PagedResponse<StoreDto>>("/api/stores", {
          params: { page: 0, size: 100 },
        });
        const stores: StoreDto[] = storeRes.data?.content ?? [];
        if (!mounted) return;

        // 2. Fetch branches for every store in parallel
        const branchResults = await Promise.allSettled(
          stores
            .filter((s) => s.id)
            .map((s) =>
              api
                .get<PagedResponse<BranchDto>>(`/api/branches/store/${s.id}`, {
                  params: { page: 0, size: 200 },
                })
                .then((r) => ({
                  storeBrand: s.brand,
                  branches: (r.data?.content ?? []).map((b) => ({ ...b, storeBrand: s.brand })),
                }))
            )
        );

        const enrichedBranches: Array<BranchDto & { storeBrand: string }> = [];
        branchResults.forEach((r) => {
          if (r.status === "fulfilled") {
            enrichedBranches.push(...r.value.branches);
          }
        });
        if (!mounted) return;

        // 3. Fetch orders for every branch in parallel
        const orderResults = await Promise.allSettled(
          enrichedBranches
            .filter((b) => b.id)
            .map((b) =>
              api
                .get<PagedResponse<OrderDto>>(`/api/orders/branch/${b.id}`, {
                  params: { page: 0, size: 500 },
                })
                .then((r) =>
                  (r.data?.content ?? []).map((o) => ({
                    ...o,
                    storeBrand: b.storeBrand,
                    branchName: b.name,
                  }))
                )
            )
        );

        const orders: EnrichedOrder[] = [];
        orderResults.forEach((r) => {
          if (r.status === "fulfilled") orders.push(...r.value);
        });

        // Sort newest first
        orders.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

        if (!mounted) return;
        setAllOrders(orders);
      } catch (err) {
        console.error(getApiErrorMessage(err));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return allOrders;
    const q = searchQuery.toLowerCase();
    return allOrders.filter(
      (o) =>
        o.id?.toLowerCase().includes(q) ||
        o.storeBrand?.toLowerCase().includes(q) ||
        o.branchName?.toLowerCase().includes(q) ||
        o.paymentType?.toLowerCase().includes(q)
    );
  }, [allOrders, searchQuery]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageSlice = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  const totalRevenue = allOrders.reduce((s, o) => s + (o.totalAmount ?? 0), 0);

  const formatAmount = (n?: number) =>
    n !== undefined ? `$${n.toFixed(2)}` : "—";

  return (
    <div className="min-h-full bg-background p-8">
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">All Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? "Loading…" : `${allOrders.length.toLocaleString()} orders · Total revenue: $${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-card border border-border p-4 rounded-lg flex items-center mb-4 shadow-sm">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(0); }}
            placeholder="Search by order ID, store, branch, or payment type…"
            className="w-full pl-10 pr-4 py-2 border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#14B8A6] bg-card"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex h-60 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted border-b border-border">
                    <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Store</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Branch</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Payment</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-right">Amount</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {pageSlice.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                        {searchQuery ? "No orders match your search." : "No orders found."}
                      </td>
                    </tr>
                  ) : (
                    pageSlice.map((order) => (
                      <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                          {order.id?.slice(0, 8)}…
                        </td>
                        <td className="px-6 py-4 font-medium text-card-foreground">
                          {order.storeBrand ?? "—"}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {order.branchName ?? "—"}
                        </td>
                        <td className="px-6 py-4">{paymentBadge(order.paymentType)}</td>
                        <td className="px-6 py-4 text-right font-mono font-semibold text-card-foreground">
                          {formatAmount(order.totalAmount)}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-xs text-muted-foreground">
                          {order.createdAt
                            ? format(new Date(order.createdAt), "MMM d, yyyy HH:mm")
                            : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-card border-t border-border px-6 py-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Showing {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={currentPage === 0}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="p-1 text-muted-foreground hover:bg-muted rounded disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i)}
                      className={`w-8 h-8 rounded text-sm font-mono transition-colors ${
                        currentPage === i
                          ? "bg-[#14B8A6]/20 text-[#14B8A6] font-bold"
                          : "hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  {totalPages > 5 && <span className="text-muted-foreground px-1">…</span>}
                  <button
                    disabled={currentPage >= totalPages - 1}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="p-1 text-muted-foreground hover:bg-muted rounded disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="size-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
