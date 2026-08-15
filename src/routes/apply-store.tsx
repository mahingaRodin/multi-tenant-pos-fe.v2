import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type InputHTMLAttributes } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/apply-store")({
  component: ApplyStorePage,
});

type Form = {
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  ownerPhone: string;
  businessName: string;
  legalName: string;
  registrationNumber: string;
  country: string;
  industry: string;
  businessDescription: string;
};

function ApplyStorePage() {
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const { register, handleSubmit } = useForm<Form>({
    defaultValues: { country: "RW", industry: "Retail" },
  });

  const onSubmit = async (data: Form) => {
    setBusy(true);
    try {
      await api.post("/api/registrations", data);
      setDone(true);
      toast.success("Details submitted. Check your email.");
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
        <BrandLogo />
        <ThemeToggle />
      </div>
      <div className="mx-auto max-w-3xl px-4 pb-16">
        <h1 className="font-display text-3xl font-bold">Do you have a store and want to boost your productivity?</h1>
        <p className="mt-2 text-muted-foreground">
          Fill in your business details. POSify admin reviews every application. You will get an email when it is approved, rejected, or if more info is needed.
        </p>
        {done ? (
          <div className="mt-8 rounded-2xl border bg-card p-8">
            <h2 className="font-display text-xl font-semibold">Application under review</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your details were sent to the admin. Watch your inbox — after approval you will receive an activation link to create your password and open the business portal.
            </p>
            <Button className="mt-6" asChild><Link to="/">Back home</Link></Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 grid gap-4 rounded-2xl border bg-card p-6 sm:grid-cols-2">
            <Field label="Owner first name" {...register("ownerFirstName", { required: true })} />
            <Field label="Owner last name" {...register("ownerLastName", { required: true })} />
            <Field label="Owner email" type="email" className="sm:col-span-2" {...register("ownerEmail", { required: true })} />
            <Field label="Phone" {...register("ownerPhone")} />
            <Field label="Business name" {...register("businessName", { required: true })} />
            <Field label="Legal name" {...register("legalName")} />
            <Field label="Registration number" {...register("registrationNumber")} />
            <Field label="Country (ISO)" {...register("country", { required: true, minLength: 2, maxLength: 2 })} />
            <Field label="Industry" {...register("industry")} />
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-bold uppercase text-muted-foreground">Description</label>
              <textarea rows={4} {...register("businessDescription")} className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm" />
            </div>
            <Button type="submit" disabled={busy} className="sm:col-span-2 bg-primary text-primary-foreground">
              {busy ? <Loader2 className="size-4 animate-spin" /> : "Submit for review"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-bold uppercase text-muted-foreground">{label}</label>
      <input {...props} className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm" />
    </div>
  );
}
