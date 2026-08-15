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

function isAuthRequest(url?: string) {
  return !!url && url.includes("/api/auth");
}

api.interceptors.request.use((config) => {
  const { token, hasHydrated } = useAuthStore.getState();
  const url = `${config.baseURL ?? ""}${config.url ?? ""}`;
  if (token && hasHydrated && !isAuthRequest(url)) {
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

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    const status = error.response?.status;
    const url = `${error.config?.baseURL ?? ""}${error.config?.url ?? ""}`;
    const { token, logout, hasHydrated } = useAuthStore.getState();
    if (status === 401 && token && hasHydrated && !isAuthRequest(url)) {
      logout();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

type ApiErrorBody = {
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export function getApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (err.code === "ECONNABORTED") {
      return "The request took too long. Check your connection and try again.";
    }
    if (!err.response) {
      return "Can't reach the server right now. Check your internet and try again.";
    }
    const data = err.response.data as ApiErrorBody | undefined;
    const fieldMsg = data?.fieldErrors
      ? Object.values(data.fieldErrors).filter(Boolean)[0]
      : undefined;
    const fromApi = data?.message || fieldMsg || data?.error;
    const status = err.response.status;
    if (fromApi && fromApi !== "Unauthorized" && fromApi !== "Forbidden") {
      return fromApi;
    }
    if (status === 401) return "Your session expired. Please sign in again.";
    if (status === 403) return "You don't have permission to do that.";
    if (status === 404) return "We couldn't find that. It may have been removed.";
    if (status === 409) return "That conflicts with existing data. Refresh and try again.";
    if (status === 422) return "This action can't be completed in the current state.";
    if (status >= 500) return "The server hit a problem. Please try again in a moment.";
    return err.message || "Request failed";
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong. Please try again.";
}
