import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { AuthSplitLayout } from "@/components/layout/AuthSplitLayout";
import { useAuthStore, dashboardPathFor } from "@/stores/authStore";
import type { AuthResponse } from "@/lib/types";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/activate")({
  validateSearch: (s: Record<string, unknown>) => ({
    token: typeof s.token === "string" ? s.token : "",
  }),
  component: ActivatePage,
});

function ActivatePage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const match = useMemo(() => password.length >= 6 && password === confirm, [password, confirm]);

  const submit = async () => {
    setBusy(true);
    try {
      const res = await api.post<AuthResponse>("/api/auth/activate", {
        token,
        password,
        confirmPassword: confirm,
      });
      if (!res.data.jwt || !res.data.user) throw new Error("Activation failed");
      setSession(res.data.jwt, res.data.user);
      toast.success("Password saved. Welcome.");
      navigate({ to: dashboardPathFor(res.data.user.role ?? null) });
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthSplitLayout>
      <h1 className="font-display text-2xl font-bold">Set your password</h1>
      <p className="mt-2 text-sm text-muted-foreground">This link is valid for 24 hours. Create a password, then you will be signed in.</p>
      {!token && <p className="mt-4 text-sm text-destructive">Missing activation token. Use the link from your email.</p>}
      <label className="mt-6 block text-xs font-bold uppercase text-muted-foreground">Password</label>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-xl border bg-background px-3 py-3 text-sm" />
      <label className="mt-4 block text-xs font-bold uppercase text-muted-foreground">Repeat password</label>
      <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-1 w-full rounded-xl border bg-background px-3 py-3 text-sm" />
      {confirm && !match && <p className="mt-2 text-xs text-destructive">Passwords must match and be at least 6 characters.</p>}
      <Button className="mt-6 w-full rounded-full bg-primary text-white hover:bg-[var(--primary-hover)]" disabled={!token || !match || busy} onClick={submit}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : "Activate and continue"}
      </Button>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already activated? <Link to="/login" className="text-primary">Sign in</Link>
      </p>
    </AuthSplitLayout>
  );
}
