import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Receipt,
  Loader2,
  Calendar,
  CreditCard,
  Banknote,
  Smartphone,
  ChevronRight,
  Package,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { api, getApiErrorMessage } from "@/lib/api";
import type { OrderDto, PagedResponse } from "@/lib/types";
import { PaginationBar, unwrapPage } from "@/components/shared/PaginationBar";
import { fmtMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/customer/orders")({
  component: () => (
    <AppShell allow={["ROLE_CUSTOMER"]}>
      <CustomerOrders />
    </AppShell>
  ),
});

function CustomerOrders() {
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderDto | null>(null);
  const [status, setStatus] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [direction, setDirection] = useState("DESC");
  const [refundReason, setRefundReason] = useState("");

  const load = async (p = 0) => {
    setLoading(true);
    try {
      const res = await api.get<PagedResponse<OrderDto>>("/api/shop/orders", {
        params: {
          page: p,
          size: 12,
          status: status || undefined,
          paymentType: paymentType || undefined,
          sortBy,
          direction,
        },
      });
      const u = unwrapPage<OrderDto>(res.data);
      setOrders(u.items);
      setTotalPages(u.totalPages);
      setTotal(u.total);
      setPage(u.page);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, paymentType, sortBy, direction]);

  const requestRefund = async (orderId?: string) => {
    if (!orderId) return;
    try {
      await api.post(`/api/shop/orders/${orderId}/refund-request`, {
        reason: refundReason || "Customer return — awaiting cashier confirmation",
      });
      toast.success("Refund requested. Return the items to the branch so a cashier can approve.");
      setRefundReason("");
      setSelectedOrder(null);
      load(page);
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  const PaymentIcon = ({ type }: { type: string }) => {
    switch (type) {
      case "CARD":
        return <CreditCard className="size-4 text-blue-500" />;
      case "UPI":
        return <Smartphone className="size-4 text-purple-500" />;
      case "CASH":
      default:
        return <Banknote className="size-4 text-emerald-500" />;
    }
  };

  return (
    <div className="flex min-h-full flex-col bg-muted/20">
      <div className="border-b bg-card px-6 py-8 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <h1 className="font-display text-3xl font-bold">My Orders</h1>
          <p className="mt-2 text-muted-foreground">
            Filter, sort, and request returns. Refunds complete after a cashier confirms the product is back in stock.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <select className="rounded-lg border bg-background px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="REFUNDED">Refunded</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <select className="rounded-lg border bg-background px-3 py-2 text-sm" value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
              <option value="">All payments</option>
              <option value="CARD">Card</option>
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
            </select>
            <select className="rounded-lg border bg-background px-3 py-2 text-sm" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="createdAt">Sort by date</option>
              <option value="totalAmount">Sort by total</option>
            </select>
            <select className="rounded-lg border bg-background px-3 py-2 text-sm" value={direction} onChange={(e) => setDirection(e.target.value)}>
              <option value="DESC">Descending</option>
              <option value="ASC">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 lg:p-12">
        <div className="mx-auto max-w-5xl">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : orders.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed bg-card text-center">
              <Receipt className="mb-4 size-12 text-muted-foreground/30" />
              <h3 className="font-display text-xl font-bold">No orders yet</h3>
              <p className="mt-2 max-w-sm text-muted-foreground">
                You haven&apos;t made any purchases yet. Your future orders will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {orders.map((order) => {
                const itemCount = order.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
                return (
                  <div
                    key={order.id}
                    onClick={async () => {
                      if (order.id && (!order.items || order.items.length === 0)) {
                        try {
                          const full = await api.get<OrderDto>(`/api/orders/${order.id}`);
                          setSelectedOrder(full.data);
                          return;
                        } catch {
                          /* fall through */
                        }
                      }
                      setSelectedOrder(order);
                    }}
                    className="group flex cursor-pointer flex-col rounded-2xl border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-md"
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Package className="size-5" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold">Order #{order.id?.slice(0, 8)}</div>
                          <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="size-3" />
                            {order.createdAt ? format(new Date(order.createdAt), "MMM d, yyyy") : "-"}
                          </div>
                        </div>
                      </div>
                      <div className="font-display text-lg font-bold">{fmtMoney(order.totalAmount)}</div>
                    </div>
                    <div className="mt-auto flex items-center gap-4 border-t pt-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <PaymentIcon type={order.paymentType} />
                        <span className="capitalize">{order.paymentType?.toLowerCase()}</span>
                      </div>
                      <div>{order.status || "—"}</div>
                      <div>{itemCount} items</div>
                    </div>
                    <div className="mt-4 flex items-center text-sm font-medium text-primary group-hover:underline">
                      View details <ChevronRight className="ml-1 size-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <PaginationBar page={page} totalPages={totalPages} total={total} onPage={load} />
        </div>
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={(o) => !o && setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-[480px]">
          {selectedOrder && (
            <>
              <DialogHeader>
                <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-success/15 text-success">
                  <CheckCircle2 className="size-6" />
                </div>
                <DialogTitle className="text-center font-display text-xl">Order details</DialogTitle>
                <DialogDescription className="text-center">Order #{selectedOrder.id}</DialogDescription>
              </DialogHeader>

              <div className="my-2 rounded-xl border bg-muted/30 p-5">
                <div className="mb-4 space-y-2 border-b border-border/50 pb-4 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Status</span>
                    <span className="font-medium text-foreground">{selectedOrder.status || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment</span>
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      <PaymentIcon type={selectedOrder.paymentType} />
                      {selectedOrder.paymentType}
                    </span>
                  </div>
                </div>
                <ul className="max-h-[200px] space-y-3 overflow-y-auto text-sm">
                  {(selectedOrder.items?.length ? selectedOrder.items : []).map((it, idx) => (
                    <li key={idx} className="flex justify-between">
                      <span>{it.quantity}× {it.product?.name || it.productId?.slice?.(0, 8) || "Item"}</span>
                      <span className="font-mono">{fmtMoney((it.price ?? 0) * it.quantity)}</span>
                    </li>
                  ))}
                  {(!selectedOrder.items || selectedOrder.items.length === 0) && (
                    <li className="text-muted-foreground">Line items load on receipt view when available.</li>
                  )}
                </ul>
                <div className="mt-4 flex justify-between border-t pt-4">
                  <span className="font-semibold text-muted-foreground">Total</span>
                  <span className="font-display text-2xl font-bold">{fmtMoney(selectedOrder.totalAmount)}</span>
                </div>
              </div>

              {selectedOrder.status !== "REFUNDED" && selectedOrder.status !== "CANCELLED" && (
                <div className="space-y-2 rounded-xl border border-amber-200/60 bg-amber-50/50 p-3 dark:bg-amber-950/20">
                  <p className="text-xs text-muted-foreground">
                    Request a refund only if you will return the product to the branch. A cashier must approve the return before the refund is issued.
                  </p>
                  <textarea
                    className="w-full rounded-lg border bg-background p-2 text-sm"
                    rows={2}
                    placeholder="Reason for return"
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                  />
                  <Button variant="outline" className="w-full" onClick={() => requestRefund(selectedOrder.id)}>
                    <RotateCcw className="mr-2 size-4" />
                    Request refund / return
                  </Button>
                </div>
              )}

              <Button className="w-full" onClick={() => setSelectedOrder(null)}>Close</Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
