import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { api, getApiErrorMessage } from "@/lib/api";
import type { AdminNotification, PagedResponse, TenantRegistrationDto } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PaginationBar } from "@/components/shared/PaginationBar";

export const Route = createFileRoute("/super-admin/businesses")({
  component: () => (
    <AppShell allow={["ROLE_SUPER_ADMIN"]}>
      <BusinessesPage />
    </AppShell>
  ),
});

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800",
    UNDER_REVIEW: "bg-sky-100 text-sky-800",
    MORE_INFO: "bg-orange-100 text-orange-800",
    APPROVED: "bg-emerald-100 text-emerald-800",
    REJECTED: "bg-red-100 text-red-800",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${styles[status] ?? "bg-muted text-muted-foreground"}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

function BusinessesPage() {
  const [rows, setRows] = useState<TenantRegistrationDto[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [ticker, setTicker] = useState<AdminNotification[]>([]);
  const [note, setNote] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const load = async (p = page) => {
    try {
      const [list, tick] = await Promise.all([
        api.get<PagedResponse<TenantRegistrationDto>>("/api/admin/registrations", { params: { page: p, size: 10 } }),
        api.get<{ items: AdminNotification[] }>("/api/admin/notifications/ticker"),
      ]);
      setRows(list.data.content ?? []);
      setTotalPages(list.data.totalPages ?? 0);
      setTotal(list.data.totalElements ?? 0);
      setPage(p);
      setTicker(tick.data.items ?? []);
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  useEffect(() => {
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    if (!openMenuId) return;
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest?.("[data-biz-menu]")) return;
      setOpenMenuId(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenuId(null);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [openMenuId]);

  const act = async (id: string, path: string, body?: object) => {
    setBusyId(id);
    setOpenMenuId(null);
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
      <p className="text-sm text-muted-foreground">
        Approve, reject, or ask for more information. Approved owners receive an activation email.
      </p>

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
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const approved = r.status === "APPROVED";
              const actionable = r.status === "PENDING" || r.status === "UNDER_REVIEW" || r.status === "MORE_INFO";
              return (
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
                  <td className="p-3">{statusBadge(r.status)}</td>
                  <td className="relative p-3 text-right" data-biz-menu>
                    <button
                      type="button"
                      className="inline-flex rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      onClick={() => setOpenMenuId(openMenuId === r.id ? null : r.id)}
                      aria-label="Actions"
                    >
                      <MoreVertical className="size-4" />
                    </button>
                    {openMenuId === r.id && (
                      <div className="absolute right-3 top-12 z-50 w-48 rounded-lg border bg-card py-1 text-left text-sm shadow-lg">
                        {approved ? (
                          <p className="px-4 py-2 text-xs text-muted-foreground">Approved — no further actions</p>
                        ) : actionable ? (
                          <div className="flex flex-col">
                            <button
                              type="button"
                              disabled={!!busyId}
                              className="px-4 py-2 text-left text-emerald-600 hover:bg-muted"
                              onClick={() => act(r.id, "approve")}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              disabled={!!busyId}
                              className="px-4 py-2 text-left text-amber-600 hover:bg-muted"
                              onClick={() => act(r.id, "more-info", { adminNotes: note || "Please send registration documents and a store address." })}
                            >
                              Ask more info
                            </button>
                            <button
                              type="button"
                              disabled={!!busyId}
                              className="px-4 py-2 text-left text-red-600 hover:bg-muted"
                              onClick={() => act(r.id, "reject", { rejectionReason: note || "Does not meet onboarding criteria" })}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <p className="px-4 py-2 text-xs text-muted-foreground">No actions for {r.status}</p>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <textarea
        className="mt-3 w-full rounded-lg border bg-background p-2 text-sm"
        placeholder="Notes / rejection / more-info message"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <PaginationBar page={page} totalPages={totalPages} total={total} onPage={setPage} />
      <p className="mt-4 text-sm">
        <Link to="/super-admin/stores" className="text-primary">Open live stores</Link>
      </p>
    </div>
  );
}
