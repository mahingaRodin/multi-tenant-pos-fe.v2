import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { Loader2, Search, ChevronLeft, ChevronRight, Plus, Edit2, Trash2, MoreVertical, X } from "lucide-react";
import { format } from "date-fns";
import { AppShell } from "@/components/layout/AppShell";
import { api, getApiErrorMessage } from "@/lib/api";
import type { StoreDto, BranchDto, OrderDto, OrderItemDto, PagedResponse, EOrderStatus, PaymentType, UserDto } from "@/lib/types";
// Note: Install react-hot-toast for toast notifications: pnpm add react-hot-toast

export const Route = createFileRoute("/super-admin/orders")({
  component: () => (
    <AppShell allow={["ROLE_SUPER_ADMIN"]}>
      <OrdersPage />
    </AppShell>
  ),
});

interface EnrichedOrder extends OrderDto {
  storeBrand?: string;
  branchName?: string;
  customerName?: string;
}

const PAGE_SIZE = 15;

function paymentBadge(type?: string) {
  if (type === "CASH")
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 uppercase tracking-wider">Cash</span>;
  if (type === "CARD")
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 uppercase tracking-wider">Card</span>;
  if (type === "UPI")
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 uppercase tracking-wider">UPI</span>;
  return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-muted text-muted-foreground uppercase tracking-wider">{type ?? "—"}</span>;
}

