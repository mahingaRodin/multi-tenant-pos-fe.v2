import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { Search, Loader2, ChevronLeft, ChevronRight, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { AppShell } from "@/components/layout/AppShell";
import { api, getApiErrorMessage } from "@/lib/api";
import type { StoreDto, PagedResponse, EStoreStatus } from "@/lib/types";
import { normalizeStoreStatus } from "@/lib/types";
import { StoreFormModal } from "@/components/store/StoreFormModal";

export const Route = createFileRoute("/super-admin/stores")({
  component: () => (
    <AppShell allow={["ROLE_SUPER_ADMIN"]}>
      <StoresPage />
    </AppShell>
  ),
});

function statusBadge(status?: string | null) {
  if (status === "ACTIVE")
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#14B8A6]/10 text-[#14B8A6] uppercase tracking-wider">Active</span>;
  if (status === "PENDING")
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wider">Pending</span>;
  if (status === "BLOCKED")
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700 uppercase tracking-wider">Blocked</span>;
  return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-muted text-muted-foreground uppercase tracking-wider">Unknown</span>;
}

function StoresPage() {
  const [stores, setStores] = useState<StoreDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const PAGE_SIZE = 10;

  const [modalOpen, setModalOpen] = useState(false);
  const [storeToEdit, setStoreToEdit] = useState<StoreDto | null>(null);
  const [fetchNonce, setFetchNonce] = useState(0); // forces re-fetch after moderate

  const fetchStores = async (p = page) => {
    setLoading(true);
    try {
      // Vary size to bust Spring's Pageable-based cache key (99-102 for 100-item fetch)
      const bustSize = 100 + (Date.now() % 4);
      const res = await api.get<PagedResponse<StoreDto>>("/api/stores", {
        params: { page: 0, size: bustSize, direction: "DESC" },
      });
      const data = res.data;
      const all = (Array.isArray(data?.content) ? data.content : []).map((s) => ({
        ...s,
        status: normalizeStoreStatus(s.status),
      }));
      // Client-side paginate to PAGE_SIZE so cache-busting doesn't break UI
      const start = p * PAGE_SIZE;
      const pageItems = all.slice(start, start + PAGE_SIZE);
      setStores(pageItems);
      const total = data?.totalElements ?? all.length;
      setTotalPages(Math.ceil(total / PAGE_SIZE));
      setTotalElements(total);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, fetchNonce]);

  const handleModerate = async (id: string, newStatus: EStoreStatus) => {
    const labels: Record<EStoreStatus, string> = { ACTIVE: "activate", PENDING: "set to pending", BLOCKED: "block" };
    if (!confirm(`Are you sure you want to ${labels[newStatus]} this store?`)) return;
    setOpenMenuId(null);
    // Optimistically update UI immediately
    setStores((prev) => prev.map((s) => s.id === id ? { ...s, status: newStatus } : s));
    try {
      await api.put(`/api/stores/${id}/moderate`, null, { params: { status: newStatus } });
      toast.success(`Store status updated to ${newStatus.toLowerCase()}`);
      setFetchNonce((n) => n + 1); // force fresh fetch from DB, bypassing cache
    } catch (err) {
      // Revert optimistic update on failure
      setFetchNonce((n) => n + 1);
      toast.error(getApiErrorMessage(err));
    }
  };

  const openModal = (store?: StoreDto) => {
    setStoreToEdit(store || null);
    setModalOpen(true);
    setOpenMenuId(null);
  };

  const filteredStores = useMemo(() => {
    if (!searchQuery) return stores;
    const q = searchQuery.toLowerCase();
    return stores.filter(
      (s) =>
        s.brand?.toLowerCase().includes(q) ||
        s.contact?.email?.toLowerCase().includes(q) ||
        s.id?.toLowerCase().includes(q) ||
        s.storeAdmin?.email?.toLowerCase().includes(q),
    );
  }, [stores, searchQuery]);

  const start = page * PAGE_SIZE + 1;
  const end = Math.min((page + 1) * PAGE_SIZE, totalElements);

  return (
    <div className="min-h-full bg-background p-8">
      {/* Page Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            All Stores
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and monitor all {totalElements} retail locations.
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-[#14B8A6] hover:bg-teal-600 text-white py-2 px-4 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium"
        >
          <span className="text-base leading-none font-bold">+</span>
          Add Store
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-card border border-border p-4 rounded-lg flex items-center justify-between mb-4 shadow-sm">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            placeholder="Search by store name, ID, or email..."
            className="w-full pl-10 pr-4 py-2 border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#14B8A6] bg-card"
          />
        </div>
      </div>

      {/* Data Grid */}
      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted border-b border-border">
                    <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider w-[28%]">Store Name</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider w-[20%]">Owner</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider w-[14%]">Type</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider w-[14%]">Status</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-right w-[16%]">Created</th>
                    <th className="px-6 py-3 w-[8%]" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredStores.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground text-sm">
                        {searchQuery ? "No stores match your search." : "No stores registered yet."}
                      </td>
                    </tr>
                  ) : (
                    filteredStores.map((store) => (
                      <tr key={store.id} className="hover:bg-muted/50 transition-colors group relative">
                        <td className="px-6 py-4">
                          <div className="font-medium text-card-foreground text-sm">{store.brand}</div>
                          <div className="text-xs text-muted-foreground mt-0.5 font-mono">
                            {store.contact?.address || store.id?.slice(0, 12) + "..."}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-card-foreground">
                          {store.storeAdmin
                            ? `${store.storeAdmin.firstName || ""} ${store.storeAdmin.lastName || ""}`.trim() || store.storeAdmin.email
                            : "—"}
                        </td>
                        <td className="px-6 py-4">
                          {store.storeType ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-muted text-muted-foreground font-medium">
                              {store.storeType}
                            </span>
                          ) : <span className="text-muted-foreground text-sm">—</span>}
                        </td>
                        <td className="px-6 py-4">{statusBadge(store.status)}</td>
                        <td className="px-6 py-4 text-right text-xs text-muted-foreground font-mono">
                          {store.createdAt ? format(new Date(store.createdAt), "yyyy-MM-dd") : "—"}
                        </td>
                        <td className="px-6 py-4 text-right relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === store.id ? null : (store.id ?? null))}
                            className="text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100 p-1 rounded"
                          >
                            <MoreVertical className="size-4" />
                          </button>
                          {openMenuId === store.id && (
                            <div className="absolute right-6 top-10 z-50 bg-card border border-border rounded-lg shadow-lg w-48 py-1 text-sm">
                              <button
                                onClick={() => openModal(store)}
                                className="w-full text-left px-4 py-2 hover:bg-muted text-card-foreground"
                              >
                                Edit Store
                              </button>
                              <div className="border-t border-border my-1" />
                              {store.status !== "ACTIVE" && (
                                <button
                                  onClick={() => store.id && handleModerate(store.id, "ACTIVE")}
                                  className="w-full text-left px-4 py-2 hover:bg-muted text-[#14B8A6]"
                                >
                                  Activate Store
                                </button>
                              )}
                              {store.status !== "PENDING" && (
                                <button
                                  onClick={() => store.id && handleModerate(store.id, "PENDING")}
                                  className="w-full text-left px-4 py-2 hover:bg-muted text-amber-500"
                                >
                                  Set to Pending
                                </button>
                              )}
                              {store.status !== "BLOCKED" && (
                                <button
                                  onClick={() => store.id && handleModerate(store.id, "BLOCKED")}
                                  className="w-full text-left px-4 py-2 hover:bg-muted text-red-500"
                                >
                                  Block Store
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="bg-card border-t border-border px-6 py-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {totalElements > 0 ? `Showing ${start} to ${end} of ${totalElements} entries` : "No entries"}
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="p-1 text-muted-foreground hover:bg-muted rounded disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="size-5" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`w-8 h-8 rounded text-sm font-mono transition-colors ${
                      page === i
                        ? "bg-muted text-foreground font-bold"
                        : "hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                {totalPages > 5 && <span className="text-muted-foreground px-1">...</span>}
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-1 text-muted-foreground hover:bg-muted rounded disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="size-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <StoreFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        storeToEdit={storeToEdit}
        onSuccess={() => fetchStores(page)}
      />
    </div>
  );
}
