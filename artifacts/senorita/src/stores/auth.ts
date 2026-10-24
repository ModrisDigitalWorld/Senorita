import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ApiUser } from "@/lib/api";

interface AuthState {
  user: ApiUser | null;
  token: string | null;
  setAuth: (user: ApiUser, token: string) => void;
  logout: () => void;
  isAdmin: () => boolean;
  isLoggedIn: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        localStorage.setItem("senorita_token", token);
        set({ user, token });
      },
      logout: () => {
        localStorage.removeItem("senorita_token");
        set({ user: null, token: null });
      },
      isAdmin: () => get().user?.role === "admin",
      isLoggedIn: () => !!get().token,
    }),
    { name: "senorita-auth", partialize: (s) => ({ user: s.user, token: s.token }) }
  )
);
