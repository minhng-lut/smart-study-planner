import type { CSSProperties, ReactNode } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Brain,
  CalendarClock,
  Gauge,
  LoaderCircle,
  Play,
  Sparkles,
  Target
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  createAnalysis,
  listAnalyses,
  type AnalysisResult,
  type OverdueTaskAnalysis,
  type RiskLevel,
  type StudyDistributionItem,
  type TaskPriorityAnalysis,
  type TaskRiskAnalysis
} from '@/lib/analysis-api';
import { getApiErrorMessage } from '@/lib/get-api-error-message';

const riskLabels: Record<RiskLevel, string> = {
  none: 'Clear',
  low: 'Low',
  medium: 'Medium',
  high: 'High'
};

const riskClassNames: Record<RiskLevel, string> = {
  none: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  low: 'bg-sky-50 text-sky-700 ring-sky-200',
  medium: 'bg-amber-50 text-amber-800 ring-amber-200',
  high: 'bg-rose-50 text-rose-700 ring-rose-200'
};

function createMotionStyle(delay: number): CSSProperties {
  return {
    '--motion-delay': `${delay}ms`
  } as CSSProperties;
}

function formatGeneratedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Latest run';
  }

  return new Intl.DateTimeFormat('en-FI', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function formatDeadline(value: string | null) {
  if (!value) {
    return 'No deadline';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'No deadline';
  }

  return new Intl.DateTimeFormat('en-FI', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function formatPlanDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-FI', {
    weekday: 'short',
    day: '2-digit',
    month: 'short'
  }).format(date);
}

function formatStatus(value: string) {
  return value.replaceAll('_', ' ').toLowerCase();
}

function getDistributionByDate(distribution: StudyDistributionItem[]) {
  return distribution.reduce<Record<string, StudyDistributionItem[]>>(
    (groups, item) => {
      groups[item.date] = [...(groups[item.date] ?? []), item];

      return groups;
    },
    {}
  );
}

function AnalysisSkeleton() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-10">
      <div className="border-b border-[var(--study-line)] pb-10">
        <div className="motion-enter h-3 w-32 rounded-full bg-[var(--study-surface-soft)]" />
        <div className="motion-enter mt-5 h-20 max-w-3xl rounded-3xl bg-[var(--study-surface-soft)]" />
        <div className="motion-enter mt-5 h-4 max-w-xl rounded-full bg-[var(--study-surface-soft)]" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[0.38fr_0.62fr]">
        <div className="motion-enter h-96 rounded-[2rem] bg-[var(--study-surface-soft)]" />
        <div className="space-y-5">
          <div className="motion-enter h-44 rounded-[2rem] bg-[var(--study-surface-soft)]" />
          <div className="motion-enter h-64 rounded-[2rem] bg-[var(--study-surface-soft)]" />
        </div>
      </div>
    </section>
  );
}

function EmptyAnalysisState({
  isGenerating,
  onGenerate
}: {
  isGenerating: boolean;
  onGenerate: () => void;
}) {
  return (
    <div className="motion-enter rounded-[2rem] border border-[var(--study-line)] bg-[var(--study-surface-soft)] px-6 py-8">
      <div className="flex max-w-2xl flex-col gap-5">
        <div className="flex size-12 items-center justify-center rounded-full bg-white text-[var(--study-focus)] shadow-sm">
          <Sparkles className="size-5" />
        </div>
        <div>
          <h2 className="font-display text-3xl leading-none tracking-[-0.06em] text-[var(--study-ink)]">
            Run your first study analysis.
          </h2>
          <p className="mt-3 text-sm leading-7 text-[var(--study-copy)]">
            The planner will score task urgency, flag risk, and spread your
            unfinished workload across the next study days.
          </p>
        </div>
        <Button
          type="button"
          className="w-fit rounded-full px-5"
          onClick={onGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Play className="size-4" />
          )}
          {isGenerating ? 'Analyzing...' : 'Run analysis'}
        </Button>
      </div>
    </div>
  );
}

function ExplanationNote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-2 max-w-xl text-xs leading-6 text-[var(--study-copy-muted)]">
      {children}
    </p>
  );
}

