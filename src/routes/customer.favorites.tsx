import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, Loader2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { api, getApiErrorMessage } from "@/lib/api";
import type { PagedResponse, ProductDto } from "@/lib/types";
import { fmtMoney, productImg } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { PaginationBar, unwrapPage } from "@/components/shared/PaginationBar";

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
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async (p = 0) => {
    setLoading(true);
    try {
      const res = await api.get<PagedResponse<ProductDto>>("/api/shop/favorites", { params: { page: p, size: 12 } });
      const u = unwrapPage<ProductDto>(res.data);
      setItems(u.items);
      setTotalPages(u.totalPages);
      setTotal(u.total);
      setPage(u.page);
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(0); }, []);

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Favorites</h1>
          <p className="text-sm text-muted-foreground">Saved products stay highlighted when you come back.</p>
        </div>
        <Button asChild variant="outline"><Link to="/customer/portal">Browse shop</Link></Button>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
          <Heart className="mb-3 size-10 text-muted-foreground/40" />
          <h2 className="font-display text-xl font-semibold">No favorites yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">Tap the heart on any product in the marketplace.</p>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((p) => (
              <article key={p.id} className="overflow-hidden rounded-2xl border bg-card">
                <div className="relative h-40 bg-muted">
                  <img src={productImg(p.image)} alt="" className="h-full w-full object-cover" />
                  <span className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-full bg-rose-600 text-white shadow">
                    <Heart className="size-4 fill-current" />
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold">{p.name}</h3>
                  <p className="text-sm text-primary">{fmtMoney(p.sellingPrice)}</p>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" onClick={async () => {
                      await api.post("/api/shop/cart", { productId: p.id, quantity: 1 });
                      toast.success("Added to cart");
                    }}>
                      <ShoppingCart className="size-3" /> Cart
                    </Button>
                    <Button size="sm" variant="outline" onClick={async () => {
                      await api.delete(`/api/shop/favorites/${p.id}`);
                      load(page);
                    }}>
                      Remove
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <PaginationBar page={page} totalPages={totalPages} total={total} onPage={load} />
        </>
      )}
    </div>
  );
}
