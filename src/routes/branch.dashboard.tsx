import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Boxes, DollarSign, Loader2, Receipt, Users } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { useAuthStore } from "@/stores/authStore";
import { api, getApiErrorMessage } from "@/lib/api";
import type { AnalyticsSummary, OrderDto, PagedResponse } from "@/lib/types";
import { fmtMoney } from "@/lib/format";
import { PaginationBar, unwrapPage } from "@/components/shared/PaginationBar";

export const Route = createFileRoute("/branch/dashboard")({
  component: () => (
    <AppShell allow={["ROLE_BRANCH_MANAGER"]}>
      <BranchDashboard />
    </AppShell>
  ),
});

function BranchDashboard() {
  const { branchId } = useAuthStore();
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async (p = 0) => {
    if (!branchId) return;
    setLoading(true);
    try {
      const [analytics, orderRes] = await Promise.all([
        api.get<AnalyticsSummary>(`/api/analytics/branch/${branchId}`),
        api.get<PagedResponse<OrderDto>>(`/api/orders/branch/${branchId}`, {
          params: { page: p, size: 8 },
        }),
      ]);
      setData(analytics.data);
      const u = unwrapPage<OrderDto>(orderRes.data);
      setOrders(u.items);
      setTotalPages(u.totalPages);
      setTotal(u.total);
      setPage(u.page);
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  const cards = [
    {
      label: "Inventory SKUs",
      value: String(data?.productCount ?? 0),
      to: "/branch/inventory",
      icon: Boxes,
      hint: "Open inventory",
    },
    {
      label: "Cashiers",
      value: String((data?.employeeCount ?? 0)),
      to: "/branch/employees",
      icon: Users,
      hint: "Manage cashiers",
    },
    {
      label: "Orders",
      value: String(data?.orderCount ?? 0),
      to: "/branch/orders",
      icon: Receipt,
      hint: "View all orders",
    },
    {
      label: "Revenue",
      value: fmtMoney(data?.revenue),
      to: "/branch/analytics",
      icon: DollarSign,
      hint: "See analytics",
    },
  ] as const;

  return (
    <div className="p-6">
      <h1 className="font-display text-2xl font-bold">Branch overview</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Highlights for this location — click a card for the full view.
      </p>

      {loading && !data ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((c) => (
              <Link
                key={c.label}
                to={c.to}
                className="group rounded-2xl border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{c.label}</p>
                  <c.icon className="size-4 text-primary opacity-80" />
                </div>
                <p className="mt-3 font-display text-3xl font-bold tracking-tight">{c.value}</p>
                <p className="mt-2 text-xs font-medium text-primary group-hover:underline">{c.hint}</p>
              </Link>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border bg-card">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="font-semibold">Recent branch orders</h2>
              <Link to="/branch/orders" className="text-sm text-primary hover:underline">
                Open orders
              </Link>
            </div>
            <div className="divide-y">
              {orders.length === 0 ? (
                <p className="p-8 text-center text-sm text-muted-foreground">No orders yet for this branch.</p>
              ) : (
                orders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <div>
                      <p className="font-medium">#{o.id?.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">
                        {o.customerName || "Walk-in"} · {o.paymentType}
                      </p>
                    </div>
                    <p className="font-semibold">{fmtMoney(o.totalAmount)}</p>
                  </div>
                ))
              )}
            </div>
            <div className="px-5 pb-4">
              <PaginationBar page={page} totalPages={totalPages} total={total} onPage={load} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
