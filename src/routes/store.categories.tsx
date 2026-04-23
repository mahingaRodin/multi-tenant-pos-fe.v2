import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Tags, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import type { CategoryDto } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/store/categories")({
  component: () => (
    <AppShell allow={["ROLE_STORE_ADMIN", "ROLE_STORE_MANAGER"]}>
      <CategoriesPage />
    </AppShell>
  ),
});

function CategoriesPage() {
  const { storeId } = useAuthStore();
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<CategoryDto | null>(null);

  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const res = await api.get<CategoryDto[]>(`/api/categories/store/${storeId}`);
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      await api.delete(`/api/categories/${id}`);
      toast.success("Category deleted");
      fetchCategories();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Category name is required");
      return;
    }
    setSubmitting(true);
    try {
      if (categoryToEdit && categoryToEdit.id) {
        await api.put(`/api/categories/${categoryToEdit.id}`, {
          name: name.trim(),
          storeId,
        });
        toast.success("Category updated");
      } else {
        await api.post("/api/categories", {
          name: name.trim(),
          storeId,
        });
        toast.success("Category created");
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const openModal = (cat?: CategoryDto) => {
    if (cat) {
      setCategoryToEdit(cat);
      setName(cat.name);
    } else {
      setCategoryToEdit(null);
      setName("");
    }
    setModalOpen(true);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b bg-card px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Categories</h1>
            <p className="text-sm text-muted-foreground">Organize your products into categories.</p>
          </div>
          <Button onClick={() => openModal()}>
            <Plus className="mr-2 size-4" />
            Add Category
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 bg-muted/20">
        <div className="mx-auto max-w-4xl">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : categories.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed bg-card text-center">
              <Tags className="mb-4 size-12 text-muted-foreground/50" />
              <h3 className="font-display text-lg font-bold">No categories</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Create categories to keep your products organized.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border bg-card shadow-sm">
              <div className="grid grid-cols-[1fr_auto] gap-4 border-b px-6 py-4 text-sm font-medium text-muted-foreground">
                <div>Category Name</div>
                <div className="text-right">Actions</div>
              </div>
              <ul className="divide-y">
                {categories.map((cat) => (
                  <li
                    key={cat.id}
                    className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="font-medium">{cat.name}</div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openModal(cat)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Edit2 className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => cat.id && handleDelete(cat.id)}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{categoryToEdit ? "Edit Category" : "New Category"}</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-2">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Beverages"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                {categoryToEdit ? "Save" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
