import type { CSSProperties } from 'react';

import { Mail, ShieldCheck, SlidersHorizontal } from 'lucide-react';

import { useAuthStore } from '@/stores/auth-store';

function SettingsPage() {
  const user = useAuthStore((state) => state.user);

  function createMotionStyle(delay: number): CSSProperties {
    return {
      '--motion-delay': `${delay}ms`
    } as CSSProperties;
  }

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-10">
      <div className="grid gap-8 border-b border-[var(--study-line)] pb-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div
          className="motion-enter motion-enter-strong relative"
          style={createMotionStyle(0)}
        >
          <div className="motion-orb absolute -left-6 top-0 h-28 w-28 rounded-full bg-[var(--study-orb-gold)] blur-3xl" />
          <div className="relative">
            <p
              className="motion-enter text-[0.7rem] font-medium uppercase tracking-[0.28em] text-[var(--study-kicker)]"
              style={createMotionStyle(70)}
            >
              Settings
            </p>
            <h1
              className="motion-enter font-display mt-5 text-[clamp(2.6rem,5vw,4.6rem)] leading-[0.96] tracking-[-0.05em] text-[var(--study-ink)]"
              style={createMotionStyle(150)}
            >
              Keep your planner identity simple and readable.
            </h1>
            <p
              className="motion-enter mt-5 max-w-2xl text-base leading-8 text-[var(--study-copy)]"
              style={createMotionStyle(230)}
            >
              This area holds the account details tied to your study planner. It
              stays intentionally light so future preferences, course settings,
              and notification controls have room to grow without turning the
              page into a dense admin panel.
            </p>
          </div>
        </div>

        <div
          className="motion-enter flex items-start justify-end"
          style={createMotionStyle(180)}
        >
          <div className="w-full max-w-md border-l border-[var(--study-line)] pl-0 lg:pl-8">
            <div className="flex items-center gap-3 text-[var(--study-ink)]">
              <div className="flex size-11 items-center justify-center rounded-full border border-[var(--study-line-strong)] bg-[var(--study-surface-soft)]">
                <SlidersHorizontal className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em]">
                  Account overview
                </p>
                <p className="mt-1 text-sm leading-6 text-[var(--study-kicker)]">
                  The essentials that identify your planner session.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="motion-enter space-y-5" style={createMotionStyle(300)}>
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.28em] text-[var(--study-kicker)]">
            Profile details
          </p>
          <p className="max-w-sm text-sm leading-7 text-[var(--study-copy)]">
            Use this section as the stable reference point for who is signed in
            and what level of access the planner currently recognizes.
          </p>
        </div>

        <div
          className="motion-enter divide-y divide-[var(--study-line)] border-t border-[var(--study-line)]"
          style={createMotionStyle(360)}
        >
          <div
            className="motion-enter motion-task-row grid gap-4 py-6 md:grid-cols-[0.3fr_0.7fr]"
            style={createMotionStyle(440)}
          >
            <div className="flex items-center gap-3 text-[var(--study-ink)]">
              <Mail className="size-4" />
              <span className="text-xs font-semibold uppercase tracking-[0.22em]">
                Email
              </span>
            </div>
            <div>
              <p className="text-lg font-semibold text-[var(--study-ink-strong)]">
                {user?.email ?? 'No profile loaded'}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--study-copy-muted)]">
                This email anchors your authenticated session inside Smart Study
                Planner.
              </p>
            </div>
          </div>

          <div
            className="motion-enter motion-task-row grid gap-4 py-6 md:grid-cols-[0.3fr_0.7fr]"
            style={createMotionStyle(520)}
          >
            <div className="flex items-center gap-3 text-[var(--study-ink)]">
              <ShieldCheck className="size-4" />
              <span className="text-xs font-semibold uppercase tracking-[0.22em]">
                Role
              </span>
            </div>
            <div>
              <p className="text-lg font-semibold capitalize text-[var(--study-ink-strong)]">
                {user?.role ?? 'student'}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--study-copy-muted)]">
                Your role controls which planner areas and management actions
                are available.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SettingsPage;
