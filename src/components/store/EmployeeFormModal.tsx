import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import type { UserDto, Role, BranchDto } from "@/lib/types";
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

export function EmployeeFormModal({
  open,
  onClose,
  employeeToEdit,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  employeeToEdit?: UserDto | null;
  onSuccess: () => void;
}) {
  const { storeId } = useAuthStore();
  const isEditing = !!employeeToEdit;

  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  // Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role | "">("");
  const [branchId, setBranchId] = useState<string>("");
  const [password, setPassword] = useState(""); // Only for new users usually

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (employeeToEdit) {
        setFirstName(employeeToEdit.firstName || "");
        setLastName(employeeToEdit.lastName || "");
        setEmail(employeeToEdit.email || "");
        setPhone(employeeToEdit.phone || "");
        setRole(employeeToEdit.role || "");
        setBranchId(employeeToEdit.branchId || "");
        setPassword("");
      } else {
        setFirstName("");
        setLastName("");
        setEmail("");
        setPhone("");
        setRole("");
        setBranchId("");
        setPassword("");
      }
      fetchBranches();
    }
  }, [open, employeeToEdit]);

  const fetchBranches = async () => {
    if (!storeId) return;
    setLoadingBranches(true);
    try {
      const res = await api.get<BranchDto[]>(`/api/branches/store/${storeId}`);
      setBranches(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoadingBranches(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !role) {
      toast.error("First name, last name, email, and role are required");
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<UserDto> = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        role: role as Role,
        branchId: branchId || undefined,
        storeId: storeId ?? undefined,
      };

      if (password.trim()) {
        payload.password = password.trim();
      }

      if (isEditing && employeeToEdit.id) {
        await api.put(`/api/employees/${employeeToEdit.id}`, payload);
        toast.success("Employee updated successfully");
      } else {
        await api.post(`/api/employees/store/${storeId}`, payload);
        toast.success("Employee created successfully");
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
            <DialogTitle>{isEditing ? "Edit Employee" : "New Employee"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>First Name *</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} autoFocus />
            </div>

            <div className="space-y-2">
              <Label>Last Name *</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Role *</Label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ROLE_STORE_MANAGER">Store Manager</SelectItem>
                  <SelectItem value="ROLE_BRANCH_MANAGER">Branch Manager</SelectItem>
                  <SelectItem value="ROLE_BRANCH_CASHIER">Cashier</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Branch (Optional for Store Managers)</Label>
              <Select value={branchId} onValueChange={setBranchId} disabled={loadingBranches}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingBranches ? "Loading..." : "Select branch"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Branch</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id!}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!isEditing && (
              <div className="col-span-2 space-y-2">
                <Label>Password *</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave blank to email an activation link"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Add Employee"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
