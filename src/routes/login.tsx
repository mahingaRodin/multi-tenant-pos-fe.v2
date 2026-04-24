import React from "react";
import { createFileRoute, Link, useNavigate, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Zap, Shield, BarChart2, ArrowRight } from "lucide-react";

import { api, getApiErrorMessage } from "@/lib/api";
import { useAuthStore, dashboardPathFor } from "@/stores/authStore";
import type { AuthResponse } from "@/lib/types";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { token, role, setSession } = useAuthStore();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  if (token) return <Navigate to={dashboardPathFor(role)} />;

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    try {
      const res = await api.post<AuthResponse>("/api/auth/login", data);
      const { jwt, user } = res.data;
      if (!jwt || !user) throw new Error("Malformed response");
      setSession(jwt, user);
      toast.success(`Welcome back, ${user.firstName ?? user.email}`);
      navigate({ to: dashboardPathFor(user.role ?? null) });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel — Dark Navy */}
      <div
        className="hidden lg:flex lg:w-[400px] xl:w-[420px] shrink-0 flex-col p-10 relative overflow-hidden"
        style={{ background: "#0B1120" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 mb-auto">
          <div className="w-8 h-8 rounded bg-[#14B8A6] flex items-center justify-center">
            <span className="text-white text-sm font-bold">P</span>
          </div>
          <span className="text-white text-lg font-bold tracking-tight font-display">POSify</span>
        </div>

        {/* POS Terminal Illustration */}
        <div className="my-8 flex justify-center">
          <div className="w-[280px] h-[220px] rounded-xl border border-slate-700 bg-[#0F172A] flex flex-col items-center justify-center shadow-2xl">
            <div className="w-48 h-32 rounded-lg bg-[#14B8A6]/10 border border-[#14B8A6]/30 flex flex-col items-center justify-center mb-3">
              <div className="text-[#14B8A6] text-sm font-bold mb-1">POSIFY</div>
              <div className="text-slate-400 text-xs text-center leading-relaxed">
                Selling System<br/>
                <span className="text-slate-600">Enterprise Edition</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-[#14B8A6] mt-2 animate-pulse" />
            </div>
            <div className="w-32 h-2 rounded bg-slate-700" />
            <div className="w-48 h-3 rounded bg-slate-800 mt-1" />
          </div>
        </div>

        {/* Tagline */}
        <div className="mb-8">
          <h2 className="text-white text-2xl font-bold leading-tight mb-4 font-display">
            Industrial power.<br />Refined control.
          </h2>
          <div className="space-y-3">
            {[
              { icon: <Zap className="size-4 text-[#14B8A6]" />, title: "High-Throughput Processing", desc: "Engineered for extreme transaction volume." },
              { icon: <Shield className="size-4 text-[#14B8A6]" />, title: "Enterprise-Grade Security", desc: "End-to-end encryption and compliance." },
              { icon: <BarChart2 className="size-4 text-[#14B8A6]" />, title: "Real-time Analytics", desc: "Actionable data insights across branches." },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">{f.icon}</div>
                <div>
                  <p className="text-white text-sm font-semibold">{f.title}</p>
                  <p className="text-slate-400 text-xs">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — White */}
      <div className="flex flex-1 items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-bold text-foreground mb-1 font-display">
            Welcome back
          </h1>
          <p className="text-muted-foreground text-sm mb-8">Enter your credentials to access your terminal.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                autoComplete="email"
                placeholder="manager@branch.com"
                {...register("email")}
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] bg-card text-card-foreground placeholder:text-muted-foreground"
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Password
                </label>
                <button type="button" className="text-xs text-[#14B8A6] hover:underline font-medium">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register("password")}
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] bg-card text-card-foreground placeholder:text-muted-foreground pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-[#0D7377] hover:bg-[#0a5f62] text-white py-3 rounded-lg font-semibold text-sm transition-colors disabled:opacity-60"
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Sign In
              {!submitting && <ArrowRight className="size-4" />}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link to="/signup" className="text-[#14B8A6] font-semibold hover:underline">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
