import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { AuthResponse, AuthUser } from '@/types/auth';

type PersistedAuthState = Pick<AuthStore, 'user' | 'accessToken' | 'refreshToken'>;

type AuthStore = PersistedAuthState & {
  setSession: (session: AuthResponse) => void;
  setUser: (user: AuthUser) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setSession: ({ user, accessToken, refreshToken }) =>
        set({
          user,
          accessToken,
          refreshToken
        }),
      setUser: (user) =>
        set((state) => ({
          ...state,
          user
        })),
      clearSession: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null
        })
    }),
    {
      name: 'smart-study-planner-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: ({ user, accessToken, refreshToken }): PersistedAuthState => ({
        user,
        accessToken,
        refreshToken
      })
    }
  )
);
