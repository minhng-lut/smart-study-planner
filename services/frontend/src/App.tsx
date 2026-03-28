import type { CSSProperties } from 'react';

import { Link } from '@tanstack/react-router';
import { BookOpenText, ClipboardList } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { usePlannerStore } from '@/stores/planner-store';

function App() {
  const courses = usePlannerStore((state) => state.courses);
  const totalTasks = courses.reduce(
    (count, course) => count + course.tasks.length,
    0
  );

  function createMotionStyle(delay: number): CSSProperties {
    return {
      '--motion-delay': `${delay}ms`
    } as CSSProperties;
  }

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-10">
      <div className="border-b border-[var(--study-line)] pb-10">
        <p
          className="motion-enter text-[0.7rem] font-medium uppercase tracking-[0.28em] text-[var(--study-kicker)]"
          style={createMotionStyle(0)}
        >
          Dashboard
        </p>
        <div
          className="motion-enter mt-5 flex flex-wrap items-end justify-between gap-6"
          style={createMotionStyle(90)}
        >
          <div className="motion-enter" style={createMotionStyle(160)}>
            <h1 className="font-display text-[clamp(2.6rem,5vw,4.8rem)] leading-[0.95] tracking-[-0.06em] text-[var(--study-ink)]">
              Study load at a glance.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--study-copy)]">
              Keep the overview simple: how many courses you are managing, and
              how many tasks each one currently carries.
            </p>
          </div>

          <Button
            asChild
            variant="outline"
            className="motion-enter rounded-full px-5"
            style={createMotionStyle(220)}
          >
            <Link to="/settings">Settings</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[0.3fr_0.7fr]">
        <div className="space-y-8">
          <div className="motion-enter" style={createMotionStyle(260)}>
            <p className="text-[0.7rem] font-medium uppercase tracking-[0.28em] text-[var(--study-kicker)]">
              Total courses
            </p>
            <div className="mt-3 inline-flex items-end gap-3">
              <span className="font-display text-6xl leading-none tracking-[-0.08em] text-[var(--study-ink)]">
                {courses.length}
              </span>
              <BookOpenText className="mb-2 size-5 text-[var(--study-stat-course)]" />
            </div>
          </div>

          <div className="motion-enter" style={createMotionStyle(340)}>
            <p className="text-[0.7rem] font-medium uppercase tracking-[0.28em] text-[var(--study-kicker)]">
              Total tasks
            </p>
            <div className="mt-3 inline-flex items-end gap-3">
              <span className="font-display text-6xl leading-none tracking-[-0.08em] text-[var(--study-ink)]">
                {totalTasks}
              </span>
              <ClipboardList className="mb-2 size-5 text-[var(--study-stat-task)]" />
            </div>
          </div>
        </div>

        <div
          className="motion-enter border-t border-[var(--study-line)]"
          style={createMotionStyle(420)}
        >
          {courses.length > 0 ? (
            <div className="divide-y divide-[var(--study-line)]">
              {courses.map((course, index) => (
                <Link
                  key={course.id}
                  to="/courses/$courseSlug"
                  params={{ courseSlug: course.slug }}
                  className="motion-enter motion-task-row flex items-center justify-between gap-4 py-5 transition-opacity hover:opacity-75"
                  style={createMotionStyle(500 + index * 70)}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-flex size-3 shrink-0 rounded-full"
                        style={{ backgroundColor: course.color }}
                      />
                      <p className="truncate text-lg font-semibold text-[var(--study-ink-strong)]">
                        {course.name}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-display text-3xl leading-none tracking-[-0.06em] text-[var(--study-ink)]">
                      {course.tasks.length}
                    </p>
                    <p className="mt-1 text-[0.7rem] font-medium uppercase tracking-[0.24em] text-[var(--study-kicker)]">
                      Task{course.tasks.length === 1 ? '' : 's'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div
              className="motion-enter py-8 text-sm leading-7 text-[var(--study-copy-muted)]"
              style={createMotionStyle(500)}
            >
              No courses yet. Add the first one from the sidebar to start
              building your study plan.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default App;
