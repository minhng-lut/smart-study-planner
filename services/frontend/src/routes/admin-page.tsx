import { useEffect } from 'react';

import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Shield, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ApiError, getAdminAccess } from '@/lib/auth-api';
import { useAuthStore } from '@/stores/auth-store';

function AdminPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const adminQuery = useQuery({
    queryKey: ['auth', 'admin'],
    queryFn: getAdminAccess,
    enabled: Boolean(accessToken)
  });

  useEffect(() => {
    if (!accessToken) {
      void navigate({ to: '/auth' });
      return;
    }

    if (user && user.role !== 'admin') {
      void navigate({ to: '/account' });
    }
  }, [accessToken, navigate, user]);

  const errorMessage =
    adminQuery.error instanceof ApiError ? adminQuery.error.message : null;

  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-16">
      <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-10 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.28)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium uppercase tracking-[0.2em] text-emerald-700">
              <Shield className="size-4" />
              Admin
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
              Admin-only route is protected on both the client and backend.
            </h1>
          </div>
          <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm text-emerald-700">
            {user?.role ?? 'admin'}
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="size-5 text-slate-950" />
            <p className="text-sm font-semibold text-slate-900">
              Backend authorization check
            </p>
          </div>
          <p className="mt-4 text-base text-slate-700">
            {adminQuery.isPending
              ? 'Checking admin access...'
              : (adminQuery.data?.message ?? 'Admin response unavailable')}
          </p>
          {errorMessage ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/account">
              <ArrowLeft className="size-4" />
              Back to account
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/">
              <ArrowLeft className="size-4" />
              Return to dashboard
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export default AdminPage;
