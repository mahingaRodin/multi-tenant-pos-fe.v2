import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { Search, Loader2, ChevronLeft, ChevronRight, MoreVertical, Plus, Edit2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import axios, { isAxiosError } from "axios";
import { format } from "date-fns";

import { AppShell } from "@/components/layout/AppShell";
import { api, getApiErrorMessage } from "@/lib/api";
import type { UserDto, PagedResponse, Role, StoreDto, BranchDto, EUserStatus } from "@/lib/types";

interface EnrichedUser extends UserDto {
  storeName?: string;
  branchName?: string;
}

export const Route = createFileRoute("/super-admin/users")({
  component: () => (
    <AppShell allow={["ROLE_SUPER_ADMIN"]}>
      <UsersPage />
    </AppShell>
  ),
});

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  ROLE_SUPER_ADMIN:    { label: "Super Admin",     color: "bg-[#0F172A] text-white" },
  ROLE_STORE_ADMIN:    { label: "Store Admin",      color: "bg-primary/20 text-primary" },
  ROLE_STORE_MANAGER:  { label: "Store Manager",    color: "bg-primary/10 text-primary" },
  ROLE_BRANCH_MANAGER: { label: "Branch Manager",   color: "bg-blue-50 text-blue-700" },
  ROLE_BRANCH_CASHIER: { label: "Cashier",          color: "bg-purple-50 text-purple-700" },
  ROLE_CUSTOMER:       { label: "Customer",         color: "bg-slate-100 text-slate-600" },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ACTIVE:     { label: "Active",     color: "bg-emerald-100 text-emerald-700" },
  SUSPENDED:  { label: "Suspended",  color: "bg-amber-100 text-amber-700" },
  DISCHARGED: { label: "Discharged", color: "bg-red-100 text-red-700" },
};

