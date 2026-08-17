import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  MapPin,
  MoreVertical,
  Plus,
  Search,
  Store as StoreIcon,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { AppShell } from "@/components/layout/AppShell";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import type { PagedResponse, StoreDto } from "@/lib/types";
import { normalizeStoreStatus } from "@/lib/types";
import { PaginationBar, unwrapPage } from "@/components/shared/PaginationBar";
import { Button } from "@/components/ui/button";
import { StoreFormModal } from "@/components/store/StoreFormModal";

export const Route = createFileRoute("/store/stores")({
  component: () => (
    <AppShell allow={["ROLE_STORE_ADMIN", "ROLE_STORE_MANAGER"]}>
      <MyStoresPage />
    </AppShell>
  ),
});

function statusBadge(status?: StoreDto["status"] | null) {
  const normalized = normalizeStoreStatus(status ?? undefined);
  if (normalized === "ACTIVE")
    return (
      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary">
        Active
      </span>
    );
  if (normalized === "PENDING")
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-700">
        Pending
      </span>
    );
  if (normalized === "BLOCKED")
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-red-700">
        Blocked
      </span>
    );
  return (
    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
      Unknown
    </span>
  );
}

function MyStoresPage() {
  const { role, patchUser } = useAuthStore();
  const canManage = role === "ROLE_STORE_ADMIN";
  const [stores, setStores] = useState<StoreDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [storeToEdit, setStoreToEdit] = useState<StoreDto | null>(null);

  const fetchStores = async (p = 0) => {
    setLoading(true);
    try {
      const res = await api.get<PagedResponse<StoreDto>>("/api/portal/business/stores", {
        params: { page: p, size: 12 },
      });
      const u = unwrapPage<StoreDto>(res.data);
      const items = u.items.map((s) => ({ ...s, status: normalizeStoreStatus(s.status) }));
      setStores(items);
      setTotalPages(u.totalPages);
      setTotal(u.total);
      setPage(u.page);
      if (!useAuthStore.getState().storeId && items[0]?.id) {
        patchUser({ storeId: items[0].id });
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!openMenuId) return;
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest?.("[data-store-menu]")) return;
      setOpenMenuId(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenuId(null);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [openMenuId]);

  const openCreate = () => {
    setStoreToEdit(null);
    setModalOpen(true);
    setOpenMenuId(null);
  };

  const openEdit = (store: StoreDto) => {
    setStoreToEdit(store);
    setModalOpen(true);
    setOpenMenuId(null);
  };

  const handleDelete = async (store: StoreDto) => {
    if (!store.id) return;
    setOpenMenuId(null);
    if (!confirm(`Delete “${store.brand}”? Branches and staff on this store may be affected.`)) return;
    try {
      await api.delete(`/api/portal/business/stores/${store.id}`);
      toast.success("Store deleted");
      await fetchStores(page);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return stores;
    const q = searchQuery.toLowerCase();
    return stores.filter(
      (s) =>
        s.brand?.toLowerCase().includes(q) ||
        s.storeType?.toLowerCase().includes(q) ||
        s.contact?.email?.toLowerCase().includes(q) ||
        s.contact?.address?.toLowerCase().includes(q),
    );
  }, [stores, searchQuery]);

  return (
    <div className="flex h-full min-h-full flex-col bg-muted/20">
      <div className="border-b bg-card px-6 py-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold">Stores</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Create and manage the retail locations under your business.
            </p>
          </div>
          {canManage && (
            <Button onClick={openCreate}>
              <Plus className="mr-2 size-4" />
              Add store
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="mb-4 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, type, or address…"
              className="w-full rounded-lg border bg-card py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
            <StoreIcon className="mb-3 size-12 text-muted-foreground/40" />
            <h3 className="font-display text-xl font-bold">
              {searchQuery ? "No stores match your search" : "No stores yet"}
            </h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              {searchQuery
                ? "Try a different name or clear the search."
                : "Add your first store so you can open branches, hire staff, and start selling."}
            </p>
            {canManage && !searchQuery && (
              <Button className="mt-5" onClick={openCreate}>
                <Plus className="mr-2 size-4" />
                Add store
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Store
                    </th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Type
                    </th>
                    <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Created
                    </th>
                    <th className="w-[8%] px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((store) => (
                    <tr key={store.id} className="group hover:bg-muted/40">
                      <td className="px-6 py-4">
                        <div className="font-medium">{store.brand}</div>
                        <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="size-3 shrink-0" />
                          <span className="truncate">{store.contact?.address || "No address yet"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {store.storeType ? (
                          <span className="rounded bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                            {store.storeType}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">{statusBadge(store.status)}</td>
                      <td className="px-6 py-4 text-right font-mono text-xs text-muted-foreground">
                        {store.createdAt ? format(new Date(store.createdAt), "yyyy-MM-dd") : "—"}
                      </td>
                      <td className="relative px-6 py-4 text-right" data-store-menu>
                        <button
                          type="button"
                          aria-label="Store actions"
                          onClick={() =>
                            setOpenMenuId(openMenuId === store.id ? null : (store.id ?? null))
                          }
                          className="inline-flex rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <MoreVertical className="size-4" />
                        </button>
                        {openMenuId === store.id && (
                          <div className="absolute right-6 top-11 z-50 w-48 rounded-lg border bg-card py-1 text-left shadow-lg">
                            <button
                              type="button"
                              className="w-full px-4 py-2 text-left hover:bg-muted"
                              onClick={() => openEdit(store)}
                            >
                              Edit store
                            </button>
                            <Link
                              to="/store/branches"
                              className="block w-full px-4 py-2 text-left hover:bg-muted"
                              onClick={() => {
                                if (store.id) patchUser({ storeId: store.id });
                                setOpenMenuId(null);
                              }}
                            >
                              Manage branches
                            </Link>
                            {canManage && (
                              <>
                                <div className="my-1 border-t" />
                                <button
                                  type="button"
                                  className="w-full px-4 py-2 text-left text-red-600 hover:bg-muted"
                                  onClick={() => handleDelete(store)}
                                >
                                  Delete store
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationBar page={page} totalPages={totalPages} total={total} onPage={fetchStores} />
          </div>
        )}
      </div>

      <StoreFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        storeToEdit={storeToEdit}
        portal
        onSuccess={() => fetchStores(page)}
      />
    </div>
  );
}
