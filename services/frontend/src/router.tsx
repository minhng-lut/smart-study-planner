import { Fragment, useEffect } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
  useNavigate,
  useRouterState
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { toast } from 'sonner';

import { AppSidebar } from '@/components/app-sidebar';
import { getCurrentUser, logout } from '@/lib/auth-api';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { listCourses } from '@/lib/courses-api';
import { useAuthStore } from '@/stores/auth-store';

import App from './App';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from './components/ui/breadcrumb';
import { Separator } from './components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger
} from './components/ui/sidebar';
import AuthPage from './routes/auth-page';
import CalendarPage from './routes/calendar-page';
import CoursePage from './routes/course-page';
import SettingsPage from './routes/settings-page';

function RootLayout() {
  return (
    <>
      <Outlet />
      {import.meta.env.DEV ? (
        <>
          <ReactQueryDevtools
            initialIsOpen={false}
            buttonPosition="bottom-left"
          />
          <TanStackRouterDevtools position="bottom-right" />
        </>
      ) : null}
    </>
  );
}

function ProtectedAppLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({
    select: (state) => state.location.pathname
  });
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getCurrentUser,
    enabled: Boolean(accessToken)
  });

  const coursesQuery = useQuery({
    queryKey: ['courses'],
    queryFn: listCourses,
    enabled: Boolean(accessToken)
  });
  const courses = coursesQuery.data?.courses ?? [];

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      toast.success('Signed out successfully');
      queryClient.removeQueries({ queryKey: ['auth'] });
      await navigate({ to: '/login' });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Unable to sign out'));
    }
  });

  useEffect(() => {
    if (meQuery.data?.user) {
      setUser(meQuery.data.user);
    }
  }, [meQuery.data, setUser]);

  useEffect(() => {
    if (!accessToken) {
      void navigate({ to: '/login' });
    }
  }, [accessToken, navigate]);

  const currentUser = meQuery.data?.user ?? user;
  const routeLabels: Record<string, string> = {
    '/': 'Dashboard',
    '/calendar': 'Calendar',
    '/courses': 'Courses',
    '/settings': 'Settings'
  };
  const breadcrumbItems =
    pathname === '/'
      ? [{ href: '/', label: 'Dashboard' }]
      : pathname
          .split('/')
          .filter(Boolean)
          .map((segment, index, segments) => {
            const href = `/${segments.slice(0, index + 1).join('/')}`;

            return {
              href,
              label:
                href.startsWith('/courses/') && index === 1
                  ? (courses.find((course) => String(course.id) === segment)
                      ?.name ?? `Course ${segment}`)
                  : (routeLabels[href] ??
                    segment
                      .split('-')
                      .map(
                        (part) => part.charAt(0).toUpperCase() + part.slice(1)
                      )
                      .join(' '))
            };
          });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-100 text-slate-950 md:flex">
      <SidebarProvider>
        <AppSidebar
          user={currentUser}
          isLoggingOut={logoutMutation.isPending}
          onLogout={() => logoutMutation.mutate()}
        />
        <SidebarInset>
          <header className="fixed inset-x-0 top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-(--study-line) bg-white/72 backdrop-blur-xl transition-[left,width,height] ease-linear supports-[backdrop-filter]:bg-white/55 md:left-[var(--sidebar-width)] md:group-has-data-[collapsible=icon]/sidebar-wrapper:left-[var(--sidebar-width-icon)] md:group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-6"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbItems.map((item, index) => {
                    const isLastItem = index === breadcrumbItems.length - 1;

                    return (
                      <Fragment key={item.href}>
                        {index > 0 ? <BreadcrumbSeparator /> : null}
                        <BreadcrumbItem>
                          {isLastItem ? (
                            <BreadcrumbPage className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-[var(--study-kicker)] hover:text-[var(--study-ink)]">
                              {item.label}
                            </BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-[var(--study-kicker)] hover:text-[var(--study-ink)]">
                              {item.label}
                            </BreadcrumbLink>
                          )}
                        </BreadcrumbItem>
                      </Fragment>
                    );
                  })}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <main className="flex-1 px-5 pb-6 pt-22 md:px-8 md:pb-8 md:pt-24">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

const rootRoute = createRootRoute({
  component: RootLayout
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  beforeLoad: () => {
    if (useAuthStore.getState().accessToken) {
      throw redirect({ to: '/' });
    }
  },
  component: AuthPage
});

const legacyAuthRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth',
  beforeLoad: () => {
    throw redirect({ to: '/login' });
  }
});

const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app',
  beforeLoad: () => {
    if (!useAuthStore.getState().accessToken) {
      throw redirect({ to: '/login' });
    }
  },
  component: ProtectedAppLayout
});

const dashboardRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/',
  component: App
});

const calendarRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/calendar',
  component: CalendarPage
});

const settingsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/settings',
  component: SettingsPage
});

const courseRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/courses/$courseId',
  component: CoursePage
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  legacyAuthRoute,
  protectedRoute.addChildren([
    dashboardRoute,
    calendarRoute,
    settingsRoute,
    courseRoute
  ])
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
