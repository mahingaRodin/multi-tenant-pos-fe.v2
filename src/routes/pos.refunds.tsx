import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RotateCcw, Search, Loader2, Calendar, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { AppShell } from "@/components/layout/AppShell";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import type { RefundDto, OrderDto } from "@/lib/types";
import { fmtMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useShiftStore } from "@/stores/shiftStore";

export const Route = createFileRoute("/pos/refunds")({
  component: () => (
    <AppShell allow={["ROLE_BRANCH_CASHIER"]}>
      <RefundsPage />
    </AppShell>
  ),
});

function RefundsPage() {
  const { branchId, userId, user } = useAuthStore();
  const { currentShift } = useShiftStore();
  const [refunds, setRefunds] = useState<RefundDto[]>([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);

  const fetchRefunds = async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const res = await api.get<RefundDto[]>(`/api/refunds/branch/${branchId}`);
      setRefunds(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  return (
    <div className="flex h-full flex-col bg-muted/20">
      <div className="border-b bg-card px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Refunds</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Process customer returns and view refund history.
            </p>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <RotateCcw className="mr-2 size-4" />
            Process Refund
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : refunds.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed bg-card text-center shadow-sm">
            <RotateCcw className="mb-4 size-12 text-muted-foreground/50" />
            <h3 className="font-display text-lg font-bold">No refunds yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Refunds processed at this branch will appear here.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4 font-medium">Refund ID</th>
                    <th className="px-6 py-4 font-medium">Order ID</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Reason</th>
                    <th className="px-6 py-4 font-medium">Cashier</th>
                    <th className="px-6 py-4 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {refunds.map((refund) => (
                    <tr key={refund.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                        {refund.id?.slice(0, 12)}...
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">
                        {refund.orderId?.slice(0, 8)}...
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="size-4 text-muted-foreground" />
                          <span>
                            {refund.createdAt
                              ? format(new Date(refund.createdAt), "MMM d, yyyy h:mm a")
                              : "-"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge variant="warning">{refund.reason || "Return"}</StatusBadge>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {refund.cashierName || "Unknown"}
                      </td>
                      <td className="px-6 py-4 text-right font-display font-bold text-destructive">
                        -{fmtMoney(refund.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <RefundFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchRefunds}
        branchId={branchId}
        cashierName={user?.firstName ? `${user.firstName} ${user.lastName}` : user?.email}
        shiftId={currentShift?.id}
      />
    </div>
  );
}

function RefundFormModal({ open, onClose, onSuccess, branchId, cashierName, shiftId }: any) {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);

  const [reason, setReason] = useState("Customer Return");
  const [submitting, setSubmitting] = useState(false);

  // A real system would track per-item refund amounts. Here we do a full order refund for simplicity.

  const fetchOrder = async () => {
    if (!orderId.trim()) return;
    setLoadingOrder(true);
    try {
      const res = await api.get<OrderDto>(`/api/orders/${orderId.trim()}`);
      setOrder(res.data);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
      setOrder(null);
    } finally {
      setLoadingOrder(false);
    }
  };

  const handleRefund = async () => {
    if (!order) return;
    setSubmitting(true);
    try {
      await api.post(`/api/refunds`, {
        orderId: order.id,
        amount: order.totalAmount, // full refund
        reason,
        branchId,
        shiftReportId: shiftId,
        cashierName,
        paymentType: order.paymentType,
      });
      toast.success("Refund processed successfully");
      setOrder(null);
      setOrderId("");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Process Refund</DialogTitle>
          <DialogDescription>Look up an order by ID to process a return.</DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label>Order ID</Label>
            <div className="flex gap-2">
              <Input
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Enter full Order ID..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") fetchOrder();
                }}
              />
              <Button variant="secondary" onClick={fetchOrder} disabled={loadingOrder}>
                {loadingOrder ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Search className="size-4" />
                )}
              </Button>
            </div>
          </div>

          {order && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="mb-3 flex items-center justify-between border-b pb-3 text-sm">
                <span className="text-muted-foreground">Order Date</span>
                <span className="font-medium">
                  {order.createdAt ? format(new Date(order.createdAt), "MMM d, yyyy h:mm a") : "-"}
                </span>
              </div>
              <div className="mb-3 flex items-center justify-between border-b pb-3 text-sm">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="font-medium capitalize">{order.paymentType.toLowerCase()}</span>
              </div>

              <div className="text-sm font-medium mb-2">
                Order Items ({order.items?.length || 0})
              </div>
              <ul className="space-y-1 mb-4 text-xs text-muted-foreground">
                {order.items?.slice(0, 3).map((it: any, i: number) => (
                  <li key={i} className="flex justify-between">
                    <span>
                      {it.quantity}x {it.product?.name || `ID: ${it.productId.slice(0, 8)}`}
                    </span>
                    <span>{fmtMoney(it.price * it.quantity)}</span>
                  </li>
                ))}
                {(order.items?.length || 0) > 3 && <li>...and more</li>}
              </ul>

              <div className="flex items-center justify-between rounded bg-background p-2 text-sm font-bold">
                <span>Refund Amount</span>
                <span className="text-destructive font-display text-lg">
                  {fmtMoney(order.totalAmount)}
                </span>
              </div>
            </div>
          )}

          {order && (
            <div className="space-y-2">
              <Label>Reason for Refund</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Customer Return">Customer Return</SelectItem>
                  <SelectItem value="Defective Product">Defective Product</SelectItem>
                  <SelectItem value="Wrong Item">Wrong Item Scanned</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {!shiftId && (
            <div className="flex items-center gap-2 rounded-lg bg-warning/10 p-3 text-sm text-warning-foreground">
              <AlertCircle className="size-4 shrink-0" />
              <span>
                You don't have an active shift. This refund will not be linked to a shift report.
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={!order || submitting} onClick={handleRefund}>
            {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Confirm Refund
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
