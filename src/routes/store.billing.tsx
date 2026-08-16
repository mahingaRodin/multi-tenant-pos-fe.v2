import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { api, getApiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { DemoCardFields, emptyDemoCard, type DemoCardState } from "@/components/shared/DemoCardFields";

export const Route = createFileRoute("/store/billing")({
  component: () => (
    <AppShell allow={["ROLE_STORE_ADMIN"]}>
      <BillingPage />
    </AppShell>
  ),
});

type Sub = {
  subscriptionTier?: string;
  status?: string;
  trialEndsAt?: string;
  businessName?: string;
};

const PLANS = [
  {
    tier: "BASIC",
    name: "Growth",
    price: "$49",
    period: "/month",
    blurb: "Up to 3 branches, core POS, inventory, and staff invites.",
    popular: false,
  },
  {
    tier: "PREMIUM",
    name: "Pro",
    price: "$99",
    period: "/month",
    blurb: "Unlimited branches, analytics, priority support, and marketplace boost.",
    popular: true,
  },
] as const;

function BillingPage() {
  const [sub, setSub] = useState<Sub | null>(null);
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState<"BASIC" | "PREMIUM">("PREMIUM");
  const [card, setCard] = useState<DemoCardState>(emptyDemoCard());
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<Sub>("/api/tenant/me/subscription");
      setSub(res.data);
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const blocked = sub?.status === "SUSPENDED" || sub?.status === "DEPROVISIONED";
  const onTrial = sub?.subscriptionTier === "FREE_TRIAL";

  const pay = async () => {
    if (!card.cardNumber.trim()) {
      toast.error("Enter demo card details");
      return;
    }
    setBusy(true);
    try {
      const res = await api.post<Sub>("/api/tenant/me/subscribe", { tier, ...card });
      setSub(res.data);
      toast.success("Plan activated — your business is unlocked");
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="font-display text-2xl font-bold">Billing & subscription</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        15-day free trial, then choose a plan. You can upgrade to Pro while still on trial.
      </p>

      {loading ? (
        <div className="flex h-40 items-center justify-center"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {blocked && (
            <div className="mt-4 flex gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200">
              <ShieldAlert className="size-5 shrink-0" />
              <div>
                <p className="font-semibold">Business blocked — trial or subscription ended</p>
                <p className="mt-1 opacity-90">Stores and related operations stay locked until you switch to a paid plan below.</p>
              </div>
            </div>
          )}

          <div className="mt-6 rounded-2xl border bg-card p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Current plan</p>
            <p className="mt-2 font-display text-2xl font-bold">{sub?.subscriptionTier?.replaceAll("_", " ") || "—"}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Status: {sub?.status || "—"}
              {onTrial && sub?.trialEndsAt ? ` · Trial ends ${new Date(sub.trialEndsAt).toLocaleDateString()}` : null}
            </p>
            {!blocked && <Button className="mt-4" variant="outline" asChild><Link to="/store/dashboard">Back to dashboard</Link></Button>}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {PLANS.map((p) => (
              <button
                key={p.tier}
                type="button"
                onClick={() => setTier(p.tier)}
                className={`rounded-2xl border p-5 text-left transition ${
                  tier === p.tier ? "border-primary ring-2 ring-primary/30" : "hover:border-primary/40"
                } ${p.popular ? "bg-primary/5" : "bg-card"}`}
              >
                {p.popular && <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Most popular</span>}
                <p className="mt-1 font-display text-xl font-bold">{p.name}</p>
                <p className="mt-2 font-display text-3xl font-bold">{p.price}<span className="text-sm font-normal text-muted-foreground">{p.period}</span></p>
                <p className="mt-2 text-sm text-muted-foreground">{p.blurb}</p>
              </button>
            ))}
          </div>

          <div className="mt-6">
            <DemoCardFields value={card} onChange={setCard} title="Pay with card (demo)" />
            <Button className="mt-4 w-full sm:w-auto" disabled={busy} onClick={pay}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              {blocked ? "Switch to priced model & unlock" : onTrial ? "Upgrade from trial" : "Switch plan"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
