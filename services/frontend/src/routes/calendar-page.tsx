import { useMemo, useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import {
  BookOpenText,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock3,
  ExternalLink,
  Filter,
  Flag,
  ListChecks,
  Rows3,
  Timer
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { listCourses, type Course, type CourseTask } from '@/lib/courses-api';

type CalendarView = 'month' | 'week' | 'year' | 'agenda';

type CalendarTask = CourseTask & {
  course: Course;
  deadlineDate: Date;
};

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEK_START_HOUR = 7;
const WEEK_END_HOUR = 22;
const WEEK_HOUR_HEIGHT = 76;
const WEEK_GRID_HOURS = Array.from(
  { length: WEEK_END_HOUR - WEEK_START_HOUR + 1 },
  (_, index) => WEEK_START_HOUR + index
);

const CALENDAR_VIEWS: Array<{
  id: CalendarView;
  label: string;
  icon: typeof CalendarClock;
}> = [
  { id: 'month', label: 'Month', icon: CalendarDays },
  { id: 'week', label: 'Week', icon: Rows3 },
  { id: 'year', label: 'Year', icon: CalendarClock },
  { id: 'agenda', label: 'Agenda', icon: ListChecks }
];

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getWeekStart(date: Date) {
  const start = new Date(date);
  const offset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - offset);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getYearMonths(date: Date) {
  return Array.from(
    { length: 12 },
    (_, index) => new Date(date.getFullYear(), index, 1)
  );
}

function getCalendarDays(monthDate: Date) {
  const monthStart = getMonthStart(monthDate);
  const gridStart = getWeekStart(monthStart);

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);
    return day;
  });
}

function getWeekDays(date: Date) {
  const weekStart = getWeekStart(date);

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + index);
    return day;
  });
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function isSameMonth(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth()
  );
}

function formatMonthTitle(date: Date) {
  return new Intl.DateTimeFormat('en-FI', {
    month: 'long',
    year: 'numeric'
  }).format(date);
}

function formatMonthName(date: Date) {
  return new Intl.DateTimeFormat('en-FI', {
    month: 'long'
  }).format(date);
}

function formatWeekTitle(date: Date) {
  const days = getWeekDays(date);
  const first = days[0];
  const last = days[days.length - 1];

  return `${new Intl.DateTimeFormat('en-FI', {
    month: 'short',
    day: 'numeric'
  }).format(first)} - ${new Intl.DateTimeFormat('en-FI', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(last)}`;
}

