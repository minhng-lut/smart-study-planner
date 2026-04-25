import { useState, type CSSProperties, type FormEvent } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import {
  BarChart3,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  LockKeyhole,
  LogIn,
  Mail,
  UserPlus
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { login, register } from '@/lib/auth-api';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { useAuthStore } from '@/stores/auth-store';

type AuthMode = 'login' | 'register';

type FormState = {
  email: string;
  password: string;
};

const initialFormState: FormState = {
  email: '',
  password: ''
};

function AuthPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setSession = useAuthStore((state) => state.setSession);
  const [mode, setMode] = useState<AuthMode>('login');
  const [formState, setFormState] = useState<FormState>(initialFormState);

  const authMutation = useMutation({
    mutationFn: async ({ email, password }: FormState) => {
      const credentials = {
        email,
        password
      };

      return mode === 'login' ? login(credentials) : register(credentials);
    },
    onSuccess: async (session) => {
      toast.success(
        mode === 'login'
          ? 'Signed in successfully'
          : 'Account created successfully'
      );
      setSession(session);
      queryClient.setQueryData(['auth', 'me'], {
        user: session.user
      });

      await navigate({ to: '/' });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Unable to complete the request'));
    }
  });

  const submitLabel =
    mode === 'login' ? 'Sign in to your planner' : 'Create planner account';
  const errorMessage = getApiErrorMessage(
    authMutation.error,
    'Unable to complete the request'
  );

  function handleFieldChange(field: keyof FormState, value: string) {
    setFormState((currentState) => ({
      ...currentState,
      [field]: value
    }));
  }

  function handleModeChange(nextMode: AuthMode) {
    setMode(nextMode);
    authMutation.reset();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await authMutation.mutateAsync(formState);
  }

  function createMotionStyle(delay: number): CSSProperties {
    return {
      '--motion-delay': `${delay}ms`
    } as CSSProperties;
  }

  return (
    <section className="mx-auto h-full min-h-[100vh] w-full h-dvh lg:grid lg:grid-cols-6">
      <div
        className="motion-enter motion-enter-strong relative flex h-full flex-col items-center justify-center overflow-hidden max-lg:hidden lg:col-span-3 xl:col-span-4 p-6"
        style={createMotionStyle(0)}
      >
        <div className="motion-orb absolute -left-12 top-12 h-40 w-40 rounded-full bg-[var(--study-orb-amber)] blur-3xl" />
        <div
          className="motion-orb absolute right-0 top-0 h-64 w-64 rounded-full bg-[var(--study-orb-blue)] blur-3xl"
          style={createMotionStyle(120)}
        />

        <div className="relative">
          <div
            className="motion-enter inline-flex items-center gap-2 border-b border-[var(--study-line)] pb-2 text-sm font-medium uppercase tracking-[0.24em] text-[var(--study-kicker)]"
            style={createMotionStyle(70)}
          >
            <BookOpen className="size-4" />
            Smart Study Planner
          </div>

          <h1
            className="motion-enter font-display mt-6 max-w-4xl text-[clamp(3rem,6vw,6rem)] leading-[0.95] tracking-[-0.04em] text-[var(--study-hero-ink)]"
            style={createMotionStyle(150)}
          >
            Study planning that feels clear, steady, and a little bit playful.
          </h1>

          <p
            className="motion-enter mt-6 max-w-2xl text-[1.04rem] leading-8 text-[var(--study-copy-soft)]"
            style={createMotionStyle(230)}
          >
            Build courses, shape tasks around real deadlines, estimate the time
            each study block needs, and catch overload before the week gets away
            from you.
          </p>

          <div
            className="motion-enter mt-14 grid gap-10 xl:grid-cols-[0.9fr_1.1fr]"
            style={createMotionStyle(320)}
          >
            <div className="motion-enter" style={createMotionStyle(400)}>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--study-kicker-soft)]">
                Planner signals
              </p>
              <div className="mt-7 space-y-8">
                <div className="relative pl-14">
                  <div className="absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--study-step-amber-border)] text-xs font-semibold tracking-[0.2em] text-[var(--study-step-amber-text)]">
                    01
                  </div>
                  <div className="flex items-center gap-3 text-[var(--study-ink-soft)]">
                    <CalendarClock className="size-5" />
                    <p className="text-sm font-semibold uppercase tracking-[0.22em]">
                      Deadline aware
                    </p>
                  </div>
                  <p className="mt-3 max-w-md text-base leading-7 text-[var(--study-copy)]">
                    Plan course work around due dates and estimated hours before
                    the week becomes guesswork.
                  </p>
                </div>

                <div className="relative ml-6 pl-14">
                  <div className="absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--study-step-blue-border)] text-xs font-semibold tracking-[0.2em] text-[var(--study-step-blue-text)]">
                    02
                  </div>
                  <div className="flex items-center gap-3 text-[var(--study-ink-blue)]">
                    <BarChart3 className="size-5" />
                    <p className="text-sm font-semibold uppercase tracking-[0.22em]">
                      Risk and workload
                    </p>
                  </div>
                  <p className="mt-3 max-w-md text-base leading-7 text-[var(--study-copy-blue)]">
                    Surface study pressure, task priority, and distribution in a
                    format that stays readable when students are under time
                    pressure.
                  </p>
                </div>
              </div>
            </div>

            <div
              className="motion-enter self-end border-l border-[var(--study-line)] pl-0 xl:pl-10"
              style={createMotionStyle(480)}
            >
              <div className="flex items-baseline justify-between gap-4 border-b border-[var(--study-line)] pb-4">
                <p className="text-xs uppercase tracking-[0.28em] text-[var(--study-kicker-soft)]">
                  What changes here
                </p>
                <p className="font-display text-4xl leading-none tracking-[-0.05em] text-[var(--study-number-ghost)]">
                  Calm
                </p>
              </div>

              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[var(--study-ink-soft)]">
                    <CheckCircle2 className="size-4" />
                    Finish work with less guesswork
                  </div>
                  <p className="text-sm leading-7 text-[var(--study-copy-muted)]">
                    Keep unfinished tasks visible without making the interface
                    feel punitive or noisy.
                  </p>
                </div>

                <div className="space-y-3 border-t border-[var(--study-line-soft)] pt-4 sm:border-l sm:border-t-0 sm:border-[var(--study-line-soft)] sm:pl-6 sm:pt-0">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[var(--study-ink-soft)]">
                    <UserPlus className="size-4" />
                    Start simple
                  </div>
                  <p className="text-sm leading-7 text-[var(--study-copy-muted)]">
                    Register, add your first course, and let the planner grow
                    into analytics and workload decisions over time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="motion-enter relative flex h-full flex-col items-center justify-center lg:col-span-3 xl:col-span-2"
        style={createMotionStyle(140)}
      >
        <div className="absolute left-0 top-0 hidden h-full w-px bg-[linear-gradient(180deg,transparent,var(--study-divider),transparent)] lg:block" />
        <div className="motion-orb absolute right-8 top-8 h-20 w-20 rounded-full border border-[var(--study-orb-blue-border)] bg-[var(--study-orb-blue-soft)] blur-2xl" />
        <div className="relative p-6">
          <div
            className="motion-enter inline-flex rounded-full border border-[var(--study-line)] bg-[var(--study-tab-surface)] p-1"
            style={createMotionStyle(260)}
          >
            <button
              type="button"
              onClick={() => handleModeChange('login')}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                mode === 'login'
                  ? 'bg-[var(--study-tab-active)] text-[var(--study-tab-active-foreground)]'
                  : 'text-[var(--study-copy-muted)] hover:bg-[var(--study-tab-hover)] hover:text-[var(--study-ink-strong)]'
              }`}
            >
              <LogIn className="size-4" />
              Sign in
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('register')}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                mode === 'register'
                  ? 'bg-[var(--study-tab-active)] text-[var(--study-tab-active-foreground)]'
                  : 'text-[var(--study-copy-muted)] hover:bg-[var(--study-tab-hover)] hover:text-[var(--study-ink-strong)]'
              }`}
            >
              <UserPlus className="size-4" />
              Register
            </button>
          </div>

          <div className="motion-enter mt-8" style={createMotionStyle(340)}>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--study-kicker)]">
              {mode === 'login' ? 'Welcome back' : 'First step'}
            </p>
            <h2 className="font-display mt-3 text-[clamp(2.2rem,4.2vw,3.5rem)] leading-[0.96] tracking-[-0.04em] text-[var(--study-ink)]">
              {mode === 'login'
                ? 'Step back into your study rhythm.'
                : 'Start a planner that respects your deadlines.'}
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--study-copy-muted)]">
              {mode === 'login'
                ? 'Sign in to manage courses, pending tasks, and study analytics with one calm workspace.'
                : 'Register to start creating courses, shaping tasks, and building a study plan that feels manageable.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-10 space-y-8">
            <div
              className="motion-enter space-y-2"
              style={createMotionStyle(420)}
            >
              <label
                htmlFor="email"
                className="flex items-center gap-2 text-sm font-medium text-[var(--study-form-label)]"
              >
                <Mail className="size-4 text-[var(--study-form-icon)]" />
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={formState.email}
                onChange={(event) =>
                  handleFieldChange('email', event.target.value)
                }
                className="h-13 w-full border-0 border-b border-[var(--study-line-strong)] bg-transparent px-0 text-base text-[var(--study-ink-strong)] outline-none transition placeholder:text-[var(--study-placeholder)] focus:border-[var(--study-focus-soft)]"
                placeholder="student@example.com"
                required
              />
            </div>

            <div
              className="motion-enter space-y-2"
              style={createMotionStyle(500)}
            >
              <label
                htmlFor="password"
                className="flex items-center gap-2 text-sm font-medium text-[var(--study-form-label)]"
              >
                <LockKeyhole className="size-4 text-[var(--study-form-icon)]" />
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete={
                  mode === 'login' ? 'current-password' : 'new-password'
                }
                value={formState.password}
                onChange={(event) =>
                  handleFieldChange('password', event.target.value)
                }
                className="h-13 w-full border-0 border-b border-[var(--study-line-strong)] bg-transparent px-0 text-base text-[var(--study-ink-strong)] outline-none transition placeholder:text-[var(--study-placeholder)] focus:border-[var(--study-focus-soft)]"
                placeholder="Minimum 8 characters"
                minLength={8}
                required
              />
            </div>

            {authMutation.isError ? (
              <div
                className="motion-enter rounded-[1.4rem] border border-[var(--study-error-border)] bg-[var(--study-error-surface)] px-4 py-3 text-sm text-[var(--study-error-text)]"
                style={createMotionStyle(540)}
              >
                {errorMessage}
              </div>
            ) : null}

            <div
              className="motion-enter flex flex-wrap items-center gap-5 pt-2"
              style={createMotionStyle(580)}
            >
              <Button
                type="submit"
                size="lg"
                className="h-13 w-full rounded-full bg-[var(--study-tab-active)] px-6 text-[var(--study-tab-active-foreground)] shadow-[var(--study-shadow-button)] hover:opacity-95"
                disabled={authMutation.isPending}
              >
                {mode === 'login' ? (
                  <LogIn className="size-4" />
                ) : (
                  <UserPlus className="size-4" />
                )}
                {authMutation.isPending ? 'Working...' : submitLabel}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

export default AuthPage;
