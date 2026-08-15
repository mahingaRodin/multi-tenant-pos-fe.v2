import axios, { AxiosError } from "axios";
import { useAuthStore } from "@/stores/authStore";

/**
 * Local: VITE_API_BASE_URL=http://localhost:5000 (see .env.example)
 * Vercel/prod: leave empty so the browser calls same-origin `/api/...`
 * and vercel.json rewrites to the Azure Spring Boot API (avoids mixed content).
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ??
  (import.meta.env.DEV ? "http://localhost:5000" : "");

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

// Attach Bearer token + cache-bust on GETs to bypass Spring @Cacheable
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }
  if (config.method?.toLowerCase() === "get") {
    (config.headers as Record<string, string>)["Cache-Control"] = "no-cache, no-store, must-revalidate";
    (config.headers as Record<string, string>)["Pragma"] = "no-cache";
    (config.headers as Record<string, string>)["Expires"] = "0";
  }
  return config;
});

// 401 -> logout
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const { token, logout } = useAuthStore.getState();
      if (token) {
        logout();
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  },
);

export function getApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string; error?: string } | undefined;
    return data?.message || data?.error || err.message || "Request failed";
  }
  if (err instanceof Error) return err.message;
  return "Unexpected error";
}