function formatTaskTime(date: Date) {
  return new Intl.DateTimeFormat('en-FI', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function formatTaskDate(date: Date) {
  return new Intl.DateTimeFormat('en-FI', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

function formatDateTimeLabel(value: string | null) {
  if (!value) {
    return 'Not set';
  }

  return new Intl.DateTimeFormat('en-FI', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

function formatTaskStatus(status: CalendarTask['status']) {
  return status.toLowerCase().replace(/_/g, ' ');
}

function formatTaskPriority(priority: CalendarTask['priority']) {
  return priority ? priority.toLowerCase() : 'none';
}

function formatHourLabel(hour: number) {
  return new Intl.DateTimeFormat('en-FI', {
    hour: '2-digit'
  }).format(new Date(2026, 0, 1, hour));
}

function parseHours(value: string) {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function getWeekTaskStyle(task: CalendarTask) {
  const totalMinutes = (WEEK_END_HOUR - WEEK_START_HOUR) * 60;
  const deadlineMinutes =
    task.deadlineDate.getHours() * 60 + task.deadlineDate.getMinutes();
  const startMinutes = Math.min(
    Math.max(deadlineMinutes, WEEK_START_HOUR * 60),
    WEEK_END_HOUR * 60 - 30
  );
  const top = ((startMinutes - WEEK_START_HOUR * 60) / 60) * WEEK_HOUR_HEIGHT;
  const desiredHeight = parseHours(task.estimatedHours) * WEEK_HOUR_HEIGHT;
  const height = Math.min(
    Math.max(desiredHeight, 54),
    (totalMinutes / 60) * WEEK_HOUR_HEIGHT - top
  );

  return { top, height };
}

function getCurrentTimePosition(date: Date) {
  const minutes = date.getHours() * 60 + date.getMinutes();

  if (minutes < WEEK_START_HOUR * 60 || minutes > WEEK_END_HOUR * 60) {
    return null;
  }

  return ((minutes - WEEK_START_HOUR * 60) / 60) * WEEK_HOUR_HEIGHT;
}

function getDayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function collectDeadlineTasks(courses: Course[]) {
  return courses.flatMap((course) =>
    course.tasks
      .filter((task) => task.deadline)
      .map((task) => ({
        ...task,
        course,
        deadlineDate: new Date(task.deadline as string)
      }))
      .filter((task) => !Number.isNaN(task.deadlineDate.getTime()))
  );
}

function groupTasksByDay(tasks: CalendarTask[]) {
  return tasks.reduce<Record<string, CalendarTask[]>>((accumulator, task) => {
    const key = getDayKey(task.deadlineDate);
    accumulator[key] = [...(accumulator[key] ?? []), task].sort(
      (left, right) =>
        left.deadlineDate.getTime() - right.deadlineDate.getTime()
    );
    return accumulator;
  }, {});
}

function getCourseColor(course: Course) {
  return course.color ?? '#4f46e5';
}

function getVisibleTitle(calendarView: CalendarView, visibleDate: Date) {
  if (calendarView === 'week') {
    return formatWeekTitle(visibleDate);
  }

  if (calendarView === 'year') {
    return String(visibleDate.getFullYear());
  }

  if (calendarView === 'agenda') {
    return 'All scheduled tasks';
  }

  return formatMonthTitle(visibleDate);
}

function CalendarEventPill({
  task,
  compact = false,
  onSelect
}: {
  task: CalendarTask;
  compact?: boolean;
  onSelect: (task: CalendarTask) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(task)}
      className={`group/event flex w-full min-w-0 items-center gap-2 rounded-md border px-2 text-left transition-colors hover:bg-[var(--study-surface)] ${
        compact ? 'h-7 text-xs' : 'h-8 text-sm'
      }`}
      style={{
        borderColor: `color-mix(in oklch, ${getCourseColor(task.course)} 34%, transparent)`,
        backgroundColor: `color-mix(in oklch, ${getCourseColor(task.course)} 10%, transparent)`,
        color: getCourseColor(task.course)
      }}
    >
      <span className="size-1.5 shrink-0 rounded-full bg-current" />
      <span className="truncate font-semibold text-[var(--study-ink)] group-hover/event:text-[var(--study-ink)]">
        {task.title}
      </span>
      <span className="ml-auto shrink-0 text-[0.68rem] font-medium text-[var(--study-copy-muted)]">
        {formatTaskTime(task.deadlineDate)}
      </span>
    </button>
  );
}

function TaskDetailDialog({
  task,
  onOpenChange
}: {
  task: CalendarTask | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={Boolean(task)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 text-[var(--study-ink)]">
        {task ? (
          <div>
            <div
              className="h-2 rounded-t-xl"
              style={{ backgroundColor: getCourseColor(task.course) }}
            />
            <div className="p-5 sm:p-6">
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--study-kicker)]">
                  <span className="inline-flex items-center gap-1.5">
                    <BookOpenText className="size-3.5" />
                    {task.course.name}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Circle
                      className="size-2.5 fill-current"
                      style={{ color: getCourseColor(task.course) }}
                    />
                    Deadline task
                  </span>
                </div>
                <DialogTitle className="font-display text-3xl leading-none tracking-[-0.05em] text-[var(--study-ink)]">
                  {task.title}
                </DialogTitle>
                <DialogDescription className="text-sm leading-7 text-[var(--study-copy-muted)]">
                  {task.description?.trim() ||
                    'No description added for this task yet.'}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[var(--study-line)] bg-[var(--study-surface-soft)] p-4">
                  <p className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--study-kicker)]">
                    <CalendarClock className="size-4" />
                    Deadline
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--study-ink)]">
                    {formatDateTimeLabel(task.deadline)}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--study-line)] bg-[var(--study-surface-soft)] p-4">
                  <p className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--study-kicker)]">
                    <CheckCircle2 className="size-4" />
                    Completed at
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--study-ink)]">
                    {formatDateTimeLabel(task.completedAt)}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--study-line)] bg-[var(--study-surface-soft)] p-4">
                  <p className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--study-kicker)]">
                    <Timer className="size-4" />
                    Study time
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--study-ink)]">
                    {task.estimatedHours}h est. / {task.actualHours}h actual
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--study-line)] bg-[var(--study-surface-soft)] p-4">
                  <p className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--study-kicker)]">
                    <Flag className="size-4" />
                    State
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--study-ink)]">
                    {formatTaskStatus(task.status)} /{' '}
                    {formatTaskPriority(task.priority)} priority
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-[var(--study-line)] pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-center gap-2 text-sm text-[var(--study-copy-muted)]">
                  <Clock3 className="size-4" />
                  Created {formatDateTimeLabel(task.createdAt)}
                </p>
                <Button
                  asChild
                  className="rounded-xl bg-[var(--study-ink)] text-white hover:bg-[var(--study-ink)]/90"
                >
                  <Link
                    to="/courses/$courseId"
                    params={{ courseId: String(task.course.id) }}
                  >
                    Open course
                    <ExternalLink className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function CalendarPage() {
  const [visibleDate, setVisibleDate] = useState(() =>
    getMonthStart(new Date())
  );
  const [calendarView, setCalendarView] = useState<CalendarView>('month');
  const [selectedCourseId, setSelectedCourseId] = useState('all');
  const [selectedTask, setSelectedTask] = useState<CalendarTask | null>(null);
  const today = useMemo(() => new Date(), []);
  const coursesQuery = useQuery({
    queryKey: ['courses'],
    queryFn: listCourses
  });

  const courses = useMemo(
    () => coursesQuery.data?.courses ?? [],
    [coursesQuery.data?.courses]
  );
  const allDeadlineTasks = useMemo(
    () => collectDeadlineTasks(courses),
    [courses]
  );
  const deadlineTasks = useMemo(() => {
    if (selectedCourseId === 'all') {
      return allDeadlineTasks;
    }

    return allDeadlineTasks.filter(
      (task) => String(task.course.id) === selectedCourseId
    );
  }, [allDeadlineTasks, selectedCourseId]);
  const tasksByDay = useMemo(
    () => groupTasksByDay(deadlineTasks),
    [deadlineTasks]
  );
  const calendarDays = useMemo(
    () => getCalendarDays(visibleDate),
    [visibleDate]
  );
  const weekDays = useMemo(() => getWeekDays(visibleDate), [visibleDate]);
  const yearMonths = useMemo(() => getYearMonths(visibleDate), [visibleDate]);
  const monthTasks = deadlineTasks.filter(
    (task) => getMonthKey(task.deadlineDate) === getMonthKey(visibleDate)
  );
  const weekTasks = deadlineTasks.filter((task) =>
    weekDays.some((day) => isSameDay(day, task.deadlineDate))
  );
  const yearTasks = deadlineTasks.filter(
    (task) => task.deadlineDate.getFullYear() === visibleDate.getFullYear()
  );
  const agendaTasks = [...deadlineTasks].sort(
    (left, right) => left.deadlineDate.getTime() - right.deadlineDate.getTime()
  );
  const visibleTaskCount =
    calendarView === 'agenda'
      ? agendaTasks.length
      : calendarView === 'year'
        ? yearTasks.length
        : calendarView === 'week'
          ? weekTasks.length
          : monthTasks.length;

  function movePeriod(offset: number) {
    setVisibleDate((current) => {
      if (calendarView === 'week') {
        const next = new Date(current);
        next.setDate(current.getDate() + offset * 7);
        return next;
      }

      if (calendarView === 'year') {
        return new Date(current.getFullYear() + offset, 0, 1);
      }

      return new Date(current.getFullYear(), current.getMonth() + offset, 1);
    });
  }

  function goToToday() {
    if (calendarView === 'week') {
      setVisibleDate(new Date());
      return;
    }

    if (calendarView === 'year') {
      setVisibleDate(new Date(new Date().getFullYear(), 0, 1));
      return;
    }

    setVisibleDate(getMonthStart(new Date()));
  }

  const visibleTitle = getVisibleTitle(calendarView, visibleDate);

  if (coursesQuery.isPending) {
    return (
      <section className="mx-auto flex w-full max-w-[92rem] flex-col gap-5">
        <div className="motion-enter motion-enter-strong flex flex-col gap-4 border-b border-[var(--study-line)] pb-5">
          <div className="h-6 w-44 rounded-full bg-[var(--study-surface-soft)]" />
          <div className="h-20 w-full max-w-xl rounded-3xl bg-[var(--study-surface-soft)]" />
        </div>
        <div className="motion-enter overflow-hidden rounded-[1.6rem] border border-[var(--study-line)] bg-[var(--study-surface)]">
          <div className="flex flex-col gap-4 border-b border-[var(--study-line)] bg-[var(--study-surface-soft)] px-4 py-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-14 rounded-xl bg-[var(--study-surface)]" />
              <div>
                <div className="h-5 w-48 rounded-full bg-[var(--study-surface)]" />
                <div className="mt-2 h-3 w-36 rounded-full bg-[var(--study-surface)]" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-9 w-24 rounded-xl bg-[var(--study-surface)]" />
              <div className="h-9 w-32 rounded-xl bg-[var(--study-surface)]" />
            </div>
          </div>
          <div className="grid min-h-[32rem] grid-cols-7">
            {Array.from({ length: 35 }).map((_, index) => (
              <div
                key={index}
                className="border-b border-r border-[var(--study-line)] p-3"
              >
                <div className="h-6 w-6 rounded-full bg-[var(--study-surface-soft)]" />
                <div className="mt-4 h-6 rounded-lg bg-[var(--study-surface-soft)]" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-[92rem] flex-col gap-5">
      <div className="motion-enter motion-enter-strong flex flex-col gap-4 border-b border-[var(--study-line)] pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 border-b border-[var(--study-line)] pb-2 text-[0.68rem] font-medium uppercase tracking-[0.28em] text-[var(--study-kicker)]">
            <CalendarClock className="size-4 text-[var(--study-focus)]" />
            Study calendar
          </div>
          <h1 className="font-display mt-4 text-[clamp(2.5rem,5vw,4.75rem)] leading-[0.94] tracking-[-0.06em] text-[var(--study-ink)]">
            Deadline map.
          </h1>
        </div>
      </div>

      <div className="motion-enter overflow-hidden rounded-[1.6rem] border border-[var(--study-line)] bg-[var(--study-surface)] shadow-[0_22px_70px_color-mix(in_oklch,var(--study-ink)_8%,transparent)]">
        <div className="flex flex-col gap-4 border-b border-[var(--study-line)] bg-[var(--study-surface-soft)] px-4 py-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={goToToday}
              className="hidden overflow-hidden rounded-xl border border-[var(--study-line)] bg-[var(--study-surface)] text-center transition-transform hover:-translate-y-0.5 hover:border-[var(--study-focus)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--study-focus)] sm:block"
              aria-label="Go to today"
            >
              <span className="block bg-[var(--study-ink)] px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-white">
                {new Intl.DateTimeFormat('en-FI', { month: 'short' }).format(
                  today
                )}
              </span>
              <span className="block px-3 py-1 text-lg font-semibold text-[var(--study-ink)]">
                {today.getDate()}
              </span>
            </button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold tracking-[-0.03em] text-[var(--study-ink)]">
                  {visibleTitle}
                </h2>
                <span className="rounded-full border border-[var(--study-line)] bg-[var(--study-surface)] px-2 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--study-kicker)]">
                  {visibleTaskCount} task{visibleTaskCount === 1 ? '' : 's'}
                </span>
              </div>
              <p className="mt-1 text-sm text-[var(--study-copy-muted)]">
                {calendarView === 'agenda'
                  ? 'Chronological deadline list'
                  : calendarView === 'year'
                    ? `${visibleDate.getFullYear()} deadline overview`
                    : calendarView === 'week'
                      ? formatWeekTitle(visibleDate)
                      : `${formatMonthTitle(visibleDate)} overview`}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="rounded-xl bg-[var(--study-surface)]"
                onClick={() => movePeriod(-1)}
                aria-label="Previous period"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="rounded-xl bg-[var(--study-surface)]"
                onClick={() => movePeriod(1)}
                aria-label="Next period"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>

            <Select
              value={selectedCourseId}
              onValueChange={setSelectedCourseId}
            >
              <SelectTrigger className="h-9 min-w-48 rounded-xl bg-[var(--study-surface)]">
                <Filter className="size-4 text-[var(--study-kicker)]" />
                <SelectValue placeholder="All courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All courses</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={String(course.id)}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="inline-flex rounded-xl border border-[var(--study-line)] bg-[var(--study-surface)] p-1">
              {CALENDAR_VIEWS.map((view) => {
                const Icon = view.icon;
                const isActive = calendarView === view.id;

                return (
                  <button
                    key={view.id}
                    type="button"
                    onClick={() => setCalendarView(view.id)}
                    className={`inline-flex h-8 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[var(--study-ink)] text-white shadow-sm'
                        : 'text-[var(--study-copy-muted)] hover:bg-[var(--study-surface-soft)] hover:text-[var(--study-ink)]'
                    }`}
                    aria-pressed={isActive}
                  >
                    <Icon className="size-4" />
                    <span className="hidden sm:inline">{view.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {calendarView === 'month' ? (
          <div className="motion-enter overflow-x-auto">
            <div className="min-w-[56rem]">
              <div className="grid grid-cols-7 border-b border-[var(--study-line)] bg-[var(--study-surface)] text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-[var(--study-kicker)]">
                {WEEKDAY_LABELS.map((label) => (
                  <div key={label} className="px-3 py-3 text-center">
                    {label}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {calendarDays.map((day) => {
                  const dayTasks = tasksByDay[getDayKey(day)] ?? [];
                  const isCurrentMonth = isSameMonth(day, visibleDate);
                  const isToday = isSameDay(day, today);

                  return (
                    <div
                      key={day.toISOString()}
                      className={`min-h-32 border-b border-r border-[var(--study-line)] p-2.5 ${
                        isCurrentMonth
                          ? 'bg-[var(--study-surface)]'
                          : 'bg-[var(--study-surface-soft)]/70 text-[var(--study-copy-muted)]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex size-7 items-center justify-center rounded-full text-sm font-semibold ${
                            isToday
                              ? 'bg-[var(--study-ink)] text-white'
                              : isCurrentMonth
                                ? 'text-[var(--study-ink)]'
                                : 'text-[var(--study-copy-muted)]'
                          }`}
                        >
                          {day.getDate()}
                        </span>
                        {dayTasks.length > 0 ? (
                          <span className="rounded-full bg-[var(--study-surface-soft)] px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[var(--study-kicker)]">
                            {dayTasks.length}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-3 space-y-1.5">
                        {dayTasks.slice(0, 3).map((task) => (
                          <CalendarEventPill
                            key={task.id}
                            task={task}
                            compact
                            onSelect={setSelectedTask}
                          />
                        ))}
                        {dayTasks.length > 3 ? (
                          <p className="px-2 text-[0.68rem] font-medium text-[var(--study-copy-muted)]">
                            +{dayTasks.length - 3} more
                          </p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : calendarView === 'year' ? (
          <div className="motion-enter bg-[var(--study-surface-soft)] p-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {yearMonths.map((month) => {
                const monthDays = getCalendarDays(month);
                const monthTaskCount = yearTasks.filter(
                  (task) =>
                    task.deadlineDate.getFullYear() === month.getFullYear() &&
                    task.deadlineDate.getMonth() === month.getMonth()
                ).length;

                return (
                  <div
                    key={month.toISOString()}
                    className="overflow-hidden rounded-2xl border border-[var(--study-line)] bg-[var(--study-surface)]"
                  >
                    <div className="flex items-center justify-between border-b border-[var(--study-line)] px-4 py-3">
                      <p className="text-sm font-semibold text-[var(--study-ink)]">
                        {formatMonthName(month)}
                      </p>
                      <span className="rounded-full bg-[var(--study-surface-soft)] px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[var(--study-kicker)]">
                        {monthTaskCount}
                      </span>
                    </div>
                    <div className="grid grid-cols-7 px-3 pt-3 text-center text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[var(--study-kicker)]">
                      {WEEKDAY_LABELS.map((label) => (
                        <span key={label}>{label.slice(0, 1)}</span>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-y-1 px-3 py-3">
                      {monthDays.map((day) => {
                        const dayTasks = tasksByDay[getDayKey(day)] ?? [];
                        const isCurrentMonth = isSameMonth(day, month);
                        const isToday = isSameDay(day, today);

                        return (
                          <button
                            key={day.toISOString()}
                            type="button"
                            onClick={() => {
                              if (dayTasks[0]) {
                                setSelectedTask(dayTasks[0]);
                              }
                            }}
                            disabled={!dayTasks[0]}
                            className={`group/day flex min-h-10 flex-col items-center justify-center rounded-xl text-sm transition-colors disabled:cursor-default ${
                              isToday
                                ? 'bg-[var(--study-ink)] text-white'
                                : isCurrentMonth
                                  ? 'text-[var(--study-ink)] hover:bg-[var(--study-surface-soft)]'
                                  : 'text-[var(--study-copy-muted)] opacity-45'
                            }`}
                          >
                            <span>{day.getDate()}</span>
                            <span className="mt-1 flex h-1.5 max-w-8 items-center justify-center gap-0.5">
                              {dayTasks.slice(0, 4).map((task) => (
                                <span
                                  key={task.id}
                                  className="size-1.5 rounded-full bg-current"
                                  style={{ color: getCourseColor(task.course) }}
                                />
                              ))}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : calendarView === 'week' ? (
          <div className="motion-enter overflow-x-auto">
            <div className="min-w-[68rem]">
              <div className="grid grid-cols-[4.5rem_repeat(7,minmax(8.5rem,1fr))] border-b border-[var(--study-line)] bg-[var(--study-surface)]">
                <div className="border-r border-[var(--study-line)]" />
                {weekDays.map((day) => {
                  const isToday = isSameDay(day, today);

                  return (
                    <div
                      key={day.toISOString()}
                      className="border-r border-[var(--study-line)] px-3 py-3 text-center last:border-r-0"
                    >
                      <p className="text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-[var(--study-kicker)]">
                        {new Intl.DateTimeFormat('en-FI', {
                          weekday: 'short'
                        }).format(day)}
                      </p>
                      <p
                        className={`mx-auto mt-1 inline-flex size-8 items-center justify-center rounded-full text-sm font-semibold ${
                          isToday
                            ? 'bg-[var(--study-ink)] text-white'
                            : 'text-[var(--study-ink)]'
                        }`}
                      >
                        {day.getDate()}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div
                className="relative grid grid-cols-[4.5rem_repeat(7,minmax(8.5rem,1fr))]"
                style={{
                  height: `${(WEEK_END_HOUR - WEEK_START_HOUR) * WEEK_HOUR_HEIGHT}px`
                }}
              >
                <div className="relative border-r border-[var(--study-line)] bg-[var(--study-surface-soft)]">
                  {WEEK_GRID_HOURS.slice(0, -1).map((hour) => (
                    <div
                      key={hour}
                      className="absolute right-2 -translate-y-2 text-[0.7rem] font-medium text-[var(--study-copy-muted)]"
                      style={{
                        top: `${(hour - WEEK_START_HOUR) * WEEK_HOUR_HEIGHT}px`
                      }}
                    >
                      {formatHourLabel(hour)}
                    </div>
                  ))}
                </div>

                {weekDays.map((day) => {
                  const dayTasks = tasksByDay[getDayKey(day)] ?? [];
                  const isToday = isSameDay(day, today);
                  const currentTimePosition = isToday
                    ? getCurrentTimePosition(today)
                    : null;

                  return (
                    <div
                      key={day.toISOString()}
                      className="relative border-r border-[var(--study-line)] bg-[var(--study-surface)] last:border-r-0"
                    >
                      {WEEK_GRID_HOURS.slice(0, -1).map((hour) => (
                        <div
                          key={hour}
                          className="absolute inset-x-0 border-t border-[var(--study-line)]"
                          style={{
                            top: `${(hour - WEEK_START_HOUR) * WEEK_HOUR_HEIGHT}px`
                          }}
                        >
                          <div className="mt-[calc(var(--spacing)*9.5)] border-t border-dashed border-[var(--study-line)] opacity-70" />
                        </div>
                      ))}

                      <div className="pointer-events-none absolute inset-x-0 top-0 h-[76px] bg-[repeating-linear-gradient(115deg,transparent_0,transparent_4px,color-mix(in_oklch,var(--study-line)_70%,transparent)_4px,color-mix(in_oklch,var(--study-line)_70%,transparent)_5px)] opacity-45" />

                      {currentTimePosition !== null ? (
                        <div
                          className="pointer-events-none absolute inset-x-0 z-20 border-t border-[var(--study-ink)]"
                          style={{ top: `${currentTimePosition}px` }}
                        >
                          <span className="absolute -left-1 -top-1.5 size-3 rounded-full bg-[var(--study-ink)]" />
                        </div>
                      ) : null}

                      {dayTasks.map((task, index) => {
                        const taskStyle = getWeekTaskStyle(task);
                        const courseColor = getCourseColor(task.course);

                        return (
                          <button
                            key={task.id}
                            type="button"
                            onClick={() => setSelectedTask(task)}
                            className="absolute z-10 overflow-hidden rounded-lg border px-2 py-2 text-left shadow-sm transition-transform hover:z-30 hover:-translate-y-0.5"
                            style={{
                              top: `${taskStyle.top + index * 4}px`,
                              left: `${8 + (index % 2) * 10}px`,
                              right: `${8 + ((index + 1) % 2) * 10}px`,
                              height: `${taskStyle.height}px`,
                              borderColor: `color-mix(in oklch, ${courseColor} 44%, transparent)`,
                              backgroundColor: `color-mix(in oklch, ${courseColor} 12%, var(--study-surface))`,
                              color: courseColor
                            }}
                          >
                            <span className="block truncate text-sm font-semibold text-[var(--study-ink)]">
                              {task.title}
                            </span>
                            <span className="mt-1 block truncate text-[0.72rem] font-medium text-[var(--study-copy)]">
                              Due {formatTaskTime(task.deadlineDate)}
                            </span>
                            <span className="mt-1 flex items-center gap-1 truncate text-[0.66rem] uppercase tracking-[0.14em] text-[var(--study-kicker)]">
                              <span className="size-1.5 rounded-full bg-current" />
                              {parseHours(task.estimatedHours)}h est.
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="motion-enter max-h-[42rem] overflow-y-auto">
            {agendaTasks.length > 0 ? (
              <div className="divide-y divide-[var(--study-line)]">
                {agendaTasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => setSelectedTask(task)}
                    className="grid w-full gap-4 px-5 py-5 text-left transition-colors hover:bg-[var(--study-surface-soft)] md:grid-cols-[9rem_minmax(0,1fr)_12rem] md:items-center"
                  >
                    <div>
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[var(--study-kicker)]">
                        {formatTaskDate(task.deadlineDate)}
                      </p>
                      <p className="mt-1 text-lg font-semibold text-[var(--study-ink)]">
                        {formatTaskTime(task.deadlineDate)}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-lg font-semibold text-[var(--study-ink)]">
                        {task.title}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--study-copy-muted)]">
                        {task.description?.trim() ||
                          `Planned inside ${task.course.name}`}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--study-kicker)] md:justify-end">
                      <Circle
                        className="size-3 fill-current"
                        style={{ color: getCourseColor(task.course) }}
                      />
                      {task.course.name}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-5 py-16 text-center">
                <p className="font-display text-3xl tracking-[-0.05em] text-[var(--study-ink)]">
                  No deadlines yet.
                </p>
                <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[var(--study-copy-muted)]">
                  Add deadlines to course tasks and this agenda becomes your
                  chronological study plan.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      <TaskDetailDialog
        task={selectedTask}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTask(null);
          }
        }}
      />
    </section>
  );
}

export default CalendarPage;
