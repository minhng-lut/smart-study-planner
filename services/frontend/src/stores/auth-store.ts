import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { AuthResponse, AuthUser } from '@/types/auth';

type PersistedAuthState = {
  user: AuthUser | null;
};

type AuthStore = PersistedAuthState & {
  setSession: (session: AuthResponse) => void;
  setUser: (user: AuthUser) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      setSession: ({ user }) =>
        set({
          user
        }),
      setUser: (user) =>
        set((state) => ({
          ...state,
          user
        })),
      clearSession: () =>
        set({
          user: null
        })
    }),
    {
      name: 'smart-study-planner-auth',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState): PersistedAuthState => {
        const state = persistedState as Partial<PersistedAuthState> | null;

        return {
          user: state?.user ?? null
        };
      },
      partialize: ({ user }): PersistedAuthState => ({
        user
      })
    }
  )
);
