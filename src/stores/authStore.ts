import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { jwtDecode } from "jwt-decode";
import type { Role, UserDto } from "@/lib/types";

interface JwtPayload {
  sub?: string;
  userId?: string;
  id?: string;
  role?: Role;
  authorities?: string[];
  storeId?: string;
  branchId?: string;
  exp?: number;
}

interface AuthState {
  token: string | null;
  user: UserDto | null;
  role: Role | null;
  storeId: string | null;
  branchId: string | null;
  userId: string | null;
  setSession: (jwt: string, user: UserDto) => void;
  logout: () => void;
}

function decodeAndMerge(jwt: string, user: UserDto) {
  let payload: JwtPayload = {};
  try {
    payload = jwtDecode<JwtPayload>(jwt);
  } catch {
    /* ignore */
  }
  const role: Role | null =
    user.role ??
    payload.role ??
    (payload.authorities?.find((a) => a.startsWith("ROLE_")) as Role | undefined) ??
    null;
  return {
    role,
    storeId: user.storeId ?? payload.storeId ?? null,
    branchId: user.branchId ?? payload.branchId ?? null,
    userId: user.id ?? payload.userId ?? payload.id ?? payload.sub ?? null,
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      role: null,
      storeId: null,
      branchId: null,
      userId: null,
      setSession: (jwt, user) => {
        const merged = decodeAndMerge(jwt, user);
        set({ token: jwt, user, ...merged });
      },
      logout: () =>
        set({
          token: null,
          user: null,
          role: null,
          storeId: null,
          branchId: null,
          userId: null,
        }),
    }),
    {
      name: "pos-auth",
      storage: createJSONStorage(() =>
        typeof window === "undefined"
          ? { getItem: () => null, setItem: () => {}, removeItem: () => {} }
          : window.localStorage,
      ),
    },
  ),
);

export function dashboardPathFor(role: Role | null): string {
  switch (role) {
    case "ROLE_SUPER_ADMIN":
      return "/super-admin/dashboard";
    case "ROLE_STORE_ADMIN":
    case "ROLE_STORE_MANAGER":
      return "/store/dashboard";
    case "ROLE_BRANCH_MANAGER":
      return "/branch/dashboard";
    case "ROLE_BRANCH_CASHIER":
      return "/pos";
    case "ROLE_CUSTOMER":
      return "/customer/portal";
    default:
      return "/login";
  }
}