function statusBadge(status?: EUserStatus) {
  const cfg = status ? (STATUS_LABELS[status] ?? { label: status, color: "bg-slate-100 text-slate-600" }) : { label: "Unknown", color: "bg-slate-100 text-slate-400" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function roleBadge(role?: Role) {
  const cfg = role ? (ROLE_LABELS[role] ?? { label: role, color: "bg-slate-100 text-slate-600" }) : { label: "—", color: "bg-slate-100 text-slate-400" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${cfg.color}`}>
      {cfg.label}
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
  const [users, setUsers] = useState<EnrichedUser[]>([]);
  const [stores, setStores] = useState<StoreDto[]>([]);
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<EUserStatus | "ALL">("ALL");

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const PAGE_SIZE = 10;

  // Modal states for CRUD
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for create/edit
  const [formData, setFormData] = useState<Partial<UserDto>>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "ROLE_CUSTOMER",
    password: "",
    branchId: "",
    storeId: "",
  });

  const fetchUsers = async (p = page, status = filterStatus) => {
    setLoading(true);
    try {
      // Build params
      const params: Record<string, unknown> = { page: p, size: PAGE_SIZE };
      if (status !== "ALL") params.status = status;

      console.log("Fetching users with params:", params);
      console.log("API baseURL:", api.defaults.baseURL);

      // Fetch users, stores, and branches in parallel
      const [usersRes, storesRes, branchesRes] = await Promise.all([
        api.get<PagedResponse<UserDto>>("/api/users", { params }),
        api.get<PagedResponse<StoreDto>>("/api/stores", {
          params: { page: 0, size: 1000 },
        }),
        api.get<PagedResponse<BranchDto>>("/api/branches", {
          params: { page: 0, size: 1000 },
        }),
      ]);

      console.log("Users response:", usersRes.data);

      const usersData = usersRes.data;
      const storesData = storesRes.data?.content ?? [];
      const branchesData = branchesRes.data?.content ?? [];

      setStores(storesData);
      setBranches(branchesData);

      // Create lookup maps
      const storeMap = new Map(storesData.map((s) => [s.id, s.brand || "Store"]));
      const branchMap = new Map(branchesData.map((b) => [b.id, b.name || "Branch"]));

      // Enrich users with store/branch names
      const enrichedUsers: EnrichedUser[] = (usersData?.content ?? []).map((u) => ({
        ...u,
        storeName: u.storeId ? storeMap.get(u.storeId) : undefined,
        branchName: u.branchId ? branchMap.get(u.branchId) : undefined,
      }));

      setUsers(enrichedUsers);
      setTotalPages(usersData?.totalPages ?? 0);
      setTotalElements(usersData?.totalElements ?? 0);
    } catch (err) {
      console.error("Fetch users error:", err);
      if (isAxiosError(err)) {
        const status = err.response?.status;
        const data = err.response?.data as { message?: string; error?: string };
        console.error("Error details:", { status, data, url: err.config?.url, method: err.config?.method });
        toast.error(`API Error ${status}: ${data?.message || data?.error || err.message}`);
      } else {
        toast.error(getApiErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  // CRUD Handlers
  const handleCreateUser = async () => {
    if (!formData.email || !formData.password) {
      toast.error("Email and password are required");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post<UserDto>("/api/users", {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        password: formData.password,
        branchId: formData.branchId || undefined,
        storeId: formData.storeId || undefined,
      });
      toast.success("User created successfully");
      setIsCreateModalOpen(false);
      fetchUsers(page);
      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        role: "ROLE_CUSTOMER",
        password: "",
        branchId: "",
        storeId: "",
      });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser?.id) return;
    setIsSubmitting(true);
    try {
      await api.put(`/api/users/${selectedUser.id}`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        branchId: formData.branchId || undefined,
        storeId: formData.storeId || undefined,
      });
      toast.success("User updated successfully");
      setIsEditModalOpen(false);
      fetchUsers(page);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lifecycle Handlers
  const handleDischargeUser = async (user: EnrichedUser) => {
    const hasAssignments = user.storeId || user.branchId;
    const message = hasAssignments
      ? `⚠️ This user is assigned to ${user.storeName || "a store"}${user.branchName ? ` / ${user.branchName}` : ""}.\n\nDischarging will keep these assignments for history, but the user will be permanently deactivated.\n\nAre you sure you want to discharge?`
      : "Are you sure you want to discharge this user? They will be permanently deactivated.";

    if (!confirm(message)) return;
    try {
      await api.patch(`/api/users/${user.id}/discharge`);
      toast.success("User discharged successfully");
      if (hasAssignments) {
        toast.info("Store/Branch assignments preserved for history. Visit Stores page to reassign if needed.", { duration: 5000 });
      }
      fetchUsers(page);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleSuspendUser = async (user: EnrichedUser) => {
    if (!confirm(`Are you sure you want to suspend ${user.firstName || ""} ${user.lastName || ""}? They will be temporarily blocked from logging in.`)) return;
    try {
      await api.patch(`/api/users/${user.id}/suspend`);
      toast.success("User suspended successfully");
      fetchUsers(page);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleActivateUser = async (user: EnrichedUser) => {
    try {
      await api.patch(`/api/users/${user.id}/activate`);
      toast.success("User activated successfully");
      fetchUsers(page);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleDeleteUser = async (user: EnrichedUser) => {
    // Check if user can be deleted (no assignments)
    try {
      const canDeleteRes = await api.get(`/api/users/${user.id}/can-delete`);
      const canDelete = canDeleteRes.data;
      
      if (!canDelete) {
        toast.error("Cannot delete user linked to store or branch. Use discharge instead.");
        return;
      }

      if (!confirm("Are you sure you want to permanently delete this user? This action cannot be undone.")) return;
      
      await api.delete(`/api/users/${user.id}`);
      toast.success("User deleted successfully");
      fetchUsers(page);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const openEditModal = (user: UserDto) => {
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      password: "", // Don't populate password on edit
      branchId: user.branchId,
      storeId: user.storeId,
    });
    setIsEditModalOpen(true);
    setOpenMenuId(null);
  };

  // Fetch on mount
  useEffect(() => {
    fetchUsers(0, filterStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch when page or filterStatus changes
  useEffect(() => {
    fetchUsers(page, filterStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filterStatus]);

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
        <span className="text-[11px] font-bold text-primary uppercase tracking-widest">Enterprise Control</span>
      </div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground" >
            User &amp; Role Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage system access levels and administrative assignments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterStatus}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterStatus(e.target.value as EUserStatus | "ALL")}
            className="border border-border bg-card rounded-lg py-2 px-3 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="ALL">All Status</option>
            {Object.entries(STATUS_LABELS).map(([val, cfg]) => (
              <option key={val} value={val}>{cfg.label}</option>
            ))}
          </select>
          <select
            value={filterRole}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterRole(e.target.value)}
            className="border border-border bg-card rounded-lg py-2 px-3 text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="ALL">All Roles</option>
            {Object.entries(ROLE_LABELS).map(([val, cfg]) => (
              <option key={val} value={val}>{cfg.label}</option>
            ))}
          </select>
          <button
            onClick={() => {
              setFormData({
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                role: "ROLE_CUSTOMER",
                password: "",
                branchId: "",
                storeId: "",
              });
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-[var(--primary-hover)] text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="size-4" />
            Create User
          </button>
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
            className="w-full pl-10 pr-4 py-2 border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-card text-card-foreground placeholder:text-muted-foreground"
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
                        {searchQuery || filterRole !== "ALL" || filterStatus !== "ALL" ? "No users match your filters." : "No users found."}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
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
                              {user.storeId || user.branchId ? (
                                <>
                                  {user.storeName && (
                                    <p className="text-sm font-medium text-card-foreground">{user.storeName}</p>
                                  )}
                                  {user.branchName && (
                                    <p className="text-xs text-muted-foreground">{user.branchName}</p>
                                  )}
                                  {!user.storeName && !user.branchName && (
                                    <p className="text-sm font-medium text-card-foreground">ID: {(user.storeId || user.branchId)?.slice(0, 8)}...</p>
                                  )}
                                </>
                              ) : (
                                <span className="text-muted-foreground text-sm">Unassigned</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">{statusBadge(user.userStatus)}</td>
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
                              <div className="absolute right-6 top-10 z-50 bg-card border border-border rounded-lg shadow-lg w-48 py-1 text-sm">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditModal(user);
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-muted text-card-foreground flex items-center gap-2"
                                >
                                  <Edit2 className="size-4" />
                                  Edit User
                                </button>
                                
                                {/* Status Actions */}
                                {user.userStatus === "ACTIVE" && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSuspendUser(user);
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-600 flex items-center gap-2"
                                  >
                                    <span className="size-4">⏸</span>
                                    Suspend
                                  </button>
                                )}
                                
                                {user.userStatus === "SUSPENDED" && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleActivateUser(user);
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 flex items-center gap-2"
                                  >
                                    <span className="size-4">▶</span>
                                    Activate
                                  </button>
                                )}
                                
                                {user.userStatus !== "DISCHARGED" && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDischargeUser(user);
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center gap-2"
                                  >
                                    <span className="size-4">🚪</span>
                                    Discharge
                                  </button>
                                )}
                                
                                <div className="border-t border-border my-1" />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteUser(user);
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center gap-2"
                                >
                                  <Trash2 className="size-4" />
                                  Delete
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

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Create New User</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                <X className="size-5 text-muted-foreground" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName || ""}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName || ""}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                  className="w-full px-3 py-2 border border-border rounded bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {Object.entries(ROLE_LABELS).map(([val, cfg]) => (
                    <option key={val} value={val}>{cfg.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Password *</label>
                <input
                  type="password"
                  value={formData.password || ""}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Store ID</label>
                  <input
                    type="text"
                    value={formData.storeId || ""}
                    onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                    placeholder="Optional"
                    className="w-full px-3 py-2 border border-border rounded bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Branch ID</label>
                  <input
                    type="text"
                    value={formData.branchId || ""}
                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                    placeholder="Optional"
                    className="w-full px-3 py-2 border border-border rounded bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                disabled={isSubmitting || !formData.email || !formData.password}
                className="px-4 py-2 bg-primary hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Edit User</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                <X className="size-5 text-muted-foreground" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName || ""}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName || ""}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                  className="w-full px-3 py-2 border border-border rounded bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {Object.entries(ROLE_LABELS).map(([val, cfg]) => (
                    <option key={val} value={val}>{cfg.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Store ID</label>
                  <input
                    type="text"
                    value={formData.storeId || ""}
                    onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                    placeholder="Optional"
                    className="w-full px-3 py-2 border border-border rounded bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Branch ID</label>
                  <input
                    type="text"
                    value={formData.branchId || ""}
                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                    placeholder="Optional"
                    className="w-full px-3 py-2 border border-border rounded bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUser}
                disabled={isSubmitting}
                className="px-4 py-2 bg-primary hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                Update User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
