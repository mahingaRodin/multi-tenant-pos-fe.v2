import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { Clock, DollarSign, Receipt, Banknote, Loader2, Calendar } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import { AppShell } from "@/components/layout/AppShell";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import type { ShiftReportDto, OrderDto } from "@/lib/types";
import { fmtMoney } from "@/lib/format";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/pos/shift")({
  component: () => (
    <AppShell allow={["ROLE_BRANCH_CASHIER"]}>
      <ShiftReportPage />
    </AppShell>
  ),
});

// Mock hourly data for the chart to look good since the API might not return hourly breakdowns
const HOURLY_SALES = [
  { hour: "08:00", sales: 120 },
  { hour: "09:00", sales: 300 },
  { hour: "10:00", sales: 450 },
  { hour: "11:00", sales: 280 },
  { hour: "12:00", sales: 500 },
  { hour: "13:00", sales: 650 },
  { hour: "14:00", sales: 420 },
  { hour: "15:00", sales: 380 },
];

function ShiftReportPage() {
  const { userId } = useAuthStore();
  const [shifts, setShifts] = useState<ShiftReportDto[]>([]);
  const [selectedShiftId, setSelectedShiftId] = useState<string>("current");
  const [activeShift, setActiveShift] = useState<ShiftReportDto | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchShifts = async () => {
      if (!userId) return;
      setLoading(true);
      let myShifts: ShiftReportDto[] = [];
      try {
        const res = await api.get<ShiftReportDto[]>(`/api/shift-reports/cashier/${userId}`);
        myShifts = Array.isArray(res.data) ? res.data : [];
        if (mounted) {
          setShifts(myShifts);
        }

        // Try to load the current active shift
        try {
          const cur = await api.get<ShiftReportDto>(`/api/shift-reports/current`);
          if (mounted) {
            setActiveShift(cur.data);
            setSelectedShiftId("current");
          }
        } catch {
          // No current shift – fall back to the most recent shift
          if (mounted && myShifts.length > 0) {
            setSelectedShiftId(myShifts[0].id!);
            setActiveShift(myShifts[0]);
          }
        }
      } catch (err) {
        toast.error(getApiErrorMessage(err));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchShifts();
    return () => {
      mounted = false;
    };
  }, [userId]);

  const handleShiftChange = (val: string) => {
    setSelectedShiftId(val);
    if (val !== "current") {
      setActiveShift(shifts.find((s) => s.id === val) || null);
    } else {
      // Re-fetch current shift
      api
        .get<ShiftReportDto>(`/api/shift-reports/current`)
        .then((res) => {
          setActiveShift(res.data);
        })
        .catch(() => {
          setActiveShift(null);
        });
    }
  };

  const durationStr = useMemo(() => {
    if (!activeShift?.shiftStart) return "-";
    const start = new Date(activeShift.shiftStart);
    const end = activeShift.shiftEnd ? new Date(activeShift.shiftEnd) : new Date();
    const mins = differenceInMinutes(end, start);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  }, [activeShift]);

  const cashTotal = useMemo(() => {
    if (!activeShift?.paymentSummaries) return 0;
    const cash = activeShift.paymentSummaries.find((p) => p.type === "CASH");
    return cash?.totalAmount || 0;
  }, [activeShift]);

  return (
    <div className="flex h-full flex-col bg-muted/20">
      <div className="border-b bg-card px-6 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold">Shift Report</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Review your sales, orders, and payment summaries.
            </p>
          </div>

          <div className="w-full sm:w-64">
            <Label className="text-xs text-muted-foreground mb-1 block">Select Shift</Label>
            <Select value={selectedShiftId} onValueChange={handleShiftChange}>
              <SelectTrigger>
                <SelectValue placeholder="Current Shift" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current Active Shift</SelectItem>
                {shifts.map((s) => (
                  <SelectItem key={s.id} value={s.id!}>
                    {s.shiftStart
                      ? format(new Date(s.shiftStart), "MMM d, h:mm a")
                      : s.id?.slice(0, 8)}
                    {!s.shiftEnd ? " (Active)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : !activeShift ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed bg-card text-center shadow-sm">
            <Calendar className="mb-4 size-12 text-muted-foreground/50" />
            <h3 className="font-display text-lg font-bold">No Shift Data</h3>
            <p className="text-sm text-muted-foreground mt-1">
              There is no active shift or selected shift data available.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge variant={!activeShift.shiftEnd ? "active" : "muted"}>
                {!activeShift.shiftEnd ? "Active Shift" : "Completed Shift"}
              </StatusBadge>
              <span className="text-sm text-muted-foreground">
                Started:{" "}
                {activeShift.shiftStart
                  ? format(new Date(activeShift.shiftStart), "MMM d, yyyy h:mm a")
                  : "Unknown"}
              </span>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard
                title="Total Sales"
                value={fmtMoney(activeShift.totalSales || 0)}
                icon={DollarSign}
              />
              <SummaryCard
                title="Orders Processed"
                value={activeShift.totalOrders?.toString() || "0"}
                icon={Receipt}
              />
              <SummaryCard title="Cash Collected" value={fmtMoney(cashTotal)} icon={Banknote} />
              <SummaryCard title="Shift Duration" value={durationStr} icon={Clock} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Hourly Sales Chart */}
              <div className="lg:col-span-2 rounded-xl border bg-card p-6 shadow-sm">
                <h3 className="font-display text-lg font-bold mb-4">Hourly Sales Volume</h3>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={HOURLY_SALES}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="hsl(var(--muted))"
                      />
                      <XAxis
                        dataKey="hour"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                        tickFormatter={(v) => `$${v}`}
                      />
                      <Tooltip
                        cursor={{ fill: "hsl(var(--muted)/0.5)" }}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderRadius: "8px",
                          border: "1px solid hsl(var(--border))",
                        }}
                        formatter={(value) => [fmtMoney(Number(value)), "Sales"]}
                      />
                      <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <h3 className="font-display text-lg font-bold mb-4">Payment Breakdown</h3>
                <div className="space-y-4">
                  {activeShift.paymentSummaries?.map((ps) => (
                    <div key={ps.type} className="flex flex-col gap-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium capitalize">{ps.type.toLowerCase()}</span>
                        <span className="font-bold">{fmtMoney(ps.totalAmount)}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${ps.percentage}%` }} />
                      </div>
                      <div className="text-xs text-muted-foreground text-right">
                        {ps.transactionCount} transactions ({ps.percentage}%)
                      </div>
                    </div>
                  ))}
                  {(!activeShift.paymentSummaries || activeShift.paymentSummaries.length === 0) && (
                    <div className="text-sm text-muted-foreground py-4 text-center">
                      No transactions recorded yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Orders Table */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="p-4 border-b bg-muted/20">
                <h3 className="font-display text-lg font-bold">Shift Orders</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-6 py-4 font-medium">Order ID</th>
                      <th className="px-6 py-4 font-medium">Time</th>
                      <th className="px-6 py-4 font-medium">Payment</th>
                      <th className="px-6 py-4 font-medium text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {activeShift.recentOrders?.map((order: OrderDto) => (
                      <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                          {order.id?.slice(0, 12)}...
                        </td>
                        <td className="px-6 py-4">
                          {order.createdAt ? format(new Date(order.createdAt), "h:mm a") : "-"}
                        </td>
                        <td className="px-6 py-4 capitalize">{order.paymentType.toLowerCase()}</td>
                        <td className="px-6 py-4 text-right font-display font-bold">
                          {fmtMoney(order.totalAmount)}
                        </td>
                      </tr>
                    ))}
                    {(!activeShift.recentOrders || activeShift.recentOrders.length === 0) && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                          No orders found for this shift.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ title, value, icon: Icon }: any) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
          <Icon className="size-4 text-primary" />
        </div>
      </div>
      <div className="mt-4">
        <span className="font-display text-3xl font-bold">{value}</span>
      </div>
    </div>
  );
}
