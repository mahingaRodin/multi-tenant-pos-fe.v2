import { createFileRoute, Link, useNavigate, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { api, getApiErrorMessage } from "@/lib/api";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { AuthSplitLayout } from "@/components/layout/AuthSplitLayout";
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

const fieldCls =
  "w-full rounded-xl border border-border bg-background px-3 py-3 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary";

function LoginPage() {
  const { token, role, setSession, hasHydrated } = useAuthStore();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (token && role) return <Navigate to={dashboardPathFor(role)} />;

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
    <AuthSplitLayout>
      <div className="mb-6 flex justify-center lg:hidden">
        <BrandLogo size="md" />
      </div>
      <h1 className="text-center font-display text-2xl font-bold">Welcome back</h1>
      <p className="mb-8 text-center text-sm text-muted-foreground">Enter your credentials to access your terminal.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm text-muted-foreground">Email Address</label>
          <input type="email" autoComplete="email" placeholder="Enter your email address." {...register("email")} className={fieldCls} />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>
        <div>
          <div className="mb-1.5 flex justify-between">
            <label className="text-sm text-muted-foreground">Password</label>
            <button type="button" className="text-xs font-medium text-primary hover:underline">
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password."
              {...register("password")}
              className={`${fieldCls} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)] disabled:opacity-60"
        >
          {submitting ? <Loader2 className="mx-auto size-4 animate-spin" /> : "Sign In"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link to="/signup" className="font-semibold text-primary hover:underline">
          Sign Up
        </Link>
      </p>
    </AuthSplitLayout>
  );
}
