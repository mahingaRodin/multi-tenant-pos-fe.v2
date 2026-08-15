import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { api, getApiErrorMessage } from "@/lib/api";
import type { BranchDto, PagedResponse, ProductDto } from "@/lib/types";
import { fmtMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/customer/cart")({
  component: () => (
    <AppShell allow={["ROLE_CUSTOMER"]}>
      <CartPage />
    </AppShell>
  ),
});

type Line = { id: string; quantity: number; branchId?: string; product: ProductDto };

function CartPage() {
  const [lines, setLines] = useState<Line[]>([]);
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [branchId, setBranchId] = useState("");
  const [paymentType, setPaymentType] = useState("CASH");

  const load = async () => {
    const [cart, br] = await Promise.all([
      api.get<Line[]>("/api/shop/cart"),
      api.get<PagedResponse<BranchDto>>("/api/catalog/branches", { params: { size: 100 } }),
    ]);
    setLines(cart.data ?? []);
    setBranches(br.data.content ?? []);
  };
  useEffect(() => { load().catch((e) => toast.error(getApiErrorMessage(e))); }, []);

  const checkout = async () => {
    if (!branchId) { toast.error("Pick a branch for pickup/fulfillment"); return; }
    try {
      await api.post("/api/shop/checkout", { branchId, paymentType });
      toast.success("Order placed");
      await load();
    } catch (e) { toast.error(getApiErrorMessage(e)); }
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="font-display text-2xl font-bold">Cart</h1>
      <div className="mt-4 space-y-3">
        {lines.map((l) => (
          <div key={l.id} className="flex items-center justify-between rounded-xl border p-3">
            <div>
              <p className="font-semibold">{l.product.name}</p>
              <p className="text-sm text-muted-foreground">Qty {l.quantity} · {fmtMoney((l.product.sellingPrice ?? 0) * l.quantity)}</p>
            </div>
            <Button variant="ghost" onClick={async () => { await api.delete(`/api/shop/cart/${l.product.id}`); await load(); }}>Remove</Button>
          </div>
        ))}
        {lines.length === 0 && <p className="text-sm text-muted-foreground">Cart is empty. <Link to="/customer/portal" className="text-primary">Browse products</Link></p>}
      </div>
      {lines.length > 0 && (
        <div className="mt-6 grid gap-3">
          <select className="rounded-lg border bg-background px-3 py-2" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
            <option value="">Fulfillment branch</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select className="rounded-lg border bg-background px-3 py-2" value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
            <option value="UPI">UPI</option>
          </select>
          <Button onClick={checkout}>Checkout</Button>
        </div>
      )}
    </div>
  );
}
