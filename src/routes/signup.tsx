import React from "react";
import { createFileRoute, Link, useNavigate, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, ArrowRight, Mail, Lock, RotateCcw } from "lucide-react";

import { api, getApiErrorMessage } from "@/lib/api";
import { useAuthStore, dashboardPathFor } from "@/stores/authStore";
import type { AuthResponse, Role } from "@/lib/types";

const ALLOWED_ROLES: { value: Role; label: string }[] = [
  { value: "ROLE_STORE_MANAGER",  label: "Store Manager" },
  { value: "ROLE_BRANCH_MANAGER", label: "Branch Manager" },
  { value: "ROLE_BRANCH_CASHIER", label: "Cashier" },
  { value: "ROLE_CUSTOMER",       label: "Customer" },
];

const schema = z.object({
  firstName: z.string().trim().min(1, "Required").max(60),
  lastName:  z.string().trim().min(1, "Required").max(60),
  email:     z.string().trim().email("Enter a valid email"),
  phone:     z.string().trim().max(30).optional().or(z.literal("")),
  role:      z.enum(["ROLE_STORE_MANAGER","ROLE_BRANCH_MANAGER","ROLE_BRANCH_CASHIER","ROLE_CUSTOMER"], {
    required_error: "Select a role",
  }),
  password:        z.string().min(6, "At least 6 characters"),
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
  const { token, role, setSession } = useAuthStore();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  if (token) return <Navigate to={dashboardPathFor(role)} />;

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    try {
      const res = await api.post<AuthResponse>("/api/auth/signup", {
        firstName: data.firstName,
        lastName:  data.lastName,
        email:     data.email,
        password:  data.password,
        phone:     data.phone || undefined,
        role:      data.role,
      });
      const { jwt, user } = res.data;
      if (!jwt || !user) throw new Error("Malformed response");
      setSession(jwt, user);
      toast.success("Account created — welcome to POSify!");
      navigate({ to: dashboardPathFor(user.role ?? null) });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel — always dark navy (part of brand, not theme-toggled) */}
      <div
        className="hidden lg:flex lg:w-[400px] xl:w-[420px] shrink-0 flex-col p-10 relative overflow-hidden"
        style={{ background: "#0B1120" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-[#14B8A6] flex items-center justify-center">
            <span className="text-white text-sm font-bold">P</span>
          </div>
          <span className="text-white text-lg font-bold tracking-tight font-display">POSify</span>
        </div>

        <div className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 40px,rgba(255,255,255,.1) 40px,rgba(255,255,255,.1) 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(255,255,255,.1) 40px,rgba(255,255,255,.1) 41px)" }}
        />

        <div className="mt-auto mb-8">
          <h2 className="text-white text-3xl font-bold leading-tight mb-4 font-display">
            Industrial Power.<br />Refined Control.
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            Streamline your retail operations with our high-throughput point of sale infrastructure designed for enterprise scale.
          </p>
          <div className="border-t border-slate-700 pt-6 flex items-center gap-3">
            <div className="flex -space-x-2">
              {["#14B8A6","#0891b2","#7c3aed"].map((c, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0B1120] flex items-center justify-center text-xs text-white font-bold" style={{ background: c }}>
                  {["J","M","S"][i]}
                </div>
              ))}
            </div>
            <span className="text-slate-400 text-sm font-medium">10,000+ stores worldwide</span>
          </div>
        </div>
      </div>

      {/* Right Panel — theme-aware */}
      <div className="flex flex-1 items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-foreground mb-1 font-display">
            Create your account
          </h1>
          <p className="text-muted-foreground text-sm mb-8">Enter your details to provision your new workspace.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* First + Last Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>First Name</label>
                <input placeholder="Jane" {...register("firstName")} className={inputCls} />
                {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Last Name</label>
                <input placeholder="Doe" {...register("lastName")} className={inputCls} />
                {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className={labelCls}>Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input type="email" autoComplete="email" placeholder="jane@example.com" {...register("email")}
                  className={`${inputCls} pl-9`} />
              </div>
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            {/* Role */}
            <div>
              <label className={labelCls}>Role</label>
              <select {...register("role")}
                className={`${inputCls} appearance-none`}>
                <option value="">Select a role…</option>
                {ALLOWED_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className={labelCls}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="••••••••"
                  {...register("password")} className={`${inputCls} pl-9 pr-10`} />
                <button type="button" tabIndex={-1} onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className={labelCls}>Confirm Password</label>
              <div className="relative">
                <RotateCcw className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input type={showConfirm ? "text" : "password"} autoComplete="new-password" placeholder="••••••••"
                  {...register("confirmPassword")} className={`${inputCls} pl-9 pr-10`} />
                <button type="button" tabIndex={-1} onClick={() => setShowConfirm(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showConfirm ? "🙈" : "👁"}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-[#0D7377] hover:bg-[#0a5f62] text-white py-3 rounded-lg font-semibold text-sm transition-colors disabled:opacity-60 mt-2">
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Sign Up
              {!submitting && <ArrowRight className="size-4" />}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-[#14B8A6] font-semibold hover:underline">
                Login to dashboard
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