function MetricStrip({ analysis }: { analysis: AnalysisResult }) {
  const summary = analysis.workloadSummary;

  return (
    <div className="rounded-[2rem] border border-[var(--study-line)] bg-[var(--study-popover-surface)] p-5 shadow-[0_28px_80px_-58px_rgba(87,65,35,0.45)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[var(--study-kicker)]">
            Latest report
          </p>
          <p className="mt-2 font-display text-3xl leading-none tracking-[-0.08em] text-[var(--study-ink)]">
            {formatGeneratedAt(analysis.generatedAt)}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${riskClassNames[analysis.riskLevel]}`}
        >
          {riskLabels[analysis.riskLevel]}
        </span>
      </div>

      <div className="mt-6 border-t border-[var(--study-line)] pt-5">
        <p className="flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-[var(--study-kicker)]">
          <Gauge className="size-4 text-[var(--study-focus)]" />
          Workload pressure
        </p>
        <div className="mt-3 flex items-end gap-2">
          <p className="font-display text-[clamp(4.5rem,9vw,6.5rem)] leading-[0.78] tracking-[-0.09em] text-[var(--study-ink)]">
            {Math.round(analysis.workloadScore)}
          </p>
          <span className="pb-2 text-sm font-semibold text-[var(--study-copy-muted)]">
            /100
          </span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--study-line-soft)]">
          <div
            className="h-full rounded-full bg-[var(--study-focus)]"
            style={{
              width: `${Math.min(Math.max(analysis.workloadScore, 0), 100)}%`
            }}
          />
        </div>
        <ExplanationNote>
          Overall pressure from upcoming unfinished tasks. Higher means your
          remaining hours are packed into less available time.
        </ExplanationNote>
      </div>

      <div className="mt-6 grid gap-3">
        <div className="rounded-[1.2rem] border border-[var(--study-line)] bg-white/55 px-4 py-3">
          <p className="flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[var(--study-kicker)]">
            <Activity className="size-4 text-[var(--study-focus)]" />
            Risk level
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--study-copy)]">
            Highest pressure level detected in this analysis.
          </p>
        </div>

        <div className="rounded-[1.2rem] border border-[var(--study-line)] bg-white/55 px-4 py-3">
          <p className="flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[var(--study-kicker)]">
            <CalendarClock className="size-4 text-[var(--study-focus)]" />
            Study per day
          </p>
          <p className="mt-2 font-display text-4xl leading-none tracking-[-0.08em] text-[var(--study-ink)]">
            {analysis.recommendedHoursPerDay.toFixed(1)}
            <span className="ml-1 text-sm font-sans tracking-normal text-[var(--study-copy-muted)]">
              h
            </span>
          </p>
          <p className="mt-2 text-xs leading-5 text-[var(--study-copy-muted)]">
            {summary.totalRemainingHours.toFixed(1)}h upcoming work across{' '}
            {summary.planningDays} day{summary.planningDays === 1 ? '' : 's'}.
          </p>
        </div>
      </div>
    </div>
  );
}

function PriorityList({ tasks }: { tasks: TaskPriorityAnalysis[] }) {
  const maxScore = Math.max(...tasks.map((task) => task.priorityScore), 1);

  return (
    <div className="space-y-4">
      {tasks.slice(0, 6).map((task, index) => {
        const width = `${Math.max((task.priorityScore / maxScore) * 100, 8)}%`;

        return (
          <div
            key={task.taskId}
            className="motion-task-row grid gap-3 border-t border-[var(--study-line)] py-4 md:grid-cols-[2rem_minmax(0,1fr)_5rem]"
            style={createMotionStyle(260 + index * 60)}
          >
            <p className="font-display text-2xl leading-none tracking-[-0.08em] text-[var(--study-ink)]">
              {String(index + 1).padStart(2, '0')}
            </p>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[var(--study-focus)]" />
                <p className="truncate text-base font-semibold text-[var(--study-ink-strong)]">
                  {task.title}
                </p>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--study-line-soft)]">
                <div
                  className="h-full rounded-full bg-[var(--study-focus)]"
                  style={{ width }}
                />
              </div>
              <p className="mt-2 text-xs text-[var(--study-copy-muted)]">
                {task.remainingHours.toFixed(1)}h left ·{' '}
                {task.daysLeft === null
                  ? 'no deadline'
                  : `${task.daysLeft} day${task.daysLeft === 1 ? '' : 's'} left`}{' '}
                · {formatStatus(task.status)}
              </p>
            </div>
            <div className="text-left md:text-right">
              <p className="font-display text-3xl leading-none tracking-[-0.08em] text-[var(--study-ink)]">
                {Math.round(task.priorityScore)}
              </p>
              <p className="mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-[var(--study-kicker)]">
                Priority score
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RiskList({ tasks }: { tasks: TaskRiskAnalysis[] }) {
  return (
    <div className="divide-y divide-[var(--study-line)]">
      {tasks.slice(0, 6).map((task) => (
        <div
          key={task.taskId}
          className="flex items-start justify-between gap-4 py-4"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--study-ink-strong)]">
              {task.title}
            </p>
            <p className="mt-1 text-xs text-[var(--study-copy-muted)]">
              {formatDeadline(task.deadline)} · {task.remainingHours.toFixed(1)}
              h left
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${riskClassNames[task.riskLevel]}`}
          >
            {riskLabels[task.riskLevel]}
          </span>
        </div>
      ))}
    </div>
  );
}

