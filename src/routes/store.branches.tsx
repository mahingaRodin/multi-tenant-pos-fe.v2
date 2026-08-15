import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, GitBranch, Loader2, MapPin, Phone, Mail, Clock } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import type { BranchDto, PagedResponse } from "@/lib/types";
import { PaginationBar, unwrapPage } from "@/components/shared/PaginationBar";
import { Button } from "@/components/ui/button";
import { BranchFormModal } from "@/components/store/BranchFormModal";

export const Route = createFileRoute("/store/branches")({
  component: () => (
    <AppShell allow={["ROLE_STORE_ADMIN", "ROLE_STORE_MANAGER"]}>
      <BranchesPage />
    </AppShell>
  ),
});

function BranchesPage() {
  const { storeId } = useAuthStore();
  const navigate = useNavigate();
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [branchToEdit, setBranchToEdit] = useState<BranchDto | null>(null);

  const fetchBranches = async (p = page) => {
    if (!storeId) return;
    setLoading(true);
    try {
      const res = await api.get<PagedResponse<BranchDto>>(`/api/branches/store/${storeId}`, {
        params: { page: p, size: 12 },
      });
      const u = unwrapPage<BranchDto>(res.data);
      setBranches(u.items);
      setTotalPages(u.totalPages);
      setTotal(u.total);
      setPage(u.page);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this branch? This action cannot be undone."))
      return;
    try {
      await api.delete(`/api/branches/${id}`);
      toast.success("Branch deleted");
      fetchBranches();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const openModal = (branch?: BranchDto) => {
    setBranchToEdit(branch || null);
    setModalOpen(true);
  };

  return (
    <div className="flex h-full flex-col bg-muted/20">
      <div className="border-b bg-card px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Branches</h1>
            <p className="text-sm text-muted-foreground">
              Manage your physical store locations and their details.
            </p>
          </div>
          <Button onClick={() => openModal()}>
            <Plus className="mr-2 size-4" />
            Add Branch
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : branches.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed bg-card text-center shadow-sm">
            <GitBranch className="mb-4 size-12 text-muted-foreground/50" />
            <h3 className="font-display text-lg font-bold">No branches yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Create your first branch to start managing inventory and processing sales for that
              location.
            </p>
            <Button className="mt-4" onClick={() => openModal()}>
              <Plus className="mr-2 size-4" />
              Add Branch
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {branches.map((branch) => (
              <div
                key={branch.id}
                className="group relative flex flex-col rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md"
              >
                <div className="mb-4 flex items-start justify-between">
                  <h3 className="font-display text-xl font-bold">{branch.name}</h3>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openModal(branch)}
                      className="size-8 text-muted-foreground hover:text-foreground"
                    >
                      <Edit2 className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => branch.id && handleDelete(branch.id)}
                      className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 flex-1 text-sm text-muted-foreground">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span className="line-clamp-2">{branch.address || "No address provided"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="size-4 shrink-0 text-primary" />
                    <span>{branch.phone || "No phone provided"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="size-4 shrink-0 text-primary" />
                    <span className="truncate">{branch.email || "No email provided"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="size-4 shrink-0 text-primary" />
                    <span>
                      {branch.openTime && branch.closeTime
                        ? `${branch.openTime} - ${branch.closeTime}`
                        : "Operating hours not set"}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t">
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => {
                      // Optionally navigate to a branch detail page or inventory
                      navigate({ to: "/branch/dashboard" });
                    }}
                  >
                    View Branch Dashboard
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        <PaginationBar page={page} totalPages={totalPages} total={total} onPage={fetchBranches} />
      </div>

      <BranchFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        branchToEdit={branchToEdit}
        onSuccess={fetchBranches}
      />
    </div>
  );
}
