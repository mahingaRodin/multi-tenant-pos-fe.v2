import { createFileRoute, Link, useNavigate, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ShoppingBag, Loader2 } from "lucide-react";

import { api, getApiErrorMessage } from "@/lib/api";
import { useAuthStore, dashboardPathFor } from "@/stores/authStore";
import type { AuthResponse } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <ShoppingBag className="size-5" />
          </div>
          <span className="font-display text-xl font-bold">RetailOS</span>
        </div>
        <div>
          <h2 className="font-display text-4xl font-bold leading-tight">
            The fastest way to ring up a sale.
          </h2>
          <p className="mt-4 text-primary-foreground/70">
            Sign in to access your dashboard, POS terminal, or customer portal.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/50">© RetailOS</p>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <h1 className="font-display text-3xl font-bold">Sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            New here?{" "}
            <Link to="/signup" className="font-medium text-accent hover:underline">
              Create an account
            </Link>
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={submitting} size="lg">
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
