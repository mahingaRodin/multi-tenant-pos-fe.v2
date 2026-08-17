import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import type { StoreDto } from "@/lib/types";
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

export function StoreFormModal({
  open,
  onClose,
  storeToEdit,
  onSuccess,
  portal = false,
}: {
  open: boolean;
  onClose: () => void;
  storeToEdit?: StoreDto | null;
  onSuccess: () => void;
  /** Use tenant-scoped business portal APIs (store admin). */
  portal?: boolean;
}) {
  const isEditing = !!storeToEdit;

  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");
  const [storeType, setStoreType] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [address, setAddress] = useState("");

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (storeToEdit) {
        setBrand(storeToEdit.brand || "");
        setDescription(storeToEdit.description || "");
        setStoreType(storeToEdit.storeType || "");
        setContactPhone(storeToEdit.contact?.phone || "");
        setContactEmail(storeToEdit.contact?.email || "");
        setAddress(storeToEdit.contact?.address || "");
      } else {
        setBrand("");
        setDescription("");
        setStoreType("");
        setContactPhone("");
        setContactEmail("");
        setAddress("");
      }
    }
  }, [open, storeToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand.trim()) {
      toast.error("Store brand name is required");
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<StoreDto> = {
        brand: brand.trim(),
        description: description.trim() || undefined,
        storeType: storeType || undefined,
        contact: {
          phone: contactPhone.trim() || undefined,
          email: contactEmail.trim() || undefined,
          address: address.trim() || undefined,
        },
      };

      if (portal) {
        const body = {
          brand: brand.trim(),
          description: description.trim() || undefined,
          storeType: storeType || undefined,
          contactPhone: contactPhone.trim() || undefined,
          contactEmail: contactEmail.trim() || undefined,
          contactAddress: address.trim() || undefined,
        };
        if (isEditing && storeToEdit.id) {
          await api.put(`/api/portal/business/stores/${storeToEdit.id}`, body);
          toast.success("Store updated successfully");
        } else {
          const created = await api.post<StoreDto>("/api/portal/business/stores", body);
          if (created.data?.id) {
            useAuthStore.getState().patchUser({ storeId: created.data.id });
          }
          toast.success("Store created successfully");
        }
      } else if (isEditing && storeToEdit.id) {
        await api.put(`/api/stores/${storeToEdit.id}/update`, payload);
        toast.success("Store updated successfully");
      } else {
        const created = await api.post<StoreDto>("/api/stores", payload);
        if (created.data?.id) {
          useAuthStore.getState().patchUser({ storeId: created.data.id });
        }
        toast.success("Store created successfully");
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
            <DialogTitle>{isEditing ? "Edit Store" : "New Store"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
            <div className="col-span-2 space-y-2">
              <Label>Brand Name *</Label>
              <Input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. MegaMart"
                autoFocus
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the store"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Store Type</Label>
              <Select value={storeType} onValueChange={setStoreType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RETAIL">Retail</SelectItem>
                  <SelectItem value="GROCERY">Grocery</SelectItem>
                  <SelectItem value="ELECTRONICS">Electronics</SelectItem>
                  <SelectItem value="FASHION">Fashion</SelectItem>
                  <SelectItem value="PHARMACY">Pharmacy</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Contact Phone</Label>
              <Input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+1 234 567 890"
              />
            </div>

            <div className="space-y-2">
              <Label>Contact Email</Label>
              <Input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="store@example.com"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Address</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St, City, Country"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Store"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
