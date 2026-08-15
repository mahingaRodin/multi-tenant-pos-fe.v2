import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuthStore, dashboardPathFor } from "@/stores/authStore";
import { LandingPage } from "@/components/landing/LandingPage";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { token, role } = useAuthStore();
  if (token) return <Navigate to={dashboardPathFor(role)} />;
  return <LandingPage />;
}
