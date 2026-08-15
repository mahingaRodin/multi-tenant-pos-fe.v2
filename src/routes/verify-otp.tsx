import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { AuthSplitLayout } from "@/components/layout/AuthSplitLayout";
import { useAuthStore, dashboardPathFor } from "@/stores/authStore";
import type { AuthResponse } from "@/lib/types";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";

type Search = { email?: string };

export const Route = createFileRoute("/verify-otp")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    email: typeof s.email === "string" ? s.email : "",
  }),
  component: VerifyOtpPage,
});

function VerifyOtpPage() {
  const { email } = Route.useSearch();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);

  const verify = async () => {
    setBusy(true);
    try {
      const res = await api.post<AuthResponse>("/api/auth/verify-otp", { email, otp });
      if (!res.data.jwt || !res.data.user) throw new Error("Verification failed");
      setSession(res.data.jwt, res.data.user);
      toast.success("Email verified");
      navigate({ to: dashboardPathFor(res.data.user.role ?? "ROLE_CUSTOMER") });
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    try {
      await api.post("/api/auth/resend-otp", { email });
      toast.success("A new code was sent");
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  return (
    <AuthSplitLayout>
      <h1 className="text-center font-display text-2xl font-bold">Verify your email</h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">Enter the 6-digit code sent to <b>{email || "your inbox"}</b></p>
      <div className="mt-6 flex justify-center">
        <InputOTP maxLength={6} value={otp} onChange={setOtp}>
          <InputOTPGroup>
            {Array.from({ length: 6 }).map((_, i) => (
              <InputOTPSlot key={i} index={i} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>
      <Button className="mt-6 w-full rounded-full bg-primary text-white hover:bg-[var(--primary-hover)]" disabled={busy || otp.length !== 6} onClick={verify}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : "Verify and continue"}
      </Button>
      <button type="button" className="mt-3 w-full text-sm text-primary" onClick={resend}>Resend code</button>
    </AuthSplitLayout>
  );
}
