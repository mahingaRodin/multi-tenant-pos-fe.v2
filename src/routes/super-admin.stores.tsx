import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Store,
  Loader2,
  ShieldAlert,
  CheckCircle2,
  MoreVertical,
  MapPin,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { AppShell } from "@/components/layout/AppShell";
import { api, getApiErrorMessage } from "@/lib/api";
import type { StoreDto, PagedResponse, EStoreStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { StoreFormModal } from "@/components/store/StoreFormModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/super-admin/stores")({
  component: () => (
    <AppShell allow={["ROLE_SUPER_ADMIN"]}>
      <StoresPage />
    </AppShell>
  ),
});

const STATUS_VARIANT: Record<string, "active" | "pending" | "danger"> = {
  ACTIVE: "active",
  PENDING: "pending",
  BLOCKED: "danger",
};

function StoresPage() {
  const [stores, setStores] = useState<StoreDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const PAGE_SIZE = 12;

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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this store? This action cannot be undone."))
      return;
    try {
      await api.delete(`/api/stores/${id}`);
      toast.success("Store deleted successfully");
      fetchStores();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleModerate = async (id: string, currentStatus?: EStoreStatus) => {
    const newStatus: EStoreStatus = currentStatus === "ACTIVE" ? "BLOCKED" : "ACTIVE";
    const label = newStatus === "BLOCKED" ? "block" : "activate";
    if (!confirm(`Are you sure you want to ${label} this store?`)) return;
    try {
      await api.put(`/api/stores/${id}/moderate`, null, { params: { status: newStatus } });
      toast.success(`Store ${label}ed successfully`);
      fetchStores();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const openModal = (store?: StoreDto) => {
    setStoreToEdit(store || null);
    setModalOpen(true);
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

  return (
    <div className="flex h-full flex-col bg-muted/20">
      <div className="border-b bg-card px-6 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold">Stores Management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage all {totalElements} tenant stores on the platform.
            </p>
          </div>
          <Button onClick={() => openModal()}>
            <Plus className="mr-2 size-4" />
            Add New Store
          </Button>
        </div>

        <div className="mt-6">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stores by brand, email, or ID..."
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
        ) : filteredStores.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed bg-card text-center shadow-sm">
            <Store className="mb-4 size-12 text-muted-foreground/50" />
            <h3 className="font-display text-lg font-bold">No stores found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {searchQuery
                ? "Try a different search query."
                : "There are no stores registered on the platform yet."}
            </p>
            {!searchQuery && (
              <Button className="mt-4" onClick={() => openModal()}>
                <Plus className="mr-2 size-4" />
                Add Store
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {filteredStores.map((store) => {
                const status = store.status || "ACTIVE";
                return (
                  <div
                    key={store.id}
                    className="group flex flex-col rounded-xl border bg-card shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="flex items-start justify-between p-6 border-b">
                      <div className="flex items-center gap-4">
                        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Store className="size-6" />
                        </div>
                        <div>
                          <h3
                            className="font-display text-lg font-bold line-clamp-1"
                            title={store.brand}
                          >
                            {store.brand}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <StatusBadge
                              variant={STATUS_VARIANT[status] || "muted"}
                              className="px-2 py-0.5 text-[10px]"
                            >
                              {status}
                            </StatusBadge>
                            {store.storeType && (
                              <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                                {store.storeType}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="size-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openModal(store)}>
                            <Edit2 className="mr-2 size-4" /> Edit Store
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => store.id && handleModerate(store.id, store.status)}
                            className={
                              status === "ACTIVE"
                                ? "text-orange-500 focus:text-orange-500"
                                : "text-green-500 focus:text-green-500"
                            }
                          >
                            {status === "ACTIVE" ? (
                              <>
                                <ShieldAlert className="mr-2 size-4" /> Block Store
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="mr-2 size-4" /> Activate Store
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => store.id && handleDelete(store.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 size-4" /> Delete Store
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex-1 p-6 space-y-3 text-sm text-muted-foreground">
                      {store.description && (
                        <p className="text-foreground/80 line-clamp-2 text-sm">{store.description}</p>
                      )}
                      <div className="flex items-start gap-3">
                        <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span className="line-clamp-2">
                          {store.contact?.address || "No address provided"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="size-4 shrink-0 text-primary" />
                        <span className="truncate">
                          {store.contact?.email || "No email provided"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="size-4 shrink-0 text-primary" />
                        <span>{store.contact?.phone || "No phone provided"}</span>
                      </div>
                      {store.storeAdmin && (
                        <div className="flex items-center gap-3">
                          <User className="size-4 shrink-0 text-primary" />
                          <span className="truncate">
                            Admin: {store.storeAdmin.firstName} {store.storeAdmin.lastName} ({store.storeAdmin.email})
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="bg-muted/30 px-6 py-4 text-xs text-muted-foreground border-t flex justify-between items-center">
                      <span>
                        Registered:{" "}
                        {store.createdAt ? format(new Date(store.createdAt), "MMM d, yyyy") : "-"}
                      </span>
                      <span className="font-mono">
                        ID: {store.id?.slice(0, 8)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  <ChevronLeft className="mr-1 size-4" /> Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next <ChevronRight className="ml-1 size-4" />
                </Button>
              </div>
            )}
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
