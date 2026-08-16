import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { api, getApiErrorMessage } from "@/lib/api";
import type { BranchDto, PagedResponse, ProductDto } from "@/lib/types";
import { fmtMoney, productImg } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { DemoCardFields, emptyDemoCard, type DemoCardState } from "@/components/shared/DemoCardFields";
import { PaginationBar } from "@/components/shared/PaginationBar";

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
  const [paymentType, setPaymentType] = useState("CARD");
  const [card, setCard] = useState<DemoCardState>(emptyDemoCard());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE = 5;

  const load = async () => {
    setLoading(true);
    try {
      const [cart, br] = await Promise.all([
        api.get<Line[]>("/api/shop/cart"),
        api.get<PagedResponse<BranchDto>>("/api/catalog/branches", { params: { size: 100 } }),
      ]);
      setLines(cart.data ?? []);
      setBranches(br.data.content ?? []);
      if (!branchId && (cart.data?.[0]?.branchId)) setBranchId(cart.data[0].branchId!);
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const total = useMemo(
    () => lines.reduce((s, l) => s + (l.product.sellingPrice ?? 0) * l.quantity, 0),
    [lines],
  );
  const totalPages = Math.max(1, Math.ceil(lines.length / PAGE));
  const pageLines = lines.slice(page * PAGE, page * PAGE + PAGE);

  const checkout = async () => {
    if (!branchId) { toast.error("Pick a fulfillment branch"); return; }
    if (paymentType === "CARD" && !card.cardNumber.trim()) {
      toast.error("Enter demo card details");
      return;
    }
    setBusy(true);
    try {
      await api.post("/api/shop/checkout", {
        branchId,
        paymentType,
        ...(paymentType === "CARD" ? card : {}),
      });
      toast.success("Order placed successfully");
      setPage(0);
      await load();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Your cart</h1>
          <p className="text-sm text-muted-foreground">Saved to your account — still here next time you sign in.</p>
        </div>
        <Button asChild variant="outline"><Link to="/customer/portal">Continue shopping</Link></Button>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>
      ) : lines.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
          <ShoppingBag className="mb-3 size-10 text-muted-foreground/40" />
          <h2 className="font-display text-xl font-semibold">Cart is empty</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">Browse the marketplace and add products you like.</p>
          <Button className="mt-6" asChild><Link to="/customer/portal">Browse products</Link></Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-3">
            {pageLines.map((l) => (
              <div key={l.id} className="flex gap-4 rounded-2xl border bg-card p-4">
                <img src={productImg(l.product.image)} alt="" className="size-20 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{l.product.name}</p>
                  <p className="text-sm text-muted-foreground">{fmtMoney(l.product.sellingPrice)} each</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <div className="inline-flex items-center rounded-lg border">
                      <button type="button" className="p-2" aria-label="Decrease" onClick={async () => {
                        if (l.quantity <= 1) {
                          await api.delete(`/api/shop/cart/${l.product.id}`);
                        } else {
                          await api.delete(`/api/shop/cart/${l.product.id}`);
                          await api.post("/api/shop/cart", { productId: l.product.id, quantity: l.quantity - 1, branchId: l.branchId });
                        }
                        await load();
                      }}><Minus className="size-3.5" /></button>
                      <span className="w-8 text-center text-sm font-medium">{l.quantity}</span>
                      <button type="button" className="p-2" aria-label="Increase" onClick={async () => {
                        await api.post("/api/shop/cart", { productId: l.product.id, quantity: 1, branchId: l.branchId });
                        await load();
                      }}><Plus className="size-3.5" /></button>
                    </div>
                    <p className="font-semibold">{fmtMoney((l.product.sellingPrice ?? 0) * l.quantity)}</p>
                    <button type="button" className="ml-auto inline-flex items-center gap-1 text-xs text-red-600 hover:underline" onClick={async () => {
                      await api.delete(`/api/shop/cart/${l.product.id}`);
                      await load();
                    }}>
                      <Trash2 className="size-3.5" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <PaginationBar page={page} totalPages={totalPages} total={lines.length} onPage={setPage} />
          </div>

          <aside className="h-fit space-y-4 rounded-2xl border bg-card p-5 lg:sticky lg:top-20">
            <h2 className="font-semibold">Checkout</h2>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">Fulfillment branch</label>
              <select className="w-full rounded-lg border bg-background px-3 py-2 text-sm" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                <option value="">Select branch</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">Payment</label>
              <select className="w-full rounded-lg border bg-background px-3 py-2 text-sm" value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
                <option value="CARD">Card</option>
                <option value="CASH">Cash on pickup</option>
                <option value="UPI">UPI</option>
              </select>
            </div>
            {paymentType === "CARD" && <DemoCardFields value={card} onChange={setCard} />}
            <div className="flex items-center justify-between border-t pt-4">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-display text-2xl font-bold">{fmtMoney(total)}</span>
            </div>
            <Button className="w-full" disabled={busy} onClick={checkout}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              Place order & pay
            </Button>
          </aside>
        </div>
      )}
    </div>
  );
}
