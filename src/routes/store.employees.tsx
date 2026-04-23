import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Users, Loader2, Shield, UserCircle, Store } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import type { UserDto } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { EmployeeFormModal } from "@/components/store/EmployeeFormModal";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/store/employees")({
  component: () => (
    <AppShell allow={["ROLE_STORE_ADMIN", "ROLE_STORE_MANAGER"]}>
      <EmployeesPage />
    </AppShell>
  ),
});

function roleDisplay(role?: string) {
  if (!role) return "Unknown";
  return (
    {
      ROLE_STORE_MANAGER: "Store Manager",
      ROLE_BRANCH_MANAGER: "Branch Manager",
      ROLE_BRANCH_CASHIER: "Cashier",
    }[role] || role
  );
}

function EmployeesPage() {
  const { storeId } = useAuthStore();
  const [employees, setEmployees] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<UserDto | null>(null);

  const fetchEmployees = async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const res = await api.get<UserDto[]>(`/api/employees/store/${storeId}`);
      setEmployees(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this employee?")) return;
    try {
      await api.delete(`/api/employees/${id}`);
      toast.success("Employee removed");
      fetchEmployees();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const openModal = (emp?: UserDto) => {
    setEmployeeToEdit(emp || null);
    setModalOpen(true);
  };

  return (
    <div className="flex h-full flex-col bg-muted/20">
      <div className="border-b bg-card px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Employees</h1>
            <p className="text-sm text-muted-foreground">
              Manage your staff, assign roles, and allocate them to branches.
            </p>
          </div>
          <Button onClick={() => openModal()}>
            <Plus className="mr-2 size-4" />
            Add Employee
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : employees.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed bg-card text-center shadow-sm">
            <Users className="mb-4 size-12 text-muted-foreground/50" />
            <h3 className="font-display text-lg font-bold">No employees found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Add staff members to start delegating operations and sales.
            </p>
            <Button className="mt-4" onClick={() => openModal()}>
              <Plus className="mr-2 size-4" />
              Add Employee
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {employees.map((emp) => (
              <div
                key={emp.id}
                className="group relative flex flex-col rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <UserCircle className="size-6" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold">
                        {emp.firstName} {emp.lastName}
                      </h3>
                      <p className="text-sm text-muted-foreground">{emp.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openModal(emp)}
                      className="size-8 text-muted-foreground hover:text-foreground"
                    >
                      <Edit2 className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => emp.id && handleDelete(emp.id)}
                      className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-6 flex flex-1 flex-col justify-end space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield className="size-4 text-muted-foreground" />
                    <StatusBadge
                      variant={
                        emp.role === "ROLE_STORE_MANAGER"
                          ? "active"
                          : emp.role === "ROLE_BRANCH_MANAGER"
                            ? "active"
                            : "muted"
                      }
                      className="px-2 py-0.5 text-xs"
                    >
                      {roleDisplay(emp.role)}
                    </StatusBadge>
                  </div>
                  {emp.branchId && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Store className="size-4 shrink-0" />
                      <span className="truncate">Branch ID: {emp.branchId}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <EmployeeFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        employeeToEdit={employeeToEdit}
        onSuccess={fetchEmployees}
      />
    </div>
  );
}
