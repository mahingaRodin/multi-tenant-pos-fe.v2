import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { api, getApiErrorMessage } from "@/lib/api";
import type { PagedResponse, ProductDto } from "@/lib/types";
import { fmtMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/customer/favorites")({
  component: () => (
    <AppShell allow={["ROLE_CUSTOMER"]}>
      <FavoritesPage />
    </AppShell>
  ),
});

function FavoritesPage() {
  const [items, setItems] = useState<ProductDto[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const load = async (p = 0) => {
    try {
      const res = await api.get<PagedResponse<ProductDto>>("/api/shop/favorites", { params: { page: p, size: 12 } });
      setItems(res.data.content ?? []);
      setTotalPages(res.data.totalPages ?? 0);
      setPage(p);
    } catch (e) { toast.error(getApiErrorMessage(e)); }
  };
  useEffect(() => { load(0); }, []);

  return (
    <div className="p-6">
      <h1 className="font-display text-2xl font-bold">Favorites</h1>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <div key={p.id} className="rounded-xl border p-4">
            <h3 className="font-semibold">{p.name}</h3>
            <p className="text-sm">{fmtMoney(p.sellingPrice)}</p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" onClick={async () => { await api.post("/api/shop/cart", { productId: p.id, quantity: 1 }); toast.success("Added to cart"); }}>Add to cart</Button>
              <Button size="sm" variant="outline" onClick={async () => { await api.delete(`/api/shop/favorites/${p.id}`); load(page); }}>Remove</Button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <Button variant="outline" disabled={page === 0} onClick={() => load(page - 1)}>Previous</Button>
        <Button variant="outline" disabled={page + 1 >= totalPages} onClick={() => load(page + 1)}>Next</Button>
      </div>
    </div>
  );
}
