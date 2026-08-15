import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import type { BranchDto } from "@/lib/types";
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
import { useAuthStore } from "@/stores/authStore";

export function BranchFormModal({
  open,
  onClose,
  branchToEdit,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  branchToEdit?: BranchDto | null;
  onSuccess: () => void;
}) {
  const { storeId } = useAuthStore();
  const isEditing = !!branchToEdit;

  // Form State
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (branchToEdit) {
        setName(branchToEdit.name);
        setAddress(branchToEdit.address || "");
        setPhone(branchToEdit.phone || "");
        setEmail(branchToEdit.email || "");
        setOpenTime(branchToEdit.openTime || "");
        setCloseTime(branchToEdit.closeTime || "");
      } else {
        setName("");
        setAddress("");
        setPhone("");
        setEmail("");
        setOpenTime("");
        setCloseTime("");
      }
    }
  }, [open, branchToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Branch name is required");
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<BranchDto> = {
        name: name.trim(),
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        openTime: openTime.trim() || undefined,
        closeTime: closeTime.trim() || undefined,
        storeId: storeId ?? undefined,
      };

      if (isEditing && branchToEdit.id) {
        await api.put(`/api/branches/${branchToEdit.id}`, payload);
        toast.success("Branch updated successfully");
      } else {
        await api.post("/api/branches", payload);
        toast.success("Branch created successfully");
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
            <DialogTitle>{isEditing ? "Edit Branch" : "New Branch"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
            <div className="col-span-2 space-y-2">
              <Label>Branch Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Downtown Store"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 234 567 890"
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="branch@example.com"
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

            <div className="space-y-2">
              <Label>Open Time</Label>
              <Input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Close Time</Label>
              <Input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Branch"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
