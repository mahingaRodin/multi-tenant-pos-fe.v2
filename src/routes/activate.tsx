import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
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
    <div className="relative flex min-h-screen items-center justify-center bg-background p-6">
      <div className="absolute right-4 top-4"><ThemeToggle /></div>
      <div className="w-full max-w-md rounded-2xl border bg-card p-8">
        <BrandLogo />
        <h1 className="mt-6 font-display text-2xl font-bold">Set your password</h1>
        <p className="mt-2 text-sm text-muted-foreground">Create a password, repeat it, then you will be signed in.</p>
        {!token && <p className="mt-4 text-sm text-destructive">Missing activation token. Use the link from your email.</p>}
        <label className="mt-6 block text-xs font-bold uppercase text-muted-foreground">Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border bg-background px-3 py-2.5 text-sm" />
        <label className="mt-4 block text-xs font-bold uppercase text-muted-foreground">Repeat password</label>
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-1 w-full rounded-lg border bg-background px-3 py-2.5 text-sm" />
        {confirm && !match && <p className="mt-2 text-xs text-destructive">Passwords must match and be at least 6 characters.</p>}
        <Button className="mt-6 w-full" disabled={!token || !match || busy} onClick={submit}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : "Activate and continue"}
        </Button>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already activated? <Link to="/login" className="text-[#14B8A6]">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
