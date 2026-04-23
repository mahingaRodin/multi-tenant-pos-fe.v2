import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import {
  Receipt,
  Search,
  Loader2,
  Calendar,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { AppShell } from "@/components/layout/AppShell";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import type { OrderDto, PagedResponse } from "@/lib/types";
import { fmtMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/branch/orders")({
  component: () => (
    <AppShell allow={["ROLE_BRANCH_MANAGER"]}>
      <OrdersPage />
    </AppShell>
  ),
});

function OrdersPage() {
  const { branchId } = useAuthStore();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedOrder, setSelectedOrder] = useState<OrderDto | null>(null);

  const fetchOrders = async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const res = await api.get<PagedResponse<OrderDto>>(`/api/orders/branch/${branchId}`, {
        params: { page: 0, size: 200 },
      });
      const data = res.data;
      setOrders(Array.isArray(data?.content) ? data.content : Array.isArray(data) ? (data as unknown as OrderDto[]) : []);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const idStr = o.id?.toLowerCase() || "";
      const q = searchQuery.toLowerCase();
      return idStr.includes(q);
    });
  }, [orders, searchQuery]);

  // Separate today's orders
  const today = new Date().toDateString();
  const todaysOrders = filteredOrders.filter(
    (o) => o.createdAt && new Date(o.createdAt).toDateString() === today,
  );
  const olderOrders = filteredOrders.filter(
    (o) => !o.createdAt || new Date(o.createdAt).toDateString() !== today,
  );

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
    <div className="flex h-full flex-col bg-muted/20">
      <div className="border-b bg-card px-6 py-5">
        <h1 className="font-display text-2xl font-bold">Order History</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review all transactions processed at this branch.
        </p>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order ID..."
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed bg-card text-center shadow-sm">
            <Receipt className="mb-4 size-12 text-muted-foreground/50" />
            <h3 className="font-display text-lg font-bold">No orders found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {searchQuery
                ? "Try a different search query."
                : "No orders have been processed at this branch yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {todaysOrders.length > 0 && (
              <section>
                <div className="mb-4 flex items-center gap-2">
                  <StatusBadge variant="active">Today</StatusBadge>
                  <span className="text-sm text-muted-foreground">
                    {todaysOrders.length} orders
                  </span>
                </div>
                <OrderTable
                  orders={todaysOrders}
                  onSelect={setSelectedOrder}
                  PaymentIcon={PaymentIcon}
                />
              </section>
            )}

            {olderOrders.length > 0 && (
              <section>
                <div className="mb-4 flex items-center gap-2">
                  <h3 className="font-display text-lg font-bold">Previous Orders</h3>
                  <span className="text-sm text-muted-foreground">{olderOrders.length} orders</span>
                </div>
                <OrderTable
                  orders={olderOrders}
                  onSelect={setSelectedOrder}
                  PaymentIcon={PaymentIcon}
                />
              </section>
            )}
          </div>
        )}
      </div>

      <OrderDetailsDialog
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        PaymentIcon={PaymentIcon}
      />
    </div>
  );
}

function OrderTable({ orders, onSelect, PaymentIcon }: any) {
  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-6 py-4 font-medium">Order ID</th>
              <th className="px-6 py-4 font-medium">Date & Time</th>
              <th className="px-6 py-4 font-medium">Payment</th>
              <th className="px-6 py-4 font-medium">Items</th>
              <th className="px-6 py-4 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map((order: OrderDto) => (
              <tr
                key={order.id}
                onClick={() => onSelect(order)}
                className="hover:bg-muted/30 transition-colors cursor-pointer group"
              >
                <td className="px-6 py-4 font-mono text-xs text-muted-foreground group-hover:text-foreground">
                  {order.id?.slice(0, 12)}...
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-muted-foreground" />
                    <span>
                      {order.createdAt
                        ? format(new Date(order.createdAt), "MMM d, yyyy h:mm a")
                        : "-"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <PaymentIcon type={order.paymentType} />
                    <span className="capitalize">{order.paymentType.toLowerCase()}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-muted-foreground">
                  {order.items?.length || 0} item(s)
                </td>
                <td className="px-6 py-4 text-right font-display font-bold">
                  {fmtMoney(order.totalAmount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrderDetailsDialog({ order, onClose, PaymentIcon }: any) {
  return (
    <Dialog open={!!order} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[450px]">
        {order && (
          <>
            <DialogHeader>
              <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-success/15 text-success">
                <CheckCircle2 className="size-6" />
              </div>
              <DialogTitle className="text-center">Order Details</DialogTitle>
              <DialogDescription className="text-center">
                <span className="font-mono text-xs">#{order.id}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="my-4 rounded-lg border bg-muted/30 p-4">
              <div className="mb-4 flex flex-col gap-1 text-sm text-muted-foreground border-b pb-4">
                <div className="flex justify-between">
                  <span>Date</span>
                  <span className="text-foreground">
                    {order.createdAt
                      ? format(new Date(order.createdAt), "MMM d, yyyy h:mm a")
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Cashier ID</span>
                  <span className="text-foreground">{order.cashierId || "Unknown"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment</span>
                  <span className="text-foreground flex items-center gap-1.5">
                    <PaymentIcon type={order.paymentType} />
                    <span className="capitalize">{order.paymentType.toLowerCase()}</span>
                  </span>
                </div>
              </div>

              <div className="font-medium text-sm mb-2">Items Purchased</div>
              <ul className="space-y-2 text-sm max-h-[200px] overflow-y-auto">
                {order.items?.map((it: any, idx: number) => (
                  <li key={idx} className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">
                        {it.product?.name || `Product ID: ${it.productId.slice(0, 8)}`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {it.quantity} × {fmtMoney(it.price)}
                      </div>
                    </div>
                    <span className="font-mono tabular-nums">
                      {fmtMoney(it.price * it.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center justify-between border-t pt-4">
                <span className="font-semibold text-muted-foreground">Total</span>
                <span className="font-display text-2xl font-bold">
                  {fmtMoney(order.totalAmount)}
                </span>
              </div>
            </div>

            <Button className="w-full" variant="outline" onClick={onClose}>
              Close
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
