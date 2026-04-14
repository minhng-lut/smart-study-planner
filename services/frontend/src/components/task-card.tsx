import { Link } from '@tanstack/react-router';
import { AlarmClock, ChevronDown, Flag, Timer } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import type { Course } from '@/lib/courses-api';
import type { Task } from '@/lib/tasks-api';

type StatusUpdate = 'pending' | 'in_progress' | 'completed' | 'overdue';

type TaskCardProps = {
  task: Task;
  index?: number;
  course?: Course | null;
  courseColor?: string;
  variant?: 'card' | 'row';
  showCourseChip?: boolean;
  isUpdatingStatus?: boolean;
  onUpdateStatus?: (task: Task, status: StatusUpdate) => void;
};

function formatDeadline(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function statusLabel(status: string | null | undefined) {
  return (status ?? 'PENDING').toLowerCase().replace('_', ' ');
}

function statusLabelTitle(status: string | null | undefined) {
  return capitalizeFirst(statusLabel(status));
}

function statusTone(status: string | null | undefined) {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
    case 'in_progress':
      return 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300';
    case 'overdue':
      return 'border-destructive/30 bg-destructive/10 text-destructive';
    case 'pending':
    default:
      return 'border-[var(--study-line)] bg-[var(--study-surface-soft)] text-[var(--study-copy-muted)]';
  }
}

function getPriorityTone(priority: string | null | undefined) {
  switch (priority?.toLowerCase()) {
    case 'high':
      return 'border-destructive/30 bg-destructive/10 text-destructive';
    case 'medium':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400';
    case 'low':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    default:
      return 'border-[var(--study-line)] bg-[var(--study-surface-soft)] text-[var(--study-copy-muted)]';
  }
}

function formatHours(value: string | number | null | undefined) {
  if (value === null || value === undefined) return null;
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return `${numeric}h`;
}

function capitalizeFirst(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function TaskCard({
  task,
  index,
  course,
  courseColor,
  variant = 'card',
  showCourseChip = true,
  isUpdatingStatus,
  onUpdateStatus
}: TaskCardProps) {
  const derivedCourseColor = courseColor ?? course?.color ?? '#4f46e5';
  const showIndex = typeof index === 'number' && Number.isFinite(index);

  const containerClassName =
    variant === 'card'
      ? 'rounded-2xl border border-[var(--study-line)] bg-white/65 px-4 py-5 shadow-sm backdrop-blur-sm md:px-5 md:py-6'
      : 'w-full';

  return (
    <div className={containerClassName}>
      <div className="grid gap-4 md:grid-cols-[0.08fr_0.92fr]">
        <div className="flex items-start justify-start text-[0.7rem] font-medium uppercase tracking-[0.24em] text-[var(--study-kicker)]">
          {showIndex ? String(index + 1).padStart(2, '0') : null}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-start gap-3">
            <span
              className="mt-1 inline-flex size-3 shrink-0 rounded-full"
              style={{ backgroundColor: derivedCourseColor }}
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
                <p className="text-lg font-semibold text-[var(--study-ink-strong)]">
                  {task.title}
                </p>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.72rem] ${getPriorityTone(
                    task.priority
                  )}`}
                >
                  <Flag className="size-3.5" />
                  {capitalizeFirst(
                    task.priority ? task.priority.toLowerCase() : 'none'
                  )}
                </span>
              </div>

              {task.description?.trim() ? (
                <p className="mt-2 text-sm leading-6 text-[var(--study-copy-muted)]">
                  {task.description}
                </p>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--study-copy-muted)]">
                {showCourseChip && course ? (
                  <Link
                    to="/courses/$courseId"
                    params={{ courseId: String(course.id) }}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--study-line)] bg-[var(--study-surface-soft)] px-2.5 py-1 hover:opacity-80"
                  >
                    <span
                      className="inline-flex size-2 rounded-full"
                      style={{ backgroundColor: derivedCourseColor }}
                    />
                    {course.name}
                  </Link>
                ) : null}

                {task.deadline ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--study-line)] bg-[var(--study-surface-soft)] px-2.5 py-1">
                    <AlarmClock className="size-3.5" />
                    {formatDeadline(task.deadline)}
                  </span>
                ) : null}

                {formatHours(task.estimatedHours) ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--study-line)] bg-[var(--study-surface-soft)] px-2.5 py-1">
                    <Timer className="size-3.5" />
                    {formatHours(task.estimatedHours)}
                  </span>
                ) : null}

                {task.status ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className={`group inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 transition-all hover:-translate-y-px hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--study-focus)] disabled:cursor-not-allowed disabled:opacity-60 ${statusTone(
                          task.status
                        )}`}
                        disabled={Boolean(isUpdatingStatus) || !onUpdateStatus}
                        title="Change status"
                      >
                        <span className="inline-flex size-1.5 rounded-full bg-current/70" />
                        <span className="font-medium">
                          {statusLabelTitle(task.status)}
                        </span>
                        <ChevronDown className="ml-0.5 size-3.5 opacity-70 transition-opacity group-hover:opacity-100" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {(
                        ['pending', 'in_progress', 'completed'] as const
                      ).map((status) => (
                        <DropdownMenuItem
                          key={status}
                          onClick={() => onUpdateStatus?.(task, status)}
                        >
                          {capitalizeFirst(status.replace('_', ' '))}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

