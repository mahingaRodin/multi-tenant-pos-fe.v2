import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { Search, Loader2, PackageOpen, AlertTriangle, Package, Check, X, Plus } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import type { InventoryDto, ProductDto } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/branch/inventory")({
  component: () => (
    <AppShell allow={["ROLE_BRANCH_MANAGER"]}>
      <InventoryPage />
    </AppShell>
  ),
});

function InventoryPage() {
  const { branchId, storeId } = useAuthStore();
  const [inventories, setInventories] = useState<InventoryDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]); // for assigning new inventory
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState<string>("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchData = async () => {
    if (!branchId || !storeId) return;
    setLoading(true);
    try {
      const [invRes, prodRes] = await Promise.all([
        api.get<InventoryDto[]>(`/api/inventories/branch/${branchId}`),
        api.get<ProductDto[]>(`/api/products/store/${storeId}`),
      ]);
      setInventories(Array.isArray(invRes.data) ? invRes.data : []);
      setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId, storeId]);

  const handleSaveStock = async (invId: string) => {
    const qty = parseInt(editQty, 10);
    if (isNaN(qty) || qty < 0) {
      toast.error("Please enter a valid positive quantity");
      return;
    }
    setSavingId(invId);
    try {
      await api.put(`/api/inventories/${invId}`, { quantity: qty });
      toast.success("Stock updated");
      setEditingId(null);
      fetchData();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSavingId(null);
    }
  };

  // Missing inventories logic: products that don't have an inventory record yet
  const handleCreateInventory = async (productId: string, initialQty: number = 0) => {
    if (!branchId) return;
    try {
      await api.post(`/api/inventories`, {
        branchId,
        productId,
        quantity: initialQty,
      });
      toast.success("Inventory record created");
      fetchData();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const filteredInventories = useMemo(() => {
    return inventories.filter((inv) => {
      const name = inv.product?.name?.toLowerCase() || "";
      const sku = inv.product?.sku?.toLowerCase() || "";
      const q = searchQuery.toLowerCase();
      return name.includes(q) || sku.includes(q);
    });
  }, [inventories, searchQuery]);

  return (
    <div className="flex h-full flex-col bg-muted/20">
      <div className="border-b bg-card px-6 py-5">
        <h1 className="font-display text-2xl font-bold">Inventory</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor and update stock levels for this branch.
        </p>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product or SKU..."
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
        ) : filteredInventories.length === 0 && searchQuery ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed bg-card text-center shadow-sm">
            <PackageOpen className="mb-4 size-12 text-muted-foreground/50" />
            <h3 className="font-display text-lg font-bold">No items match your search</h3>
          </div>
        ) : (
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4 font-medium">Product</th>
                    <th className="px-6 py-4 font-medium">SKU</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Current Stock</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredInventories.map((inv) => {
                    const isEditing = editingId === inv.id;
                    const isLow = inv.quantity <= 5;
                    const isOut = inv.quantity === 0;
                    return (
                      <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded bg-muted overflow-hidden">
                              {inv.product?.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={inv.product.image}
                                  alt={inv.product.name}
                                  className="object-cover w-full h-full"
                                />
                              ) : (
                                <Package className="size-5 text-muted-foreground" />
                              )}
                            </div>
                            <span className="font-medium line-clamp-2 max-w-[200px]">
                              {inv.product?.name || "Unknown Product"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                          {inv.product?.sku || "-"}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge
                            variant={isOut ? "danger" : isLow ? "pending" : "active"}
                            className="px-2.5 py-0.5 whitespace-nowrap"
                          >
                            {isOut ? "Out of Stock" : isLow ? "Low Stock" : "In Stock"}
                          </StatusBadge>
                        </td>
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <div className="flex items-center gap-2 max-w-[120px]">
                              <Input
                                type="number"
                                min="0"
                                value={editQty}
                                onChange={(e) => setEditQty(e.target.value)}
                                className="h-8 text-sm"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") inv.id && handleSaveStock(inv.id);
                                  if (e.key === "Escape") setEditingId(null);
                                }}
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "font-bold text-base tabular-nums",
                                  isLow && "text-warning",
                                  isOut && "text-destructive",
                                )}
                              >
                                {inv.quantity}
                              </span>
                              {isLow && !isOut && <AlertTriangle className="size-4 text-warning" />}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingId(null)}
                                className="h-8 w-8 p-0"
                              >
                                <X className="size-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => inv.id && handleSaveStock(inv.id)}
                                disabled={savingId === inv.id}
                                className="h-8 w-8 p-0 bg-primary/20 text-primary hover:bg-primary/30 hover:text-primary"
                              >
                                {savingId === inv.id ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <Check className="size-4" />
                                )}
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingId(inv.id!);
                                setEditQty(String(inv.quantity));
                              }}
                            >
                              Update Stock
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Missing Inventory Records Section */}
        {!loading && products.length > 0 && (
          <div className="mt-8">
            <h2 className="font-display text-lg font-bold mb-4">Unassigned Products</h2>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-sm text-muted-foreground mb-4">
                These products from the store catalog don't have an inventory record in your branch
                yet.
              </p>
              <div className="flex flex-wrap gap-2">
                {products
                  .filter((p) => !inventories.some((inv) => inv.productId === p.id))
                  .slice(0, 10)
                  .map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 bg-muted/50 rounded-full pl-3 pr-1 py-1 border text-sm"
                    >
                      <span className="truncate max-w-[150px]">{p.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 rounded-full bg-background"
                        onClick={() => p.id && handleCreateInventory(p.id)}
                        title="Add to branch inventory"
                      >
                        <Plus className="size-3" />
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
