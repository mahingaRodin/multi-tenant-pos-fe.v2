import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import type { CategoryDto, ProductDto } from "@/lib/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/stores/authStore";

export function ProductFormModal({
  open,
  onClose,
  productToEdit,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  productToEdit?: ProductDto | null;
  onSuccess: () => void;
}) {
  const { storeId } = useAuthStore();
  const isEditing = !!productToEdit;

  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [mrp, setMrp] = useState("");
  const [brand, setBrand] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [image, setImage] = useState("");

  const [submitting, setSubmitting] = useState(false);

  // Populate form when editing or resetting
  useEffect(() => {
    if (open) {
      if (productToEdit) {
        setName(productToEdit.name);
        setSku(productToEdit.sku || "");
        setDescription(productToEdit.description || "");
        setSellingPrice(String(productToEdit.sellingPrice));
        setMrp(productToEdit.mrp ? String(productToEdit.mrp) : "");
        setBrand(productToEdit.brand || "");
        setCategoryId(productToEdit.category?.id || productToEdit.categoryId || "");
        setImage(productToEdit.image || "");
      } else {
        setName("");
        setSku("");
        setDescription("");
        setSellingPrice("");
        setMrp("");
        setBrand("");
        setCategoryId("");
        setImage("");
      }
      fetchCategories();
    }
  }, [open, productToEdit]);

  const fetchCategories = async () => {
    if (!storeId) return;
    setLoadingCats(true);
    try {
      const res = await api.get<CategoryDto[]>(`/api/categories/store/${storeId}`);
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoadingCats(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sellingPrice || !categoryId) {
      toast.error("Name, Selling Price, and Category are required");
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<ProductDto> = {
        name: name.trim(),
        sku: sku.trim() || undefined,
        description: description.trim() || undefined,
        sellingPrice: Number(sellingPrice),
        mrp: mrp ? Number(mrp) : undefined,
        brand: brand.trim() || undefined,
        categoryId,
        storeId,
        image: image.trim() || undefined,
      };

      if (isEditing && productToEdit.id) {
        await api.patch(`/api/products/${productToEdit.id}`, payload);
        toast.success("Product updated successfully");
      } else {
        await api.post("/api/products", payload);
        toast.success("Product created successfully");
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Product" : "New Product"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-2">
              <Label>Product Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Wireless Headphones"
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={categoryId} onValueChange={setCategoryId} disabled={loadingCats}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingCats ? "Loading..." : "Select category"} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id!}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>SKU / Barcode</Label>
              <Input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. PRD-001"
              />
            </div>

            <div className="space-y-2">
              <Label>Selling Price *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label>MRP (Original Price)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={mrp}
                onChange={(e) => setMrp(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Image URL</Label>
              <Input
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
