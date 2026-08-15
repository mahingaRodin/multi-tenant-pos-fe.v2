import { createFileRoute, Link, useNavigate, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, ArrowRight, Mail, Lock } from "lucide-react";

import { api, getApiErrorMessage } from "@/lib/api";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useAuthStore, dashboardPathFor } from "@/stores/authStore";
import type { AuthResponse } from "@/lib/types";

const schema = z.object({
  firstName: z.string().trim().min(1, "Required").max(60),
  lastName: z.string().trim().min(1, "Required").max(60),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  password: z.string().min(6, "At least 6 characters"),
  confirmPassword: z.string().min(6, "At least 6 characters"),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});
type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

const inputCls = "w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] bg-card text-card-foreground placeholder:text-muted-foreground";
const labelCls = "block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5";

function SignupPage() {
  const { token, role } = useAuthStore();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  if (token) return <Navigate to={dashboardPathFor(role)} />;

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    try {
      await api.post<AuthResponse>("/api/auth/signup", {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        phone: data.phone || undefined,
        role: "ROLE_CUSTOMER",
      });
      toast.success("Check your email for a 6-digit code.");
      navigate({ to: "/verify-otp", search: { email: data.email } });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-[400px] xl:w-[420px] shrink-0 flex-col p-10" style={{ background: "#0B1120" }}>
        <BrandLogo inverted size="md" />
        <div className="mt-auto mb-8 text-white">
          <h2 className="font-display text-3xl font-bold">Shop every store on POSify.</h2>
          <p className="mt-3 text-sm text-slate-400">Create a customer account, verify your email, then browse products, favorites, and checkout.</p>
        </div>
      </div>
      <div className="relative flex flex-1 items-center justify-center p-8 bg-background">
        <div className="absolute right-4 top-4"><ThemeToggle /></div>
        <div className="w-full max-w-sm">
          <h1 className="font-display text-2xl font-bold">Create your shopper account</h1>
          <p className="mb-6 text-sm text-muted-foreground">Store teams are invited by admin — they do not self-register here.</p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>First name</label>
                <input {...register("firstName")} className={inputCls} />
                {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Last name</label>
                <input {...register("lastName")} className={inputCls} />
                {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}
              </div>
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input type="email" {...register("email")} className={`${inputCls} pl-9`} />
              </div>
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input {...register("phone")} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input type="password" {...register("password")} className={`${inputCls} pl-9`} />
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Repeat password</label>
              <input type="password" {...register("confirmPassword")} className={inputCls} />
              {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
            </div>
            <button type="submit" disabled={submitting} className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#0D7377] py-3 text-sm font-semibold text-white disabled:opacity-60">
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <>Continue <ArrowRight className="size-4" /></>}
            </button>
          </form>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            Own a shop?{" "}
            <Link to="/apply-store" className="font-semibold text-[#14B8A6]">Apply as a store</Link>
            {" · "}
            <Link to="/login" className="font-semibold text-[#14B8A6]">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
