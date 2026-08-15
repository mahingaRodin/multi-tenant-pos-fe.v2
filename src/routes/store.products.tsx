import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  PackageSearch,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import type { ProductDto, PagedResponse } from "@/lib/types";
import { fmtMoney, productImg } from "@/lib/format";
import { PaginationBar, unwrapPage } from "@/components/shared/PaginationBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductFormModal } from "@/components/store/ProductFormModal";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/store/products")({
  component: () => (
    <AppShell allow={["ROLE_STORE_ADMIN", "ROLE_STORE_MANAGER"]}>
      <ProductsPage />
    </AppShell>
  ),
});

function ProductsPage() {
  const { storeId } = useAuthStore();
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const [modalOpen, setModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<ProductDto | null>(null);

  const fetchProducts = async (p = page) => {
    if (!storeId) return;
    setLoading(true);
    try {
      const path = searchQuery.trim()
        ? `/api/products/store/${storeId}/search`
        : `/api/products/store/${storeId}`;
      const res = await api.get<PagedResponse<ProductDto>>(path, {
        params: { page: p, size: 12, keyword: searchQuery.trim() || undefined },
      });
      const unwrapped = unwrapPage<ProductDto>(res.data);
      setProducts(unwrapped.items);
      setTotalPages(unwrapped.totalPages);
      setTotal(unwrapped.total);
      setPage(unwrapped.page);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await api.delete(`/api/products/${id}`);
      toast.success("Product deleted");
      fetchProducts();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category?.name) set.add(p.category.name);
    });
    return Array.from(set).sort();
  }, [products]);

  const filteredProducts = products;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b bg-card px-6 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Product Catalog</h1>
            <p className="text-sm text-muted-foreground">
              Manage your store's items, pricing, and details.
            </p>
          </div>
          <Button
            onClick={() => {
              setProductToEdit(null);
              setModalOpen(true);
            }}
          >
            <Plus className="mr-2 size-4" />
            Add Product
          </Button>
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchProducts(0)}
              placeholder="Search products or SKU..."
              className="pl-9"
            />
          </div>
          <div className="flex flex-1 flex-wrap gap-2 overflow-x-auto pb-2 sm:pb-0">
            <button
              onClick={() => setActiveCategory("All")}
              className={cn(
                "whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                activeCategory === "All"
                  ? "border-accent bg-accent text-accent-foreground"
                  : "bg-background text-muted-foreground hover:border-accent/50",
              )}
            >
              All Products
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                  activeCategory === cat
                    ? "border-accent bg-accent text-accent-foreground"
                    : "bg-background text-muted-foreground hover:border-accent/50",
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 bg-muted/20">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed bg-card text-center">
            <PackageSearch className="mb-4 size-12 text-muted-foreground/50" />
            <h3 className="font-display text-lg font-bold">No products found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              {searchQuery || activeCategory !== "All"
                ? "Try adjusting your filters or search query."
                : "Get started by adding your first product to the catalog."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                className="group relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-md"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                    <img
                      src={productImg(p.image)}
                      alt={p.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  {p.category?.name && (
                    <div className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-[10px] font-semibold tracking-wide shadow-sm backdrop-blur-sm">
                      {p.category.name}
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 font-medium leading-tight">{p.name}</h3>
                    <div className="font-display font-bold text-primary">
                      {fmtMoney(p.sellingPrice)}
                    </div>
                  </div>
                  {p.sku && <p className="text-xs text-muted-foreground">SKU: {p.sku}</p>}

                  <div className="mt-auto pt-4 flex gap-2 border-t mt-4 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setProductToEdit(p);
                        setModalOpen(true);
                      }}
                    >
                      <Edit2 className="mr-2 size-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="px-3"
                      onClick={() => p.id && handleDelete(p.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <PaginationBar page={page} totalPages={totalPages} total={total} onPage={(p) => fetchProducts(p)} />
      </div>

      <ProductFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        productToEdit={productToEdit}
        onSuccess={fetchProducts}
      />
    </div>
  );
}
