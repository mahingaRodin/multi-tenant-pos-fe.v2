import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import type { PagedResponse, UserDto } from "@/lib/types";
import { PaginationBar, unwrapPage } from "@/components/shared/PaginationBar";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/branch/employees")({
  component: () => (
    <AppShell allow={["ROLE_BRANCH_MANAGER", "ROLE_STORE_ADMIN", "ROLE_STORE_MANAGER"]}>
      <BranchEmployees />
    </AppShell>
  ),
});

function BranchEmployees() {
  const { branchId } = useAuthStore();
  const [rows, setRows] = useState<UserDto[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "" });

  const load = async (p = page) => {
    if (!branchId) return;
    const res = await api.get<PagedResponse<UserDto>>(`/api/employees/branch/${branchId}`, { params: { page: p, size: 12 } });
    const u = unwrapPage<UserDto>(res.data);
    setRows(u.items);
    setTotalPages(u.totalPages);
    setTotal(u.total);
    setPage(u.page);
  };
  useEffect(() => { load().catch((e) => toast.error(getApiErrorMessage(e))); }, [branchId]);

  const invite = async () => {
    if (!branchId) return;
    try {
      await api.post(`/api/employees/branch/${branchId}`, {
        ...form,
        role: "ROLE_BRANCH_CASHIER",
      });
      toast.success("Cashier invited — they will get an activation email.");
      setForm({ firstName: "", lastName: "", email: "", phone: "" });
      await load();
    } catch (e) { toast.error(getApiErrorMessage(e)); }
  };

  return (
    <div className="p-6">
      <h1 className="font-display text-2xl font-bold">Cashiers</h1>
      <p className="text-sm text-muted-foreground">Invite a cashier. They set their own password from the email link.</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-4">
        <input placeholder="First" className="rounded-lg border bg-background px-3 py-2 text-sm" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
        <input placeholder="Last" className="rounded-lg border bg-background px-3 py-2 text-sm" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
        <input placeholder="Email" className="rounded-lg border bg-background px-3 py-2 text-sm" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Button onClick={invite}>Send activation</Button>
      </div>
      <div className="mt-6 overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left"><tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Status</th></tr></thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-3">{u.firstName} {u.lastName}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.userStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PaginationBar page={page} totalPages={totalPages} total={total} onPage={load} />
    </div>
  );
}