function OverdueList({ tasks }: { tasks: OverdueTaskAnalysis[] }) {
  if (tasks.length === 0) {
    return (
      <p className="border-l border-[var(--study-line)] py-2 pl-4 text-sm leading-7 text-[var(--study-copy-muted)]">
        No unfinished tasks are past their deadline.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.6rem] border border-rose-200 bg-rose-50/75 shadow-[0_24px_70px_-48px_rgba(190,18,60,0.6)]">
      <div className="flex items-start gap-3 border-b border-rose-200 bg-rose-100/70 px-4 py-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-rose-700" />
        <div>
          <p className="text-[0.66rem] font-bold uppercase tracking-[0.22em] text-rose-800">
            Recovery required
          </p>
          <p className="mt-1 text-xs leading-5 text-rose-700">
            These tasks are past their deadline and are excluded from automatic
            study distribution until you reschedule or complete them.
          </p>
        </div>
      </div>
      {tasks.map((task) => (
        <div
          key={task.taskId}
          className="grid gap-3 border-b border-rose-200/80 px-4 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_8rem]"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex size-2.5 rounded-full bg-rose-600 ring-4 ring-rose-200" />
              <p className="truncate text-sm font-semibold text-rose-950">
                {task.title}
              </p>
            </div>
            <p className="mt-1 text-xs text-rose-700">
              Due {formatDeadline(task.deadline)} ·{' '}
              {task.remainingHours.toFixed(1)}h unfinished
            </p>
          </div>
          <div className="flex items-center justify-between gap-3 sm:block sm:text-right">
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-rose-700 sm:hidden">
              Overdue
            </span>
            <p className="font-display text-4xl leading-none tracking-[-0.08em] text-rose-800">
              {task.daysOverdue}
              <span className="ml-1 text-xs font-sans font-semibold uppercase tracking-[0.14em] text-rose-700">
                day{task.daysOverdue === 1 ? '' : 's'}
              </span>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function StudyDistribution({
  distribution,
  priorities
}: {
  distribution: StudyDistributionItem[];
  priorities: TaskPriorityAnalysis[];
}) {
  const taskTitles = priorities.reduce<Record<number, string>>((map, task) => {
    map[task.taskId] = task.title;

    return map;
  }, {});
  const grouped = getDistributionByDate(distribution);
  const dates = Object.keys(grouped)
    .sort((left, right) => left.localeCompare(right))
    .slice(0, 7);

  if (dates.length === 0) {
    return (
      <p className="border-l border-[var(--study-line)] py-2 pl-4 text-sm leading-7 text-[var(--study-copy-muted)]">
        No study blocks are needed yet. Add unfinished tasks with deadlines to
        generate a distribution.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {dates.map((date, index) => {
        const items = grouped[date] ?? [];
        const totalHours = items.reduce((sum, item) => sum + item.hours, 0);
        const primaryItem = items[0];

        return (
          <div
            key={date}
            className="motion-enter grid gap-4 rounded-[1.65rem] border border-[var(--study-line)] bg-[var(--study-popover-surface)] p-4 shadow-[0_22px_70px_-58px_rgba(87,65,35,0.45)] md:grid-cols-[10rem_minmax(0,1fr)]"
            style={createMotionStyle(320 + index * 70)}
          >
            <div className="flex items-start justify-between gap-4 md:block">
              <div>
                <p className="inline-flex items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-[var(--study-kicker)]">
                  <CalendarClock className="size-4 text-[var(--study-focus)]" />
                  Day {primaryItem?.day ?? index + 1}
                </p>
                <p className="mt-2 text-base font-semibold text-[var(--study-ink-strong)]">
                  {formatPlanDate(date)}
                </p>
              </div>
              <div className="shrink-0 text-right md:mt-8 md:text-left">
                <p className="font-display text-5xl leading-none tracking-[-0.08em] text-[var(--study-ink)]">
                  {totalHours.toFixed(1)}
                  <span className="ml-1 text-sm font-sans tracking-normal text-[var(--study-copy-muted)]">
                    h
                  </span>
                </p>
                <p className="mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-[var(--study-kicker)]">
                  Total
                </p>
              </div>
            </div>

            <div className="min-w-0 space-y-2">
              {items.map((item) => {
                const share =
                  totalHours > 0
                    ? Math.max((item.hours / totalHours) * 100, 8)
                    : 8;

                return (
                  <div
                    key={`${item.date}-${item.taskId}`}
                    className="group/study-block rounded-[1.2rem] border border-[var(--study-line)] bg-white/55 px-4 py-3 transition-colors hover:border-[var(--study-focus-soft)] hover:bg-[var(--study-surface-soft)]"
                  >
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_5rem] sm:items-center">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--study-ink-strong)] transition-colors group-hover/study-block:text-[var(--study-focus)]">
                          {taskTitles[item.taskId] ?? `Task ${item.taskId}`}
                        </p>
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--study-line-soft)]">
                          <div
                            className="h-full rounded-full bg-[var(--study-focus)]"
                            style={{ width: `${share}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3 sm:block sm:text-right">
                        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[var(--study-kicker)] sm:hidden">
                          Time
                        </span>
                        <p className="font-display text-3xl leading-none tracking-[-0.08em] text-[var(--study-ink)]">
                          {item.hours.toFixed(1)}
                          <span className="ml-1 text-xs font-sans tracking-normal text-[var(--study-copy-muted)]">
                            h
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AnalyticsPage() {
  const queryClient = useQueryClient();
  const analysesQuery = useQuery({
    queryKey: ['analysis'],
    queryFn: listAnalyses
  });
  const analyses = analysesQuery.data?.analyses ?? [];
  const latestAnalysis = analyses[0];
  const activeRiskTasks =
    latestAnalysis?.taskRiskLevels.filter(
      (task) =>
        !latestAnalysis.overdueTasks.some(
          (overdueTask) => overdueTask.taskId === task.taskId
        )
    ) ?? [];

  const createAnalysisMutation = useMutation({
    mutationFn: createAnalysis,
    onSuccess: ({ analysis }) => {
      queryClient.setQueryData<Awaited<ReturnType<typeof listAnalyses>>>(
        ['analysis'],
        (current) => ({
          analyses: [
            analysis,
            ...(current?.analyses.filter((item) => item.id !== analysis.id) ??
              [])
          ]
        })
      );
      toast.success('Analysis updated');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Unable to run analysis'));
    }
  });

  function handleRunAnalysis() {
    createAnalysisMutation.mutate({});
  }

  if (analysesQuery.isPending) {
    return <AnalysisSkeleton />;
  }

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-10">
      <div className="border-b border-[var(--study-line)] pb-10">
        <p
          className="motion-enter text-[0.7rem] font-medium uppercase tracking-[0.28em] text-[var(--study-kicker)]"
          style={createMotionStyle(0)}
        >
          Analytics
        </p>
        <div
          className="motion-enter mt-5 flex flex-col justify-between gap-6 md:flex-row md:items-end"
          style={createMotionStyle(80)}
        >
          <div>
            <h1 className="font-display text-[clamp(2.7rem,5vw,5rem)] leading-[0.92] tracking-[-0.07em] text-[var(--study-ink)]">
              Pressure, priorities, and the next study moves.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--study-copy)]">
              Run the rule-based analysis whenever tasks change. The report
              stays practical: what is urgent, what is risky, and how to spread
              the remaining hours.
            </p>
          </div>
          <Button
            type="button"
            className="w-fit rounded-full px-5"
            onClick={handleRunAnalysis}
            disabled={createAnalysisMutation.isPending}
          >
            {createAnalysisMutation.isPending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Brain className="size-4" />
            )}
            {createAnalysisMutation.isPending ? 'Analyzing...' : 'Run analysis'}
          </Button>
        </div>
      </div>

      {latestAnalysis ? (
        <>
          <div className="grid gap-8 lg:grid-cols-[0.36fr_0.64fr]">
            <aside
              className="motion-enter space-y-8"
              style={createMotionStyle(160)}
            >
              <MetricStrip analysis={latestAnalysis} />
            </aside>

            <div
              className="motion-enter space-y-10"
              style={createMotionStyle(220)}
            >
              <section className="rounded-[1.9rem] border border-rose-200/80 bg-rose-50/35 p-4">
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.24em] text-rose-700">
                      <AlertTriangle className="size-4" />
                      Overdue
                    </p>
                    <h2 className="mt-2 font-display text-3xl leading-none tracking-[-0.06em] text-rose-950">
                      Past-deadline work to recover manually.
                    </h2>
                    <ExplanationNote>
                      These tasks are already late. They are not used for the
                      automatic study plan because they need a new deadline or a
                      completion update first.
                    </ExplanationNote>
                  </div>
                </div>
                <OverdueList tasks={latestAnalysis.overdueTasks} />
              </section>

              <section className="border-t border-[var(--study-line)] pt-8">
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[var(--study-kicker)]">
                      <Target className="size-4 text-[var(--study-focus)]" />
                      Priority queue
                    </p>
                    <h2 className="mt-2 font-display text-3xl leading-none tracking-[-0.06em] text-[var(--study-ink)]">
                      Upcoming work to start first.
                    </h2>
                    <ExplanationNote>
                      Priority score is a 0-100 urgency score for upcoming
                      unfinished tasks. It combines deadline pressure, remaining
                      hours, and current status.
                    </ExplanationNote>
                  </div>
                </div>
                {latestAnalysis.taskPriorities.length > 0 ? (
                  <PriorityList tasks={latestAnalysis.taskPriorities} />
                ) : (
                  <p className="border-l border-[var(--study-line)] py-2 pl-4 text-sm leading-7 text-[var(--study-copy-muted)]">
                    No upcoming active tasks are currently affecting priority.
                  </p>
                )}
              </section>

              <section className="border-t border-[var(--study-line)] pt-8">
                <div className="mb-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[var(--study-kicker)]">
                      Study distribution
                    </p>
                    <h2 className="mt-2 font-display text-3xl leading-none tracking-[-0.06em] text-[var(--study-ink)]">
                      A paced plan for upcoming days.
                    </h2>
                    <ExplanationNote>
                      These hours are suggested study allocations. Day totals
                      show how much to study that day; each row shows how to
                      split that time by task.
                    </ExplanationNote>
                  </div>
                </div>
                <StudyDistribution
                  distribution={latestAnalysis.recommendedStudyDistribution}
                  priorities={latestAnalysis.taskPriorities}
                />
              </section>
            </div>
          </div>

          <section className="grid gap-8 border-t border-[var(--study-line)] pt-8 lg:grid-cols-[0.35fr_0.65fr]">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[var(--study-kicker)]">
                Risk ledger
              </p>
              <h2 className="mt-2 font-display text-3xl leading-none tracking-[-0.06em] text-[var(--study-ink)]">
                Tasks that may slip.
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--study-copy)]">
                Overdue work is separated above. This ledger tracks the risk
                level of the remaining active and completed tasks.
              </p>
              <ExplanationNote>
                Risk is rule-based: completed tasks are clear, close deadlines
                with high remaining hours are riskier.
              </ExplanationNote>
            </div>
            <RiskList tasks={activeRiskTasks} />
          </section>
        </>
      ) : (
        <EmptyAnalysisState
          isGenerating={createAnalysisMutation.isPending}
          onGenerate={handleRunAnalysis}
        />
      )}

      {analysesQuery.isError ? (
        <div className="rounded-2xl border border-[var(--study-error-border)] bg-[var(--study-error-surface)] px-4 py-3 text-sm text-[var(--study-error-text)]">
          {getApiErrorMessage(analysesQuery.error, 'Unable to load analysis')}
        </div>
      ) : null}

      <div className="border-t border-[var(--study-line)] pt-6">
        <Button asChild variant="ghost" className="rounded-full px-0">
          <Link to="/">
            Back to dashboard
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

export default AnalyticsPage;
