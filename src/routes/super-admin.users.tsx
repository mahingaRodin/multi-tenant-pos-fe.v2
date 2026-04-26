import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { Search, Loader2, ChevronLeft, ChevronRight, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { AppShell } from "@/components/layout/AppShell";
import { api, getApiErrorMessage } from "@/lib/api";
import type { UserDto, PagedResponse, Role } from "@/lib/types";

export const Route = createFileRoute("/super-admin/users")({
  component: () => (
    <AppShell allow={["ROLE_SUPER_ADMIN"]}>
      <UsersPage />
    </AppShell>
  ),
});

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  ROLE_SUPER_ADMIN:    { label: "Super Admin",     color: "bg-[#0F172A] text-white" },
  ROLE_STORE_ADMIN:    { label: "Store Admin",      color: "bg-[#14B8A6]/20 text-[#0d9488]" },
  ROLE_STORE_MANAGER:  { label: "Store Manager",    color: "bg-teal-50 text-teal-700" },
  ROLE_BRANCH_MANAGER: { label: "Branch Manager",   color: "bg-blue-50 text-blue-700" },
  ROLE_BRANCH_CASHIER: { label: "Cashier",          color: "bg-purple-50 text-purple-700" },
  ROLE_CUSTOMER:       { label: "Customer",         color: "bg-slate-100 text-slate-600" },
};

function roleBadge(role?: Role) {
  const cfg = role ? (ROLE_LABELS[role] ?? { label: role, color: "bg-slate-100 text-slate-600" }) : { label: "—", color: "bg-slate-100 text-slate-400" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function statusDot(active: boolean) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold ${active ? "bg-[#14B8A6]/10 text-[#14B8A6]" : "bg-muted text-muted-foreground"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-[#14B8A6]" : "bg-muted-foreground/40"}`} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function UserInitials({ name }: { name: string }) {
  const parts = name.trim().split(" ");
  const initials = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
  return (
    <div className="w-10 h-10 rounded-lg bg-[#0F172A] text-white flex items-center justify-center text-sm font-bold uppercase shrink-0">
      {initials || "?"}
    </div>
  );
}

function UsersPage() {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<string>("ALL");

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const PAGE_SIZE = 10;

  const fetchUsers = async (p = page) => {
    setLoading(true);
    try {
      const res = await api.get<PagedResponse<UserDto>>("/api/users", {
        params: { page: p, size: PAGE_SIZE },
      });
      const data = res.data;
      setUsers(Array.isArray(data?.content) ? data.content : []);
      setTotalPages(data?.totalPages ?? 0);
      setTotalElements(data?.totalElements ?? 0);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const filteredUsers = useMemo(() => {
    let result = users;
    if (filterRole !== "ALL") result = result.filter((u) => u.role === filterRole);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          u.email?.toLowerCase().includes(q) ||
          u.firstName?.toLowerCase().includes(q) ||
          u.lastName?.toLowerCase().includes(q) ||
          u.id?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [users, searchQuery, filterRole]);

  const adminCount = users.filter((u) => u.role === "ROLE_STORE_ADMIN").length;
  const managerCount = users.filter((u) => u.role === "ROLE_STORE_MANAGER" || u.role === "ROLE_BRANCH_MANAGER").length;
  const cashierCount = users.filter((u) => u.role === "ROLE_BRANCH_CASHIER").length;

  const start = page * PAGE_SIZE + 1;
  const end = Math.min((page + 1) * PAGE_SIZE, totalElements);

  return (
    <div className="min-h-full bg-background p-8 font-sans">
      {/* Page Header */}
      <div className="mb-2">
        <span className="text-[11px] font-bold text-[#14B8A6] uppercase tracking-widest">Enterprise Control</span>
      </div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "Syne, sans-serif" }}>
            User &amp; Role Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage system access levels and administrative assignments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterRole}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterRole(e.target.value)}
            className="border border-border bg-card rounded-lg py-2 px-3 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
          >
            <option value="ALL">All Roles</option>
            {Object.entries(ROLE_LABELS).map(([val, cfg]) => (
              <option key={val} value={val}>{cfg.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Total Users", value: totalElements, note: "" },
          { label: "Store Admins", value: adminCount, note: "" },
          { label: "Managers", value: managerCount, note: "" },
          { label: "Cashiers", value: cashierCount, note: "" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card p-6 rounded-xl border border-border shadow-sm">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-card-foreground font-mono">{stat.value}</span>
              {stat.note && <span className="text-xs text-muted-foreground">{stat.note}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="bg-card border border-border p-4 rounded-lg flex items-center justify-between mb-4 shadow-sm">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or ID..."
            className="w-full pl-10 pr-4 py-2 border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:border-[#14B8A6] bg-card text-card-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Staff Hierarchy Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/50">
          <h3 className="text-base font-semibold text-card-foreground">Staff Hierarchy</h3>
          <span className="text-xs text-muted-foreground font-mono">{totalElements} total</span>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted border-b border-border">
                    <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Name &amp; Contact</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Assigned Store</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground text-sm">
                        {searchQuery || filterRole !== "ALL" ? "No users match your filters." : "No users found."}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
                      const isActive = !!(user.lastLogin);
                      return (
                        <tr key={user.id} className="hover:bg-muted/50 transition-colors group relative">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <UserInitials name={fullName} />
                              <div>
                                <p className="font-semibold text-sm text-card-foreground">{fullName}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">{roleBadge(user.role)}</td>
                          <td className="px-6 py-4">
                            <div>
                              {user.storeId ? (
                                <>
                                  <p className="text-sm font-medium text-card-foreground">Store assigned</p>
                                  <p className="text-[10px] text-muted-foreground font-mono">ID: {user.storeId.slice(0, 8)}...</p>
                                </>
                              ) : (
                                <span className="text-muted-foreground text-sm">Unassigned</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">{statusDot(isActive)}</td>
                          <td className="px-6 py-4">
                            <p className="text-xs font-mono text-muted-foreground">
                              {user.createdAt ? format(new Date(user.createdAt), "yyyy-MM-dd") : "—"}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-right relative">
                            <button
                              onClick={() => setOpenMenuId(openMenuId === user.id ? null : (user.id ?? null))}
                              className="text-muted-foreground hover:text-card-foreground transition-colors opacity-0 group-hover:opacity-100 p-1 rounded"
                            >
                              <MoreVertical className="size-4" />
                            </button>
                            {openMenuId === user.id && (
                              <div className="absolute right-6 top-10 z-50 bg-card border border-border rounded-lg shadow-lg w-40 py-1 text-sm">
                                <button
                                  onClick={() => { setOpenMenuId(null); }}
                                  className="w-full text-left px-4 py-2 hover:bg-muted text-card-foreground"
                                >
                                  View Profile
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="bg-card border-t border-border px-6 py-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {totalElements > 0 ? `Showing ${start} to ${end} of ${totalElements} entries` : "No entries"}
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="p-1 text-muted-foreground hover:bg-muted rounded disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="size-5" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`w-8 h-8 rounded text-sm font-mono transition-colors ${
                      page === i
                        ? "bg-muted text-card-foreground font-bold"
                        : "hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                {totalPages > 5 && <span className="text-muted-foreground px-1">...</span>}
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-1 text-muted-foreground hover:bg-muted rounded disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="size-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
