import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { AppShell } from "@/components/layout/AppShell";
import { api, getApiErrorMessage } from "@/lib/api";
import type { StoreDto } from "@/lib/types";
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

function StoresPage() {
  const navigate = useNavigate();
  const [stores, setStores] = useState<StoreDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [storeToEdit, setStoreToEdit] = useState<StoreDto | null>(null);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const res = await api.get<StoreDto[]>("/api/stores");
      setStores(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to permanently delete this store? This action cannot be undone.",
      )
    )
      return;
    try {
      await api.delete(`/api/stores/${id}`);
      toast.success("Store deleted successfully");
      fetchStores();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleModerate = async (id: string, currentStatus?: boolean) => {
    const action = currentStatus ? "suspend" : "activate";
    if (!confirm(`Are you sure you want to ${action} this store?`)) return;
    try {
      await api.put(`/api/stores/${id}/moderate`, { isActive: !currentStatus });
      toast.success(`Store ${action}d successfully`);
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
    return stores.filter((s) => {
      const q = searchQuery.toLowerCase();
      return (
        s.name?.toLowerCase().includes(q) ||
        s.contactEmail?.toLowerCase().includes(q) ||
        s.id?.toLowerCase().includes(q)
      );
    });
  }, [stores, searchQuery]);

  return (
    <div className="flex h-full flex-col bg-muted/20">
      <div className="border-b bg-card px-6 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold">Stores Management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage all tenant stores on the platform.
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
              placeholder="Search stores by name, email, or ID..."
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
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {filteredStores.map((store) => (
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
                        title={store.name}
                      >
                        {store.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge
                          variant={store.isActive !== false ? "success" : "danger"}
                          className="px-2 py-0.5 text-[10px]"
                        >
                          {store.isActive !== false ? "Active" : "Suspended"}
                        </StatusBadge>
                        <span className="font-mono text-xs text-muted-foreground">
                          ID: {store.id?.slice(0, 8)}
                        </span>
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
                      <DropdownMenuItem
                        onClick={() => navigate({ to: `/super-admin/stores/${store.id}` })}
                      >
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openModal(store)}>
                        <Edit2 className="mr-2 size-4" /> Edit Store
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => store.id && handleModerate(store.id, store.isActive)}
                        className={
                          store.isActive !== false
                            ? "text-warning focus:text-warning"
                            : "text-success focus:text-success"
                        }
                      >
                        {store.isActive !== false ? (
                          <>
                            <ShieldAlert className="mr-2 size-4" /> Suspend Store
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

                <div className="flex-1 p-6 space-y-4 text-sm text-muted-foreground">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span className="line-clamp-2">{store.address || "No address provided"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="size-4 shrink-0 text-primary" />
                    <span className="truncate">{store.contactEmail || "No email provided"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="size-4 shrink-0 text-primary" />
                    <span>{store.contactPhone || "No phone provided"}</span>
                  </div>
                </div>

                <div className="bg-muted/30 px-6 py-4 text-xs text-muted-foreground border-t flex justify-between items-center">
                  <span>
                    Registered:{" "}
                    {store.createdAt ? format(new Date(store.createdAt), "MMM d, yyyy") : "-"}
                  </span>
                  <Button
                    variant="link"
                    className="h-auto p-0 text-xs"
                    onClick={() => navigate({ to: `/super-admin/stores/${store.id}` })}
                  >
                    View Details &rarr;
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <StoreFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        storeToEdit={storeToEdit}
        onSuccess={fetchStores}
      />
    </div>
  );
}