function statusBadge(status?: EOrderStatus) {
  const styles: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    REFUNDED: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${styles[status ?? "PENDING"] || styles.PENDING}`}>
      {status ?? "PENDING"}
    </span>
  );
}

function OrdersPage() {
  const [allOrders, setAllOrders] = useState<EnrichedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [fetchNonce, setFetchNonce] = useState(0);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<EnrichedOrder | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dropdown state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Form state for create/edit
  const [formData, setFormData] = useState<Partial<OrderDto>>({
    branchId: "",
    customerId: "",
    paymentType: "CASH",
    status: "PENDING",
    items: [],
    totalAmount: 0,
  });

  // Fetch stores, branches, and users for dropdowns
  const [stores, setStores] = useState<StoreDto[]>([]);
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [users, setUsers] = useState<UserDto[]>([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        // Try new endpoint first: GET /api/orders (Super Admin only)
        try {
          const bustSize = 100 + (Date.now() % 4);
          const ordersRes = await api.get<PagedResponse<OrderDto>>("/api/orders", {
            params: { page: 0, size: bustSize },
          });
          
          // Fetch stores and branches for enrichment
          const storeRes = await api.get<PagedResponse<StoreDto>>("/api/stores", {
            params: { page: 0, size: 100 },
          });
          const storesData = storeRes.data?.content ?? [];
          if (mounted) setStores(storesData);

          const branchResults = await Promise.allSettled(
            storesData
              .filter((s) => s.id)
              .map((s) =>
                api.get<PagedResponse<BranchDto>>(`/api/branches/store/${s.id}`, {
                  params: { page: 0, size: 200 },
                })
              )
          );
          
          const allBranches: BranchDto[] = [];
          branchResults.forEach((r) => {
            if (r.status === "fulfilled") allBranches.push(...(r.value.data?.content ?? []));
          });
          if (mounted) setBranches(allBranches);

          // Fetch customers for enrichment
          const usersRes = await api.get<PagedResponse<UserDto>>("/api/users", {
            params: { page: 0, size: 1000 },
          });
          const usersData = usersRes.data?.content ?? [];
          if (mounted) setUsers(usersData);
          const userMap = new Map(usersData.map((u) => [u.id, `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email]));

          // Enrich orders with store/branch/customer names
          const orders = ordersRes.data?.content ?? [];
          const enrichedOrders: EnrichedOrder[] = orders.map((o) => {
            const branch = allBranches.find((b) => b.id === o.branchId);
            const store = storesData.find((s) => s.id === branch?.storeId);
            return {
              ...o,
              branchName: branch?.name,
              storeBrand: store?.brand,
              customerName: o.customerId ? userMap.get(o.customerId) : undefined,
            };
          });

          enrichedOrders.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
          if (mounted) setAllOrders(enrichedOrders);
        } catch {
          // Fallback: use old method (per-branch fetching)
          const storeRes = await api.get<PagedResponse<StoreDto>>("/api/stores", {
            params: { page: 0, size: 100 },
          });
          const stores: StoreDto[] = storeRes.data?.content ?? [];
          if (mounted) setStores(stores);

          const branchResults = await Promise.allSettled(
            stores
              .filter((s) => s.id)
              .map((s) =>
                api
                  .get<PagedResponse<BranchDto>>(`/api/branches/store/${s.id}`, {
                    params: { page: 0, size: 200 },
                  })
                  .then((r) => ({
                    storeBrand: s.brand,
                    branches: (r.data?.content ?? []).map((b) => ({ ...b, storeBrand: s.brand })),
                  }))
              )
          );

          const enrichedBranches: Array<BranchDto & { storeBrand: string }> = [];
          branchResults.forEach((r) => {
            if (r.status === "fulfilled") enrichedBranches.push(...r.value.branches);
          });
          if (mounted) setBranches(enrichedBranches);

          const orderResults = await Promise.allSettled(
            enrichedBranches
              .filter((b) => b.id)
              .map((b) =>
                api
                  .get<PagedResponse<OrderDto>>(`/api/orders/branch/${b.id}`, {
                    params: { page: 0, size: 500 },
                  })
                  .then((r) =>
                    (r.data?.content ?? []).map((o) => ({
                      ...o,
                      storeBrand: b.storeBrand,
                      branchName: b.name,
                    }))
                  )
              )
          );

          // Fetch customers for enrichment
          const usersRes = await api.get<PagedResponse<UserDto>>("/api/users", {
            params: { page: 0, size: 1000 },
          });
          const usersData = usersRes.data?.content ?? [];
          if (mounted) setUsers(usersData);
          const userMap = new Map(usersData.map((u) => [u.id, `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email]));

          const orders: EnrichedOrder[] = [];
          orderResults.forEach((r) => {
            if (r.status === "fulfilled") orders.push(...r.value);
          });

          // Enrich with customer names
          orders.forEach((o) => {
            o.customerName = o.customerId ? userMap.get(o.customerId) : undefined;
          });

          orders.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
          if (mounted) setAllOrders(orders);
        }
      } catch (err) {
        console.error(getApiErrorMessage(err));
        console.error("Failed to load orders");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [fetchNonce]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return allOrders;
    const q = searchQuery.toLowerCase();
    return allOrders.filter(
      (o) =>
        o.id?.toLowerCase().includes(q) ||
        o.storeBrand?.toLowerCase().includes(q) ||
        o.branchName?.toLowerCase().includes(q) ||
        o.customerName?.toLowerCase().includes(q) ||
        o.paymentType?.toLowerCase().includes(q)
    );
  }, [allOrders, searchQuery]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageSlice = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  const totalRevenue = allOrders.reduce((s, o) => s + (o.totalAmount ?? 0), 0);

  const formatAmount = (n?: number) =>
    n !== undefined ? `$${n.toFixed(2)}` : "—";

  // CRUD Handlers
  const handleCreateOrder = async () => {
    if (!formData.branchId) {
      console.error("Please select a branch");
      alert("Please select a branch");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.post<OrderDto>("/api/orders", {
        branchId: formData.branchId,
        customerId: formData.customerId || undefined,
        paymentType: formData.paymentType,
        status: formData.status || "PENDING",
        items: formData.items || [],
        totalAmount: formData.totalAmount || 0,
      });
      console.log("Order created successfully");
      setIsCreateModalOpen(false);
      setFetchNonce((n) => n + 1);
      // Reset form
      setFormData({
        branchId: "",
        customerId: "",
        paymentType: "CASH",
        status: "PENDING",
        items: [],
        totalAmount: 0,
      });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateOrder = async () => {
    if (!selectedOrder?.id) return;
    setIsSubmitting(true);
    try {
      await api.put(`/api/orders/${selectedOrder.id}`, {
        branchId: formData.branchId,
        customerId: formData.customerId,
        paymentType: formData.paymentType,
        status: formData.status,
        items: formData.items,
        totalAmount: formData.totalAmount,
      });
      console.log("Order updated successfully");
      setIsEditModalOpen(false);
      setFetchNonce((n) => n + 1);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!confirm("Are you sure you want to delete this order? This action cannot be undone.")) return;
    try {
      await api.delete(`/api/orders/${id}`);
      console.log("Order deleted successfully");
      setFetchNonce((n) => n + 1);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleUpdateStatus = async (id: string, status: EOrderStatus) => {
    try {
      await api.patch(`/api/orders/${id}/status?status=${status}`);
      console.log(`Order status updated to ${status}`);
      setFetchNonce((n) => n + 1);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const openEditModal = (order: EnrichedOrder) => {
    setSelectedOrder(order);
    setFormData({
      branchId: order.branchId,
      customerId: order.customerId,
      paymentType: order.paymentType,
      status: order.status || "PENDING",
      items: order.items,
      totalAmount: order.totalAmount,
    });
    setIsEditModalOpen(true);
    setOpenMenuId(null);
  };

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    if (openMenuId) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [openMenuId]);

  return (
    <div className="min-h-full bg-background p-8">
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">All Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? "Loading…" : `${allOrders.length.toLocaleString()} orders · Total revenue: $${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({
              branchId: "",
              customerId: "",
              paymentType: "CASH",
              status: "PENDING",
              items: [],
              totalAmount: 0,
            });
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#14B8A6] hover:bg-[#0D9488] text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="size-4" />
          Create Order
        </button>
      </div>

      {/* Search */}
      <div className="bg-card border border-border p-4 rounded-lg flex items-center mb-4 shadow-sm">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(0); }}
            placeholder="Search by order ID, store, branch, customer, or payment type…"
            className="w-full pl-10 pr-4 py-2 border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#14B8A6] bg-card"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex h-60 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted border-b border-border">
                    <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Store</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Branch</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Payment</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-right">Amount</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-right">Date</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {pageSlice.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-muted-foreground">
                        {searchQuery ? "No orders match your search." : "No orders found."}
                      </td>
                    </tr>
                  ) : (
                    pageSlice.map((order) => (
                      <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                          {order.id?.slice(0, 8)}…
                        </td>
                        <td className="px-6 py-4 font-medium text-card-foreground">
                          {order.storeBrand ?? "—"}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {order.branchName ?? "—"}
                        </td>
                        <td className="px-6 py-4 text-card-foreground">
                          {order.customerName ?? "—"}
                        </td>
                        <td className="px-6 py-4">{statusBadge(order.status)}</td>
                        <td className="px-6 py-4">{paymentBadge(order.paymentType)}</td>
                        <td className="px-6 py-4 text-right font-mono font-semibold text-card-foreground">
                          {formatAmount(order.totalAmount)}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-xs text-muted-foreground">
                          {order.createdAt
                            ? format(new Date(order.createdAt), "MMM d, yyyy HH:mm")
                            : "—"}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === order.id ? null : order.id!);
                              }}
                              className="p-1.5 hover:bg-muted rounded transition-colors"
                            >
                              <MoreVertical className="size-4 text-muted-foreground" />
                            </button>
                            {openMenuId === order.id && (
                              <div className="absolute right-0 mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-50 py-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditModal(order);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-card-foreground hover:bg-muted flex items-center gap-2"
                                >
                                  <Edit2 className="size-4" />
                                  Edit Order
                                </button>
                                <div className="border-t border-border my-1" />
                                <div className="px-4 py-1 text-xs font-semibold text-muted-foreground uppercase">Change Status</div>
                                {["PENDING", "COMPLETED", "CANCELLED", "REFUNDED"].map((status) => (
                                  <button
                                    key={status}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUpdateStatus(order.id!, status as EOrderStatus);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full px-4 py-1.5 text-left text-sm text-card-foreground hover:bg-muted flex items-center gap-2"
                                    disabled={order.status === status}
                                  >
                                    <span className={`w-2 h-2 rounded-full ${
                                      status === "PENDING" ? "bg-amber-500" :
                                      status === "COMPLETED" ? "bg-emerald-500" :
                                      status === "CANCELLED" ? "bg-red-500" : "bg-gray-500"
                                    }`} />
                                    {status}
                                    {order.status === status && <span className="ml-auto text-xs text-muted-foreground">(current)</span>}
                                  </button>
                                ))}
                                <div className="border-t border-border my-1" />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteOrder(order.id!);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                >
                                  <Trash2 className="size-4" />
                                  Delete Order
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-card border-t border-border px-6 py-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Showing {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={currentPage === 0}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="p-1 text-muted-foreground hover:bg-muted rounded disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i)}
                      className={`w-8 h-8 rounded text-sm font-mono transition-colors ${
                        currentPage === i
                          ? "bg-[#14B8A6]/20 text-[#14B8A6] font-bold"
                          : "hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  {totalPages > 5 && <span className="text-muted-foreground px-1">…</span>}
                  <button
                    disabled={currentPage >= totalPages - 1}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="p-1 text-muted-foreground hover:bg-muted rounded disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="size-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Order Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Create New Order</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                <X className="size-5 text-muted-foreground" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Branch *</label>
                <select
                  value={formData.branchId}
                  onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                >
                  <option value="">Select a branch</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Customer</label>
                <select
                  value={formData.customerId || ""}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                >
                  <option value="">No Customer</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {`${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Payment Type</label>
                  <select
                    value={formData.paymentType}
                    onChange={(e) => setFormData({ ...formData, paymentType: e.target.value as PaymentType })}
                    className="w-full px-3 py-2 border border-border rounded bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                  >
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as EOrderStatus })}
                    className="w-full px-3 py-2 border border-border rounded bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="REFUNDED">Refunded</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Total Amount</label>
                <input
                  type="number"
                  value={formData.totalAmount || 0}
                  onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-border rounded bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                />
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
                onClick={handleCreateOrder}
                disabled={isSubmitting || !formData.branchId}
                className="px-4 py-2 bg-[#14B8A6] hover:bg-[#0D9488] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                Create Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {isEditModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Edit Order</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                <X className="size-5 text-muted-foreground" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Branch</label>
                <select
                  value={formData.branchId}
                  onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                >
                  <option value="">Select a branch</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Customer</label>
                <div className="w-full px-3 py-2 border border-border rounded bg-muted text-foreground">
                  {selectedOrder?.customerName ?? "—"}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Payment Type</label>
                  <select
                    value={formData.paymentType}
                    onChange={(e) => setFormData({ ...formData, paymentType: e.target.value as PaymentType })}
                    className="w-full px-3 py-2 border border-border rounded bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                  >
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as EOrderStatus })}
                    className="w-full px-3 py-2 border border-border rounded bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="REFUNDED">Refunded</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Total Amount</label>
                <input
                  type="number"
                  value={formData.totalAmount || 0}
                  onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-border rounded bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                />
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
                onClick={handleUpdateOrder}
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#14B8A6] hover:bg-[#0D9488] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                Update Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
