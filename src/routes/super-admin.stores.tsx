import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { Search, Loader2, ChevronLeft, ChevronRight, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { AppShell } from "@/components/layout/AppShell";
import { api, getApiErrorMessage } from "@/lib/api";
import type { StoreDto, PagedResponse, EStoreStatus } from "@/lib/types";
import { StoreFormModal } from "@/components/store/StoreFormModal";

export const Route = createFileRoute("/super-admin/stores")({
  component: () => (
    <AppShell allow={["ROLE_SUPER_ADMIN"]}>
      <StoresPage />
    </AppShell>
  ),
});

function statusBadge(status?: string) {
  if (status === "ACTIVE")
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#14B8A6]/10 text-[#14B8A6] uppercase tracking-wider">Active</span>;
  if (status === "PENDING")
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wider">Pending</span>;
  return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700 uppercase tracking-wider">{status || "BLOCKED"}</span>;
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

  const fetchStores = async (p = page) => {
    setLoading(true);
    try {
      const res = await api.get<PagedResponse<StoreDto>>("/api/stores", {
        params: { page: p, size: PAGE_SIZE, direction: "DESC" },
      });
      const data = res.data;
      setStores(Array.isArray(data?.content) ? data.content : []);
      setTotalPages(data?.totalPages ?? 0);
      setTotalElements(data?.totalElements ?? 0);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleModerate = async (id: string, currentStatus?: EStoreStatus) => {
    const newStatus: EStoreStatus = currentStatus === "ACTIVE" ? "BLOCKED" : "ACTIVE";
    const label = newStatus === "BLOCKED" ? "block" : "activate";
    if (!confirm(`Are you sure you want to ${label} this store?`)) return;
    setOpenMenuId(null);
    try {
      await api.put(`/api/stores/${id}/moderate`, null, { params: { status: newStatus } });
      toast.success(`Store ${newStatus === "BLOCKED" ? "blocked" : "activated"} successfully`);
      fetchStores(page);
    } catch (err) {
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
    <div className="min-h-full bg-[#F8FAFC] p-8 font-sans">
      {/* Page Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Syne, sans-serif" }}>
            All Stores
          </h1>
          <p className="text-sm text-slate-500 mt-1">
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
      <div className="bg-white border border-slate-200 p-4 rounded-lg flex items-center justify-between mb-4 shadow-sm">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            placeholder="Search by store name, ID, or email..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:border-[#14B8A6] bg-white"
          />
        </div>
      </div>

      {/* Data Grid */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[28%]">Store Name</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[20%]">Owner</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[14%]">Type</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-[14%]">Status</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right w-[16%]">Created</th>
                    <th className="px-6 py-3 w-[8%]" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStores.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                        {searchQuery ? "No stores match your search." : "No stores registered yet."}
                      </td>
                    </tr>
                  ) : (
                    filteredStores.map((store) => (
                      <tr key={store.id} className="hover:bg-slate-50/60 transition-colors group relative">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900 text-sm">{store.brand}</div>
                          <div className="text-xs text-slate-400 mt-0.5 font-mono">
                            {store.contact?.address || store.id?.slice(0, 12) + "..."}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">
                          {store.storeAdmin
                            ? `${store.storeAdmin.firstName || ""} ${store.storeAdmin.lastName || ""}`.trim() || store.storeAdmin.email
                            : "—"}
                        </td>
                        <td className="px-6 py-4">
                          {store.storeType ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-600 font-medium">
                              {store.storeType}
                            </span>
                          ) : <span className="text-slate-400 text-sm">—</span>}
                        </td>
                        <td className="px-6 py-4">{statusBadge(store.status)}</td>
                        <td className="px-6 py-4 text-right text-xs text-slate-500 font-mono">
                          {store.createdAt ? format(new Date(store.createdAt), "yyyy-MM-dd") : "—"}
                        </td>
                        <td className="px-6 py-4 text-right relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === store.id ? null : (store.id ?? null))}
                            className="text-slate-400 hover:text-slate-700 transition-colors opacity-0 group-hover:opacity-100 p-1 rounded"
                          >
                            <MoreVertical className="size-4" />
                          </button>
                          {openMenuId === store.id && (
                            <div className="absolute right-6 top-10 z-50 bg-white border border-slate-200 rounded-lg shadow-lg w-44 py-1 text-sm">
                              <button
                                onClick={() => openModal(store)}
                                className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700"
                              >
                                Edit Store
                              </button>
                              <div className="border-t border-slate-100 my-1" />
                              <button
                                onClick={() => store.id && handleModerate(store.id, store.status)}
                                className={`w-full text-left px-4 py-2 hover:bg-slate-50 ${store.status === "ACTIVE" ? "text-amber-600" : "text-[#14B8A6]"}`}
                              >
                                {store.status === "ACTIVE" ? "Block Store" : "Activate Store"}
                              </button>
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
            <div className="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between">
              <span className="text-sm text-slate-500">
                {totalElements > 0 ? `Showing ${start} to ${end} of ${totalElements} entries` : "No entries"}
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="p-1 text-slate-500 hover:bg-slate-100 rounded disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="size-5" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`w-8 h-8 rounded text-sm font-mono transition-colors ${
                      page === i
                        ? "bg-slate-200 text-slate-900 font-bold"
                        : "hover:bg-slate-100 text-slate-600"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                {totalPages > 5 && <span className="text-slate-400 px-1">...</span>}
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-1 text-slate-500 hover:bg-slate-100 rounded disabled:opacity-40 transition-colors"
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
