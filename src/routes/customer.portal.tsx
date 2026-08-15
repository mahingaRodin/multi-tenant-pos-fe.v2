import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, Search, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { api, getApiErrorMessage } from "@/lib/api";
import type { BranchDto, CategoryDto, PagedResponse, ProductDto, StoreDto } from "@/lib/types";
import { fmtMoney, productImg } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/customer/portal")({
  component: () => (
    <AppShell allow={["ROLE_CUSTOMER"]}>
      <Shop />
    </AppShell>
  ),
});

function Shop() {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [q, setQ] = useState("");
  const [storeId, setStoreId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brand, setBrand] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStock, setInStock] = useState(false);
  const [sortBy, setSortBy] = useState("createdAt");
  const [direction, setDirection] = useState("DESC");
  const [stores, setStores] = useState<StoreDto[]>([]);
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [favs, setFavs] = useState<Set<string>>(new Set());

  const loadMeta = async () => {
    const [s, b, c, br] = await Promise.all([
      api.get<PagedResponse<StoreDto>>("/api/catalog/stores", { params: { size: 100 } }),
      api.get<PagedResponse<BranchDto>>("/api/catalog/branches", { params: { size: 100, storeId: storeId || undefined } }),
      api.get<CategoryDto[]>("/api/catalog/categories", { params: { storeId: storeId || undefined } }),
      api.get<string[]>("/api/catalog/brands"),
    ]);
    setStores(s.data.content ?? []);
    setBranches(b.data.content ?? []);
    setCategories(Array.isArray(c.data) ? c.data : []);
    setBrands(br.data ?? []);
  };

  const load = async (p = 0) => {
    try {
      const res = await api.get<PagedResponse<ProductDto>>("/api/catalog/products", {
        params: {
          page: p, size: 12, q: q || undefined, storeId: storeId || undefined, branchId: branchId || undefined,
          categoryId: categoryId || undefined, brand: brand || undefined,
          minPrice: minPrice || undefined, maxPrice: maxPrice || undefined,
          inStock: inStock || undefined, sortBy, direction,
        },
      });
      setProducts(res.data.content ?? []);
      setTotalPages(res.data.totalPages ?? 0);
      setPage(p);
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  useEffect(() => { loadMeta(); load(0); }, []);
  useEffect(() => { loadMeta(); }, [storeId]);

  const addCart = async (id?: string) => {
    if (!id) return;
    try {
      await api.post("/api/shop/cart", { productId: id, quantity: 1, branchId: branchId || undefined });
      toast.success("Added to cart");
    } catch (e) { toast.error(getApiErrorMessage(e)); }
  };
  const toggleFav = async (id?: string) => {
    if (!id) return;
    try {
      if (favs.has(id)) {
        await api.delete(`/api/shop/favorites/${id}`);
        setFavs((s) => { const n = new Set(s); n.delete(id); return n; });
      } else {
        await api.post(`/api/shop/favorites/${id}`);
        setFavs((s) => new Set(s).add(id));
      }
    } catch (e) { toast.error(getApiErrorMessage(e)); }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Marketplace</h1>
          <p className="text-sm text-muted-foreground">All products, stores, and branches. Filter and sort any way you like.</p>
        </div>
        <Button asChild variant="outline"><Link to="/customer/cart">Cart</Link></Button>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-4 lg:grid-cols-6">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search name, brand, SKU…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="rounded-lg border bg-background px-2 py-2 text-sm" value={storeId} onChange={(e) => setStoreId(e.target.value)}>
          <option value="">All stores</option>
          {stores.map((s) => <option key={s.id} value={s.id}>{s.brand}</option>)}
        </select>
        <select className="rounded-lg border bg-background px-2 py-2 text-sm" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
          <option value="">All branches</option>
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select className="rounded-lg border bg-background px-2 py-2 text-sm" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="rounded-lg border bg-background px-2 py-2 text-sm" value={brand} onChange={(e) => setBrand(e.target.value)}>
          <option value="">All brands</option>
          {brands.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <Input placeholder="Min price" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
        <Input placeholder="Max price" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
        <select className="rounded-lg border bg-background px-2 py-2 text-sm" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="createdAt">Newest</option>
          <option value="name">Name</option>
          <option value="sellingPrice">Price</option>
          <option value="brand">Brand</option>
          <option value="mrp">MRP</option>
          <option value="sku">SKU</option>
        </select>
        <select className="rounded-lg border bg-background px-2 py-2 text-sm" value={direction} onChange={(e) => setDirection(e.target.value)}>
          <option value="DESC">Descending</option>
          <option value="ASC">Ascending</option>
        </select>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} /> In stock</label>
        <Button onClick={() => load(0)}>Apply filters</Button>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((p) => (
          <article key={p.id} className="overflow-hidden rounded-xl border bg-card">
            <div className="h-36 bg-muted">
              <img src={productImg(p.image)} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="p-3">
              <p className="text-xs text-muted-foreground">{p.storeBrand} · {p.categoryName ?? "General"}</p>
              <h3 className="font-semibold">{p.name}</h3>
              <p className="text-sm text-primary">{fmtMoney(p.sellingPrice)}</p>
              <p className="text-xs text-muted-foreground">Stock {p.stockQuantity ?? 0} · {p.brand}</p>
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={() => addCart(p.id)}><ShoppingCart className="size-3" /> Cart</Button>
                <Button size="sm" variant="outline" onClick={() => toggleFav(p.id)}><Heart className="size-3" /></Button>
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-6 flex gap-2">
        <Button variant="outline" disabled={page === 0} onClick={() => load(page - 1)}>Previous</Button>
        <Button variant="outline" disabled={page + 1 >= totalPages} onClick={() => load(page + 1)}>Next</Button>
      </div>
    </div>
  );
}
