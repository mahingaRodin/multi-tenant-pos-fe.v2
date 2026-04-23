import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { ShoppingBag, Search, Loader2, Image as ImageIcon, Filter } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import type { ProductDto, CategoryDto } from "@/lib/types";
import { fmtMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/customer/portal")({
  component: () => (
    <AppShell allow={["ROLE_CUSTOMER"]}>
      <CustomerStorefront />
    </AppShell>
  ),
});

function CustomerStorefront() {
  const { storeId, user } = useAuthStore();
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      if (!storeId) return;
      setLoading(true);
      try {
        const [prodRes, catRes] = await Promise.all([
          api.get<ProductDto[]>(`/api/products/store/${storeId}`),
          api.get<CategoryDto[]>(`/api/categories/store/${storeId}`),
        ]);
        if (mounted) {
          setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
          setCategories(Array.isArray(catRes.data) ? catRes.data : []);
        }
      } catch (err) {
        console.error(getApiErrorMessage(err));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, [storeId]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat =
        activeCategory === "All" ||
        p.category?.id === activeCategory ||
        p.categoryId === activeCategory;

      return matchesSearch && matchesCat;
    });
  }, [products, searchQuery, activeCategory]);

  return (
    <div className="flex flex-col min-h-full bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-primary/5 py-12 px-6 sm:py-20 lg:px-12 border-b">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-5 mix-blend-overlay"></div>
        <div className="relative mx-auto max-w-5xl text-center">
          <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-foreground">
            Welcome, {user?.firstName || "Guest"}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Browse our latest collection and discover premium products curated just for you.
          </p>
          <div className="mx-auto mt-8 flex max-w-md items-center relative shadow-sm">
            <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="What are you looking for?"
              className="h-14 w-full rounded-full bg-background pl-12 pr-4 text-base shadow-sm focus-visible:ring-primary/50"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col lg:flex-row p-6 lg:p-8 gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="sticky top-6">
            <div className="flex items-center gap-2 mb-4 font-display text-lg font-bold">
              <Filter className="size-5 text-primary" />
              Categories
            </div>
            <div className="flex flex-col space-y-1">
              <button
                onClick={() => setActiveCategory("All")}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                  activeCategory === "All"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                All Products
                <span className="text-xs opacity-60 bg-background px-2 py-0.5 rounded-full">
                  {products.length}
                </span>
              </button>
              {categories.map((cat) => {
                const count = products.filter(
                  (p) => p.category?.id === cat.id || p.categoryId === cat.id,
                ).length;
                if (count === 0) return null; // hide empty categories
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id!)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                      activeCategory === cat.id
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {cat.name}
                    <span className="text-xs opacity-60 bg-muted px-2 py-0.5 rounded-full">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <main className="flex-1">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/30 text-center">
              <ShoppingBag className="mb-4 size-12 text-muted-foreground/30" />
              <h3 className="font-display text-xl font-bold">No products found</h3>
              <p className="mt-2 text-muted-foreground max-w-md">
                We couldn't find any products matching your search criteria. Try removing some
                filters.
              </p>
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("All");
                }}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-display text-2xl font-bold">
                  {activeCategory === "All"
                    ? "All Products"
                    : categories.find((c) => c.id === activeCategory)?.name}
                </h2>
                <span className="text-sm text-muted-foreground">
                  Showing {filteredProducts.length} items
                </span>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/30"
                  >
                    <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted/50">
                      {p.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.image}
                          alt={p.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ImageIcon className="size-12 text-muted-foreground/20" />
                        </div>
                      )}

                      {/* Overlay for quick actions */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-center justify-center">
                        <Button className="rounded-full shadow-lg" variant="secondary">
                          View Details
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      {p.brand && (
                        <p className="text-xs font-semibold uppercase tracking-wider text-primary/80 mb-1">
                          {p.brand}
                        </p>
                      )}
                      <h3 className="font-display text-lg font-bold leading-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {p.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                        {p.description || "No description available."}
                      </p>
                      <div className="flex items-end justify-between mt-auto">
                        <div>
                          {p.mrp && p.mrp > p.sellingPrice && (
                            <span className="text-xs text-muted-foreground line-through mr-2">
                              {fmtMoney(p.mrp)}
                            </span>
                          )}
                          <span className="font-display text-xl font-extrabold text-foreground">
                            {fmtMoney(p.sellingPrice)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
