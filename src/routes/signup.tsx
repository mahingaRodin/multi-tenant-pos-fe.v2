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

const schema = z
  .object({
    firstName: z.string().trim().min(1, "Required").max(60),
    lastName: z.string().trim().min(1, "Required").max(60),
    email: z.string().trim().email("Enter a valid email"),
    phone: z.string().trim().max(30).optional().or(z.literal("")),
    password: z.string().min(6, "At least 6 characters"),
    confirmPassword: z.string().min(6, "At least 6 characters"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

const fieldCls =
  "w-full rounded-xl border border-border bg-background px-3 py-3 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary";
const labelCls = "mb-1.5 block text-sm text-muted-foreground";

function SignupPage() {
  const { token, role } = useAuthStore();
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
    <AuthSplitLayout>
      <div className="mb-6 flex justify-center lg:hidden">
        <BrandLogo size="md" />
      </div>
      <h1 className="text-center font-display text-2xl font-bold">Create an account.</h1>
      <p className="mb-6 text-center text-sm text-muted-foreground">Shoppers register here. Store teams are invited by admin.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className={labelCls}>Email Address</label>
          <input type="email" placeholder="Enter your email address." {...register("email")} className={fieldCls} />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>First name</label>
            <input placeholder="First name" {...register("firstName")} className={fieldCls} />
            {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Last name</label>
            <input placeholder="Last name" {...register("lastName")} className={fieldCls} />
            {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>}
          </div>
        </div>
        <div>
          <label className={labelCls}>Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Create your password."
              {...register("password")}
              className={`${fieldCls} pr-10`}
            />
            <button type="button" onClick={() => setShowPassword((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" tabIndex={-1}>
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
        </div>
        <div>
          <label className={labelCls}>Repeat password</label>
          <input type="password" placeholder="Repeat your password." {...register("confirmPassword")} className={fieldCls} />
          {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>}
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 w-full rounded-full bg-primary py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)] disabled:opacity-60"
        >
          {submitting ? <Loader2 className="mx-auto size-4 animate-spin" /> : "Create an account"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Login
        </Link>
      </p>
      <p className="mt-3 text-center text-sm text-muted-foreground">
        Own a shop?{" "}
        <Link to="/apply-store" className="font-semibold text-primary">
          Apply as a store
        </Link>
      </p>
    </AuthSplitLayout>
  );
}
