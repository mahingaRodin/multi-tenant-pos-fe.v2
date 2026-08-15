import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import type { ShiftReportDto } from "@/lib/types";
import { fmtMoney } from "@/lib/format";

export const Route = createFileRoute("/branch/shifts")({
  component: () => (
    <AppShell allow={["ROLE_BRANCH_MANAGER", "ROLE_STORE_ADMIN", "ROLE_STORE_MANAGER"]}>
      <ShiftsPage />
    </AppShell>
  ),
});

function ShiftsPage() {
  const branchId = useAuthStore((s) => s.branchId);
  const [all, setAll] = useState<ShiftReportDto[]>([]);
  const [open, setOpen] = useState<ShiftReportDto[]>([]);

  useEffect(() => {
    if (!branchId) return;
    Promise.all([
      api.get<ShiftReportDto[]>(`/api/shift-reports/branch/${branchId}`),
      api.get<ShiftReportDto[]>(`/api/shift-reports/branch/${branchId}/open`),
    ]).then(([a, o]) => {
      setAll(a.data ?? []);
      setOpen(o.data ?? []);
    }).catch((e) => toast.error(getApiErrorMessage(e)));
  }, [branchId]);

  return (
    <div className="p-6">
      <h1 className="font-display text-2xl font-bold">Branch shifts</h1>
      <h2 className="mt-6 font-semibold text-[#0D7377]">Ongoing</h2>
      <ShiftTable rows={open} />
      <h2 className="mt-8 font-semibold">All shifts</h2>
      <ShiftTable rows={all} />
    </div>
  );
}

function ShiftTable({ rows }: { rows: ShiftReportDto[] }) {
  return (
    <div className="mt-2 overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left"><tr><th className="p-3">Cashier</th><th className="p-3">Start</th><th className="p-3">End</th><th className="p-3">Net</th><th className="p-3">Orders</th></tr></thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id} className="border-t">
              <td className="p-3">{s.cashier?.firstName} {s.cashier?.lastName}</td>
              <td className="p-3">{s.shiftStart}</td>
              <td className="p-3">{s.shiftEnd ?? "Ongoing"}</td>
              <td className="p-3">{fmtMoney(s.netSale ?? 0)}</td>
              <td className="p-3">{s.totalOrders ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
