import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { api, getApiErrorMessage } from "@/lib/api";
import type { AdminNotification, PagedResponse, TenantRegistrationDto } from "@/lib/types";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/super-admin/businesses")({
  component: () => (
    <AppShell allow={["ROLE_SUPER_ADMIN"]}>
      <BusinessesPage />
    </AppShell>
  ),
});

function BusinessesPage() {
  const [rows, setRows] = useState<TenantRegistrationDto[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [ticker, setTicker] = useState<AdminNotification[]>([]);
  const [note, setNote] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async (p = page) => {
    try {
      const [list, tick] = await Promise.all([
        api.get<PagedResponse<TenantRegistrationDto>>("/api/admin/registrations", { params: { page: p, size: 10 } }),
        api.get<{ items: AdminNotification[] }>("/api/admin/notifications/ticker"),
      ]);
      setRows(list.data.content ?? []);
      setTotalPages(list.data.totalPages ?? 0);
      setTicker(tick.data.items ?? []);
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  useEffect(() => {
    load(page);
  }, [page]);

  const act = async (id: string, path: string, body?: object) => {
    setBusyId(id);
    try {
      await api.post(`/api/admin/registrations/${id}/${path}`, body ?? {});
      toast.success("Updated");
      await load(page);
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-6">
      <h1 className="font-display text-2xl font-bold">Business applications</h1>
      <p className="text-sm text-muted-foreground">Approve, reject, or ask for more information. Approved owners receive an activation email.</p>

      {ticker.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-lg border border-primary/40 bg-primary/10 py-2">
          <div className="landing-marquee px-4 text-sm font-medium">
              {ticker.map((t) => t.title).join("   •   ")}   •   {ticker.map((t) => t.title).join("   •   ")}
            </div>
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Business</th>
              <th className="p-3">Owner</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">
                  <div className="font-semibold">{r.businessName}</div>
                  <div className="text-xs text-muted-foreground">{r.industry} · {r.country}</div>
                  <p className="mt-1 max-w-xs text-xs text-muted-foreground">{r.businessDescription}</p>
                </td>
                <td className="p-3">
                  {r.ownerFirstName} {r.ownerLastName}<br />
                  <span className="text-xs">{r.ownerEmail}</span>
                </td>
                <td className="p-3">{r.status}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" disabled={!!busyId} onClick={() => act(r.id, "approve")}>Approve</Button>
                    <Button size="sm" variant="destructive" disabled={!!busyId} onClick={() => act(r.id, "reject", { rejectionReason: note || "Does not meet onboarding criteria" })}>Reject</Button>
                    <Button size="sm" variant="outline" disabled={!!busyId} onClick={() => act(r.id, "more-info", { adminNotes: note || "Please send registration documents and a store address." })}>Ask more info</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <textarea className="mt-3 w-full rounded-lg border bg-background p-2 text-sm" placeholder="Notes / rejection / more-info message" value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="mt-3 flex gap-2">
        <Button variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
        <Button variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
      </div>
      <p className="mt-4 text-sm"><Link to="/super-admin/stores" className="text-primary">Open live stores</Link></p>
    </div>
  );
}
