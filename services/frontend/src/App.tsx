import type { CSSProperties } from 'react';

import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { BookOpenText, CalendarDays, ClipboardList } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { listCourses, type Course } from '@/lib/courses-api';

function getCourseColor(color: string | null) {
  return color ?? '#4f46e5';
}

function collectUpcomingDeadlines(courses: Course[]) {
  const now = new Date();

  return courses
    .flatMap((course) =>
      course.tasks
        .filter((task) => task.deadline && task.status !== 'COMPLETED')
        .map((task) => ({
          ...task,
          course,
          deadlineDate: new Date(task.deadline as string)
        }))
    )
    .filter(
      (task) =>
        !Number.isNaN(task.deadlineDate.getTime()) &&
        task.deadlineDate.getTime() >= now.getTime()
    )
    .sort(
      (left, right) =>
        left.deadlineDate.getTime() - right.deadlineDate.getTime()
    )
    .slice(0, 4);
}

function formatDeadlineDay(date: Date) {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }

  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  }

  return new Intl.DateTimeFormat('en-FI', {
    day: '2-digit',
    month: 'short'
  }).format(date);
}

function formatDeadlineTime(date: Date) {
  return new Intl.DateTimeFormat('en-FI', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function App() {
  const coursesQuery = useQuery({
    queryKey: ['courses'],
    queryFn: listCourses
  });
  const courses = coursesQuery.data?.courses ?? [];
  const totalTasks = courses.reduce(
    (count, course) => count + course.tasks.length,
    0
  );
  const upcomingDeadlines = collectUpcomingDeadlines(courses);

  function createMotionStyle(delay: number): CSSProperties {
    return {
      '--motion-delay': `${delay}ms`
    } as CSSProperties;
  }

  if (coursesQuery.isPending) {
    return (
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <div className="border-b border-[var(--study-line)] pb-10">
          <p className="motion-enter text-[0.7rem] font-medium uppercase tracking-[0.28em] text-[var(--study-kicker)]">
            Dashboard
          </p>
          <div className="motion-enter mt-5 h-20 w-full max-w-2xl rounded-3xl bg-[var(--study-surface-soft)]" />
          <div className="motion-enter mt-5 h-4 w-full max-w-xl rounded-full bg-[var(--study-surface-soft)]" />
        </div>
        <div className="grid gap-8 lg:grid-cols-[0.3fr_0.7fr]">
          <div className="space-y-8">
            <div className="motion-enter h-28 rounded-3xl bg-[var(--study-surface-soft)]" />
            <div className="motion-enter h-28 rounded-3xl bg-[var(--study-surface-soft)]" />
            <div className="motion-enter h-64 rounded-3xl bg-[var(--study-surface-soft)]" />
          </div>
          <div className="motion-enter space-y-4 border-t border-[var(--study-line)] pt-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-16 rounded-2xl bg-[var(--study-surface-soft)]"
              />
            ))}
          </div>
        </div>
      </section>
    );
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

          <div
            className="motion-enter border-t border-[var(--study-line)] pt-6"
            style={createMotionStyle(420)}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="inline-flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[var(--study-kicker)]">
                <CalendarDays className="size-4 text-[var(--study-focus)]" />
                Deadline runway
              </p>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="rounded-full px-3"
              >
                <Link to="/calendar">Calendar</Link>
              </Button>
            </div>

            {upcomingDeadlines.length > 0 ? (
              <div className="relative mt-5 space-y-0">
                <div className="absolute left-[4.875rem] top-2 h-[calc(100%-1rem)] w-px bg-[var(--study-line)]" />
                {upcomingDeadlines.map((task, index) => (
                  <Link
                    key={task.id}
                    to="/courses/$courseId"
                    params={{ courseId: String(task.course.id) }}
                    className="group/deadline motion-task-row grid grid-cols-[4.25rem_1.25rem_minmax(0,1fr)] gap-3 py-4 transition-opacity hover:opacity-75"
                    style={createMotionStyle(500 + index * 70)}
                  >
                    <div className="text-right">
                      <p className="font-display text-2xl leading-none tracking-[-0.08em] text-[var(--study-ink)]">
                        {String(task.deadlineDate.getDate()).padStart(2, '0')}
                      </p>
                      <p className="mt-1 text-[0.58rem] font-bold uppercase tracking-[0.16em] text-[var(--study-kicker)]">
                        {formatDeadlineDay(task.deadlineDate)}
                      </p>
                    </div>

                    <div className="relative flex justify-center">
                      <span
                        className="relative z-10 mt-2 size-2.5 rounded-full ring-4 ring-white"
                        style={{
                          backgroundColor: getCourseColor(task.course.color)
                        }}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-[var(--study-ink-strong)] transition-colors group-hover/deadline:text-[var(--study-focus)]">
                          {task.title}
                        </p>
                        <span className="shrink-0 rounded-full bg-[var(--study-surface-soft)] px-2 py-0.5 text-[0.62rem] font-semibold text-[var(--study-copy-muted)]">
                          {formatDeadlineTime(task.deadlineDate)}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs font-medium text-[var(--study-copy-muted)]">
                        {task.course.name}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-5 border-l border-[var(--study-line)] py-2 pl-4 text-sm leading-7 text-[var(--study-copy-muted)]">
                No upcoming deadlines yet.
              </p>
            )}
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
                  to="/courses/$courseId"
                  params={{ courseId: String(course.id) }}
                  className="motion-enter motion-task-row flex items-center justify-between gap-4 py-5 transition-opacity hover:opacity-75"
                  style={createMotionStyle(500 + index * 70)}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-flex size-3 shrink-0 rounded-full"
                        style={{
                          backgroundColor: getCourseColor(course.color)
                        }}
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
