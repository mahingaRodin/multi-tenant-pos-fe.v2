import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Minus,
  X,
  ShoppingCart,
  Play,
  Square,
  AlertTriangle,
  UserPlus,
  Loader2,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
} from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";
import { useShiftStore } from "@/stores/shiftStore";
import type {
  CustomerDto,
  InventoryDto,
  OrderDto,
  PaymentType,
  ProductDto,
  ShiftReportDto,
  PagedResponse,
} from "@/lib/types";
import { fmtMoney, productImg } from "@/lib/format";
import { PaginationBar, unwrapPage } from "@/components/shared/PaginationBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pos/")({
  component: () => (
    <AppShell allow={["ROLE_BRANCH_CASHIER"]}>
      <PosTerminal />
    </AppShell>
  ),
});

function PosTerminal() {
  const { storeId, branchId, userId } = useAuthStore();
  const { items, addItem, removeItem, updateQty, clearCart, customerId, setCustomer, subtotal } =
    useCartStore();
  const { currentShift, setCurrentShift } = useShiftStore();

  const [products, setProducts] = useState<ProductDto[]>([]);
  const [productPage, setProductPage] = useState(0);
  const [productPages, setProductPages] = useState(1);
  const [productTotal, setProductTotal] = useState(0);
  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [productQuery, setProductQuery] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [shiftLoading, setShiftLoading] = useState(false);

  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [customerQuery, setCustomerQuery] = useState("");
  const [showNewCustomer, setShowNewCustomer] = useState(false);

  const [paymentType, setPaymentType] = useState<PaymentType>("CASH");
  const [tendered, setTendered] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<OrderDto | null>(null);
  const [elapsed, setElapsed] = useState<string>("");

  const TAX_RATE = 0;
  const sub = subtotal();
  const tax = sub * TAX_RATE;
  const total = sub + tax;

  // Load shift on mount
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const r = await api.get<ShiftReportDto>("/api/shift-reports/current");
        if (active) setCurrentShift(r.data ?? null);
      } catch {
        // No active shift is fine
        if (active) setCurrentShift(null);
      }
    })();
    return () => {
      active = false;
    };
  }, [setCurrentShift]);

  // Load products
  useEffect(() => {
    if (!storeId) return;
    let active = true;
    setLoadingProducts(true);
    (async () => {
      try {
        const r = await api.get<PagedResponse<ProductDto>>(
          productQuery.trim() ? `/api/products/store/${storeId}/search` : `/api/products/store/${storeId}`,
          { params: { page: productPage, size: 12, keyword: productQuery.trim() || undefined } },
        );
        if (active) {
          const u = unwrapPage<ProductDto>(r.data);
          setProducts(u.items);
          setProductPages(u.totalPages);
          setProductTotal(u.total);
        }
      } catch (err) {
        if (active) toast.error(getApiErrorMessage(err));
      } finally {
        if (active) setLoadingProducts(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [storeId, productQuery, productPage]);

  // Load inventory
  useEffect(() => {
    if (!branchId) return;
    let active = true;
    (async () => {
      try {
        const r = await api.get<PagedResponse<InventoryDto>>(`/api/inventories/branch/${branchId}`, {
          params: { page: 0, size: 200 },
        });
        if (!active) return;
        const map: Record<string, number> = {};
        for (const inv of unwrapPage<InventoryDto>(r.data).items) {
          if (inv.productId) map[inv.productId] = inv.quantity;
        }
        setInventory(map);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      active = false;
    };
  }, [branchId]);

  // Customer search (debounced)
  useEffect(() => {
    const handle = setTimeout(async () => {
      try {
        const path = customerQuery.trim()
          ? `/api/customers/search?query=${encodeURIComponent(customerQuery.trim())}`
          : `/api/customers`;
        const r = await api.get<CustomerDto[]>(path);
        setCustomers(Array.isArray(r.data) ? r.data.slice(0, 8) : []);
      } catch {
        /* ignore */
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [customerQuery]);

  // Elapsed time
  useEffect(() => {
    if (!currentShift?.shiftStart) {
      setElapsed("");
      return;
    }
    const start = new Date(currentShift.shiftStart).getTime();
    const tick = () => {
      const ms = Date.now() - start;
      const h = Math.floor(ms / 3_600_000);
      const m = Math.floor((ms % 3_600_000) / 60_000);
      const s = Math.floor((ms % 60_000) / 1000);
      setElapsed(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [currentShift?.shiftStart]);

  const startShift = async () => {
    setShiftLoading(true);
    try {
      const r = await api.post<ShiftReportDto>("/api/shift-reports/start");
      setCurrentShift(r.data);
      toast.success("Shift started");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setShiftLoading(false);
    }
  };

  const endShift = async () => {
    setShiftLoading(true);
    try {
      const r = await api.patch<ShiftReportDto>("/api/shift-reports/end");
      setCurrentShift(null);
      toast.success(`Shift ended — ${fmtMoney(r.data?.totalSales)} in sales`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setShiftLoading(false);
    }
  };

  const checkout = async () => {
    if (!branchId) {
      toast.error("Missing branch context");
      return;
    }
    if (items.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    if (!currentShift) {
      toast.error("Start a shift before checking out");
      return;
    }
    if (paymentType === "CASH" && Number(tendered || 0) < total) {
      toast.error("Cash tendered is less than total");
      return;
    }
    const payload: OrderDto = {
      branchId,
      cashierId: userId ?? undefined,
      customerId: customerId ?? undefined,
      paymentType,
      totalAmount: total,
      items: items.map((i) => ({
        productId: i.product.id!,
        quantity: i.quantity,
        price: i.product.sellingPrice ?? 0,
      })),
    };
    setSubmitting(true);
    try {
      const r = await api.post<OrderDto>("/api/orders", payload);
      setReceipt(r.data);
      clearCart();
      setTendered("");
      toast.success("Order completed");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const change = paymentType === "CASH" ? Math.max(0, Number(tendered || 0) - total) : 0;

  const grouped = useMemo(() => {
    const byCat = new Map<string, ProductDto[]>();
    for (const p of products) {
      const key = p.category?.name ?? "Uncategorized";
      const arr = byCat.get(key) ?? [];
      arr.push(p);
      byCat.set(key, arr);
    }
    return Array.from(byCat.entries());
  }, [products]);

  const [activeCategory, setActiveCategory] = useState<string>("All");
  const visibleProducts = useMemo(() => {
    if (activeCategory === "All") return products;
    return products.filter((p) => (p.category?.name ?? "Uncategorized") === activeCategory);
  }, [products, activeCategory]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Shift bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-card px-3 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          {currentShift ? (
            <>
              <StatusBadge variant="active">Shift Active</StatusBadge>
              <span className="font-mono text-sm tabular-nums">{elapsed}</span>
            </>
          ) : (
            <StatusBadge variant="muted">No Active Shift</StatusBadge>
          )}
        </div>
        <div>
          {currentShift ? (
            <Button variant="outline" onClick={endShift} disabled={shiftLoading}>
              {shiftLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Square className="size-4" />
              )}
              End Shift
            </Button>
          ) : (
            <Button onClick={startShift} disabled={shiftLoading}>
              {shiftLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Play className="size-4" />
              )}
              Start Shift
            </Button>
          )}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[1fr_min(420px,40vw)] lg:overflow-hidden">
        {/* LEFT: products */}
        <div className="flex flex-col overflow-hidden border-r">
          <div className="border-b bg-card p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                placeholder="Search by name, SKU, or barcode…"
                className="pl-9 h-11"
                autoFocus
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <CategoryChip
                label={`All (${products.length})`}
                active={activeCategory === "All"}
                onClick={() => setActiveCategory("All")}
              />
              {grouped.map(([name, list]) => (
                <CategoryChip
                  key={name}
                  label={`${name} (${list.length})`}
                  active={activeCategory === name}
                  onClick={() => setActiveCategory(name)}
                />
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {loadingProducts ? (
              <div className="grid place-items-center py-20 text-muted-foreground">
                <Loader2 className="size-6 animate-spin" />
              </div>
            ) : visibleProducts.length === 0 ? (
              <div className="grid place-items-center py-20 text-center text-muted-foreground">
                <Search className="mb-2 size-8" />
                No products found
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {visibleProducts.map((p) => {
                  const stock = p.id ? inventory[p.id] : undefined;
                  const low = stock !== undefined && stock <= 5;
                  const out = stock === 0;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        if (out) {
                          toast.error("Out of stock");
                          return;
                        }
                        addItem(p);
                      }}
                      disabled={out}
                      className={cn(
                        "group relative flex flex-col rounded-xl border bg-card p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50",
                      )}
                    >
                      <div className="mb-2 grid aspect-square place-items-center overflow-hidden rounded-lg bg-muted">
                        <img src={productImg(p.image)} alt={p.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="line-clamp-2 text-sm font-medium">{p.name}</div>
                      {p.sku && <div className="text-xs text-muted-foreground">{p.sku}</div>}
                      <div className="mt-1 flex items-end justify-between">
                        <div className="font-display text-base font-bold">
                          {fmtMoney(p.sellingPrice)}
                        </div>
                        {stock !== undefined && (
                          <StatusBadge
                            variant={out ? "danger" : low ? "pending" : "muted"}
                            className="px-1.5 py-0 text-[10px]"
                          >
                            {out ? "Out" : `${stock} left`}
                          </StatusBadge>
                        )}
                      </div>
                      {low && !out && (
                        <AlertTriangle className="absolute right-2 top-2 size-4 text-warning" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            <PaginationBar
              page={productPage}
              totalPages={productPages}
              total={productTotal}
              onPage={(p) => setProductPage(p)}
            />
          </div>
        </div>

        {/* RIGHT: cart */}
        <aside className="flex flex-col overflow-hidden bg-card">
          <div className="border-b p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Current Sale</h2>
              {items.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearCart}>
                  Clear
                </Button>
              )}
            </div>
            {/* Customer */}
            <div className="mt-3 space-y-2">
              <Label className="text-xs">Customer</Label>
              <div className="relative">
                <Input
                  value={customerQuery}
                  onChange={(e) => setCustomerQuery(e.target.value)}
                  placeholder="Search customer or leave blank for guest"
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowNewCustomer(true)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted"
                  title="New customer"
                >
                  <UserPlus className="size-4" />
                </button>
              </div>
              {customerQuery && customers.length > 0 && (
                <div className="max-h-40 overflow-auto rounded-md border bg-popover">
                  {customers.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setCustomer(c.id ?? null);
                        setCustomerQuery(`${c.firstName} ${c.lastName}`);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent/10",
                        customerId === c.id && "bg-accent/15",
                      )}
                    >
                      <span>
                        {c.firstName} {c.lastName}
                      </span>
                      <span className="text-xs text-muted-foreground">{c.email}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {items.length === 0 ? (
              <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">
                <div>
                  <ShoppingCart className="mx-auto mb-2 size-10 opacity-30" />
                  Tap a product to add it
                </div>
              </div>
            ) : (
              <ul className="space-y-2">
                {items.map((i) => (
                  <li
                    key={i.product.id}
                    className="flex items-center gap-2 rounded-lg border bg-background p-2"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm font-medium">{i.product.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {fmtMoney(i.product.sellingPrice)} ea
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="outline"
                        className="size-7"
                        onClick={() => updateQty(i.product.id!, i.quantity - 1)}
                      >
                        <Minus className="size-3" />
                      </Button>
                      <span className="w-7 text-center text-sm font-medium tabular-nums">
                        {i.quantity}
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="size-7"
                        onClick={() => updateQty(i.product.id!, i.quantity + 1)}
                      >
                        <Plus className="size-3" />
                      </Button>
                    </div>
                    <div className="w-20 text-right text-sm font-semibold tabular-nums">
                      {fmtMoney((i.product.sellingPrice ?? 0) * i.quantity)}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 text-muted-foreground"
                      onClick={() => removeItem(i.product.id!)}
                    >
                      <X className="size-3" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-3 border-t p-4">
            <div className="space-y-1 text-sm">
              <Row label="Subtotal" value={fmtMoney(sub)} />
              {TAX_RATE > 0 && <Row label={`Tax (${TAX_RATE * 100}%)`} value={fmtMoney(tax)} />}
              <div className="flex items-center justify-between border-t pt-2">
                <span className="font-display text-base font-bold">Total</span>
                <span className="font-display text-xl font-bold">{fmtMoney(total)}</span>
              </div>
            </div>

            <div>
              <Label className="text-xs">Payment</Label>
              <div className="mt-1 grid grid-cols-3 gap-2">
                <PayBtn
                  active={paymentType === "CASH"}
                  onClick={() => setPaymentType("CASH")}
                  icon={Banknote}
                  label="Cash"
                />
                <PayBtn
                  active={paymentType === "CARD"}
                  onClick={() => setPaymentType("CARD")}
                  icon={CreditCard}
                  label="Card"
                />
                <PayBtn
                  active={paymentType === "UPI"}
                  onClick={() => setPaymentType("UPI")}
                  icon={Smartphone}
                  label="UPI"
                />
              </div>
            </div>

            {paymentType === "CASH" && (
              <div className="space-y-1">
                <Label className="text-xs">Cash tendered</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={tendered}
                  onChange={(e) => setTendered(e.target.value)}
                  placeholder="0.00"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Change</span>
                  <span className="font-mono tabular-nums">{fmtMoney(change)}</span>
                </div>
              </div>
            )}

            <Button
              size="lg"
              className="w-full"
              disabled={submitting || items.length === 0}
              onClick={checkout}
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              Charge {fmtMoney(total)}
            </Button>
          </div>
        </aside>
      </div>

      {/* New customer dialog */}
      <NewCustomerDialog
        open={showNewCustomer}
        onClose={() => setShowNewCustomer(false)}
        onCreated={(c) => {
          setCustomer(c.id ?? null);
          setCustomerQuery(`${c.firstName} ${c.lastName}`);
          setShowNewCustomer(false);
        }}
      />

      {/* Receipt */}
      <ReceiptDialog order={receipt} onClose={() => setReceipt(null)} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="font-mono tabular-nums text-foreground">{value}</span>
    </div>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-accent bg-accent text-accent-foreground"
          : "border-border bg-background text-muted-foreground hover:border-accent/50",
      )}
    >
      {label}
    </button>
  );
}

function PayBtn({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof CreditCard;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 rounded-lg border py-2 text-xs font-medium transition-colors",
        active
          ? "border-accent bg-accent/10 text-accent"
          : "border-border bg-background text-muted-foreground hover:border-accent/50",
      )}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}

function NewCustomerDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (c: CustomerDto) => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      toast.error("First name, last name and email are required");
      return;
    }
    setBusy(true);
    try {
      const r = await api.post<CustomerDto>("/api/customers", {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
      });
      toast.success("Customer added");
      onCreated(r.data);
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New customer</DialogTitle>
          <DialogDescription>Quick-add a customer to attach to this sale.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>First name</Label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Last name</Label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <div className="col-span-2 space-y-1">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="col-span-2 space-y-1">
            <Label>Phone (optional)</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />}Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReceiptDialog({ order, onClose }: { order: OrderDto | null; onClose: () => void }) {
  return (
    <Dialog open={!!order} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-success/15 text-success">
            <CheckCircle2 className="size-6" />
          </div>
          <DialogTitle className="text-center">Order completed</DialogTitle>
          <DialogDescription className="text-center">
            {order?.id && <span className="font-mono text-xs">#{order.id.slice(0, 8)}</span>}
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border bg-muted/30 p-4">
          <ul className="space-y-1 text-sm">
            {order?.items?.map((it, idx) => (
              <li key={idx} className="flex justify-between">
                <span>
                  {it.quantity} × {it.product?.name ?? it.productId.slice(0, 8)}
                </span>
                <span className="font-mono tabular-nums">{fmtMoney(it.price * it.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between border-t pt-3">
            <span className="font-semibold">Total</span>
            <span className="font-display text-lg font-bold">{fmtMoney(order?.totalAmount)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>Payment</span>
            <span>{order?.paymentType}</span>
          </div>
        </div>
        <DialogFooter>
          <Button className="w-full" onClick={onClose}>
            New sale
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
