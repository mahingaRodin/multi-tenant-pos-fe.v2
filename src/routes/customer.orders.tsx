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
} from "lucide-react";
import { format } from "date-fns";

import { AppShell } from "@/components/layout/AppShell";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import type { OrderDto, PagedResponse } from "@/lib/types";
import { toast } from "sonner";
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
  const { userId } = useAuthStore();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderDto | null>(null);

  const load = async (p = 0) => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await api.get<PagedResponse<OrderDto>>(`/api/orders/customer/${userId}`, {
        params: { page: p, size: 12 },
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
  }, [userId]);

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
    <div className="flex flex-col min-h-full bg-muted/20">
      <div className="border-b bg-card px-6 py-8 lg:px-12">
        <div className="max-w-5xl mx-auto">
          <h1 className="font-display text-3xl font-bold">My Orders</h1>
          <p className="text-muted-foreground mt-2">
            View your purchase history and digital receipts.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 lg:p-12">
        <div className="max-w-5xl mx-auto">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : orders.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed bg-card text-center">
              <Receipt className="mb-4 size-12 text-muted-foreground/30" />
              <h3 className="font-display text-xl font-bold">No orders yet</h3>
              <p className="mt-2 text-muted-foreground max-w-sm">
                You haven't made any purchases yet. Your future orders will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {orders.map((order) => {
                const itemCount = order.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;

                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="group flex flex-col cursor-pointer rounded-2xl border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/50"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Package className="size-5" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-foreground">
                            Order #{order.id?.slice(0, 8)}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Calendar className="size-3" />
                            {order.createdAt
                              ? format(new Date(order.createdAt), "MMM d, yyyy")
                              : "-"}
                          </div>
                        </div>
                      </div>
                      <div className="font-display font-bold text-lg">
                        {fmtMoney(order.totalAmount)}
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-end">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground border-t pt-4">
                        <div className="flex items-center gap-1.5">
                          <PaymentIcon type={order.paymentType} />
                          <span className="capitalize">{order.paymentType.toLowerCase()}</span>
                        </div>
                        <div className="flex items-center gap-1.5 before:content-['•'] before:mr-2 before:text-muted">
                          {itemCount} {itemCount === 1 ? "item" : "items"}
                        </div>
                      </div>
                      <div className="mt-4 flex items-center text-sm font-medium text-primary group-hover:underline">
                        View Receipt{" "}
                        <ChevronRight className="size-4 ml-1 transition-transform group-hover:translate-x-1" />
                      </div>
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
        <DialogContent className="sm:max-w-[450px]">
          {selectedOrder && (
            <>
              <DialogHeader>
                <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-success/15 text-success">
                  <CheckCircle2 className="size-6" />
                </div>
                <DialogTitle className="text-center font-display text-xl">
                  Digital Receipt
                </DialogTitle>
                <DialogDescription className="text-center">
                  Order #{selectedOrder.id}
                </DialogDescription>
              </DialogHeader>

              <div className="my-4 rounded-xl border bg-muted/30 p-5 shadow-inner">
                <div className="mb-5 flex flex-col gap-2 text-sm text-muted-foreground border-b border-border/50 pb-5">
                  <div className="flex justify-between items-center">
                    <span>Date & Time</span>
                    <span className="text-foreground font-medium">
                      {selectedOrder.createdAt
                        ? format(new Date(selectedOrder.createdAt), "MMM d, yyyy h:mm a")
                        : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Payment Method</span>
                    <span className="text-foreground font-medium flex items-center gap-1.5">
                      <PaymentIcon type={selectedOrder.paymentType} />
                      <span className="capitalize">{selectedOrder.paymentType.toLowerCase()}</span>
                    </span>
                  </div>
                </div>

                <div className="font-semibold text-sm mb-3">Items Purchased</div>
                <ul className="space-y-3 text-sm max-h-[250px] overflow-y-auto pr-2">
                  {selectedOrder.items?.map((it: any, idx: number) => (
                    <li key={idx} className="flex justify-between items-start group">
                      <div className="flex gap-3">
                        <div className="bg-background border rounded size-10 flex items-center justify-center text-xs font-medium shrink-0">
                          {it.quantity}x
                        </div>
                        <div>
                          <div className="font-medium text-foreground">
                            {it.product?.name || `Item ID: ${it.productId.slice(0, 8)}`}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {fmtMoney(it.price)} each
                          </div>
                        </div>
                      </div>
                      <span className="font-mono tabular-nums font-medium text-foreground">
                        {fmtMoney(it.price * it.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-5 flex items-center justify-between border-t border-border/50 pt-5">
                  <span className="font-semibold text-muted-foreground">Total Paid</span>
                  <span className="font-display text-3xl font-extrabold text-foreground tracking-tight">
                    {fmtMoney(selectedOrder.totalAmount)}
                  </span>
                </div>
              </div>

              <Button className="w-full" onClick={() => setSelectedOrder(null)}>
                Close Receipt
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
