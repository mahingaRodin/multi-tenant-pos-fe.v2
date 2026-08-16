import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import type { UserDto } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile")({
  component: () => (
    <AppShell>
      <ProfilePage />
    </AppShell>
  ),
});

function ProfilePage() {
  const { user, setSession, token } = useAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    phone: user?.phone ?? "",
    profilePicture: user?.profilePicture ?? "",
  });
  const [fileName, setFileName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirm: "" });

  useEffect(() => {
    api.get<UserDto>("/api/profile/me").then((res) => {
      setForm({
        firstName: res.data.firstName ?? "",
        lastName: res.data.lastName ?? "",
        phone: res.data.phone ?? "",
        profilePicture: res.data.profilePicture ?? "",
      });
      if (token) setSession(token, { ...user!, ...res.data });
    }).catch(() => undefined);
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await api.patch<UserDto>("/api/profile/me", form);
      if (token) setSession(token, { ...user!, ...res.data });
      toast.success("Profile updated");
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const changePw = async () => {
    if (pw.newPassword !== pw.confirm) {
      toast.error("New passwords do not match");
      return;
    }
    try {
      await api.post("/api/profile/password", {
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      });
      toast.success("Password updated");
      setPw({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  const onFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, profilePicture: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      <h1 className="font-display text-2xl font-bold">Your profile</h1>
      <p className="text-sm text-muted-foreground">Update how you appear across POSify.</p>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <div className="size-20 overflow-hidden rounded-full bg-primary text-center text-2xl font-bold leading-[5rem] text-white ring-2 ring-border">
          {form.profilePicture ? (
            <img src={form.profilePicture} alt="" className="size-full object-cover" />
          ) : (
            form.firstName[0] ?? "U"
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          <Button
            type="button"
            variant="outline"
            className={cn(
              "group gap-2 transition-all duration-200",
              "hover:border-primary hover:bg-primary/5 hover:text-primary",
              "active:scale-[0.97]",
            )}
            onClick={() => fileRef.current?.click()}
          >
            <ImagePlus className="size-4 transition-transform duration-200 group-hover:scale-110" />
            {form.profilePicture ? "Change photo" : "Choose photo"}
          </Button>
          {fileName && (
            <p className="max-w-[220px] truncate text-xs text-muted-foreground font-mono">{fileName}</p>
          )}
        </div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          First name
          <input
            className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          />
        </label>
        <label className="text-sm">
          Last name
          <input
            className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          />
        </label>
        <label className="text-sm sm:col-span-2">
          Phone
          <input
            className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </label>
      </div>
      <Button className="mt-4 gap-2 active:scale-[0.98] transition-transform" onClick={save} disabled={saving}>
        {saving ? <Loader2 className="size-4 animate-spin" /> : null}
        Save profile
      </Button>

      <h2 className="mt-10 font-display text-xl font-semibold">Password</h2>
      <div className="mt-3 grid gap-3">
        <input
          type="password"
          placeholder="Current"
          className="rounded-lg border bg-background px-3 py-2"
          value={pw.currentPassword}
          onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
        />
        <input
          type="password"
          placeholder="New password"
          className="rounded-lg border bg-background px-3 py-2"
          value={pw.newPassword}
          onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
        />
        <input
          type="password"
          placeholder="Repeat new password"
          className="rounded-lg border bg-background px-3 py-2"
          value={pw.confirm}
          onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
        />
      </div>
      <Button variant="outline" className="mt-3 active:scale-[0.98] transition-transform" onClick={changePw}>
        Update password
      </Button>
    </div>
  );
}
