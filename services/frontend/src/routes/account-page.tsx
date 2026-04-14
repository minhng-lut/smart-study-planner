import { useEffect } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import {
  ArrowRight,
  KeyRound,
  LogOut,
  RefreshCw,
  Shield,
  ShieldCheck,
  UserRound
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  ApiError,
  getCurrentUser,
  logout,
  refreshSession
} from '@/lib/auth-api';
import { useAuthStore } from '@/stores/auth-store';

function AccountPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);

  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getCurrentUser,
    enabled: Boolean(accessToken)
  });

  const refreshMutation = useMutation({
    mutationFn: refreshSession,
    onSuccess: (session) => {
      queryClient.setQueryData(['auth', 'me'], {
        user: session.user
      });
    }
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: ['auth'] });
      await navigate({ to: '/auth' });
    }
  });

  useEffect(() => {
    if (meQuery.data?.user) {
      setUser(meQuery.data.user);
    }
  }, [meQuery.data, setUser]);

  useEffect(() => {
    if (!accessToken) {
      void navigate({ to: '/auth' });
    }
  }, [accessToken, navigate]);

  const currentUser = meQuery.data?.user ?? user;
  const meErrorMessage =
    meQuery.error instanceof ApiError ? meQuery.error.message : null;
  const refreshErrorMessage =
    refreshMutation.error instanceof ApiError
      ? refreshMutation.error.message
      : null;

  return (
    <section className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-16 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-10 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.28)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">
              Account
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
              Protected frontend routes are using the backend JWT session.
            </h1>
          </div>
          <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-600">
            {currentUser?.role ?? 'student'}
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
              <UserRound className="size-4" />
              Signed in as
            </p>
            <p className="mt-3 text-lg font-semibold text-slate-950">
              {currentUser?.email ?? 'Loading profile'}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This data comes from the protected `/auth/me` endpoint.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
              <KeyRound className="size-4" />
              Session state
            </p>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p>Access token: {accessToken ? 'present' : 'missing'}</p>
              <p>Refresh token: {refreshToken ? 'present' : 'missing'}</p>
              <p>Backend profile: {meQuery.isSuccess ? 'loaded' : 'pending'}</p>
            </div>
          </div>
        </div>

        {meErrorMessage ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {meErrorMessage}
          </div>
        ) : null}

        {refreshErrorMessage ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {refreshErrorMessage}
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <Button
            type="button"
            size="lg"
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
          >
            <RefreshCw className="size-4" />
            {refreshMutation.isPending ? 'Refreshing...' : 'Rotate tokens'}
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/platform">
              <ArrowRight className="size-4" />
              Inspect platform tools
            </Link>
          </Button>
          {currentUser?.role === 'admin' ? (
            <Button asChild variant="outline" size="lg">
              <Link to="/admin">
                <Shield className="size-4" />
                Open admin route
              </Link>
            </Button>
          ) : null}
          <Button
            type="button"
            size="lg"
            variant="ghost"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="size-4" />
            {logoutMutation.isPending ? 'Signing out...' : 'Sign out'}
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          Access control
        </p>
        <div className="mt-4 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <ShieldCheck className="size-4 text-slate-700" />
              Router guard
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Unauthenticated users are redirected away from this page before
              the protected UI renders.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Shield className="size-4 text-slate-700" />
              Role-aware navigation
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Admin-only links only appear when the current user role is
              `admin`.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AccountPage;
