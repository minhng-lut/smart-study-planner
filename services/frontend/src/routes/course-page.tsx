import { useState, type CSSProperties, type FormEvent } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import {
  AlarmClock,
  BookOpenText,
  ClipboardList,
  Flag,
  Plus,
  Timer,
  Trash2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  deleteCourse as deleteCourseRequest,
  listCourses
} from '@/lib/courses-api';
import {
  createTask,
  deleteTask as deleteTaskRequest,
  updateTask
} from '@/lib/tasks-api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TaskCard } from '@/components/task-card';

type DeleteTarget =
  | { type: 'course'; label: string }
  | { type: 'task'; taskId: number; label: string }
  | null;

type TaskPriorityOption = 'low' | 'medium' | 'high' | '';

function CoursePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({
    select: (state) => state.location.pathname
  });

  const courseId = Number(pathname.split('/')[2] ?? '0');
  const coursesQuery = useQuery({
    queryKey: ['courses'],
    queryFn: listCourses
  });

  const createTaskMutation = useMutation({
    mutationFn: createTask,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['courses'] });
    }
  });

  const deleteCourseMutation = useMutation({
    mutationFn: deleteCourseRequest,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['courses'] });
      await navigate({ to: '/' });
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTaskRequest,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['courses'] });
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({
      taskId,
      status
    }: {
      taskId: number;
      status: 'pending' | 'in_progress' | 'completed' | 'overdue';
    }) => updateTask(taskId, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['courses'] });
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [taskEstimatedHours, setTaskEstimatedHours] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriorityOption>('');
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  const courses = coursesQuery.data?.courses ?? [];
  const course = courses.find((item) => item.id === courseId) ?? null;

  function toOptionalNumber(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
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

  function createMotionStyle(delay: number): CSSProperties {
    return {
      '--motion-delay': `${delay}ms`
    } as CSSProperties;
  }

  async function handleCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!course || !taskTitle.trim()) {
      return;
    }

    await createTaskMutation.mutateAsync({
      courseId: course.id,
      title: taskTitle.trim(),
      ...(taskDescription.trim()
        ? { description: taskDescription.trim() }
        : {}),
      ...(taskDeadline ? { deadline: taskDeadline } : {}),
      ...(toOptionalNumber(taskEstimatedHours) !== undefined
        ? { estimatedHours: toOptionalNumber(taskEstimatedHours) }
        : {}),
      ...(taskPriority ? { priority: taskPriority } : {})
    });
    setTaskTitle('');
    setTaskDescription('');
    setTaskDeadline('');
    setTaskEstimatedHours('');
    setTaskPriority('');
  }

  async function handleConfirmDelete() {
    if (!course) {
      return;
    }

    if (!deleteTarget) {
      return;
    }

    if (deleteTarget.type === 'course') {
      await deleteCourseMutation.mutateAsync(course.id);
      setDeleteTarget(null);
      return;
    }

    await deleteTaskMutation.mutateAsync(deleteTarget.taskId);
    setDeleteTarget(null);
  }

  function getCourseColor(color: string | null) {
    return color ?? '#4f46e5';
  }

  if (!course) {
    return (
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="border-b border-[var(--study-line)] pb-8">
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.28em] text-[var(--study-kicker)]">
            Course
          </p>
          <h1 className="font-display mt-4 text-4xl tracking-[-0.05em] text-[var(--study-ink)]">
            Course not found
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--study-copy)]">
            This course page does not exist in the local planner state anymore.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-10">
      <div className="grid gap-10 border-b border-[var(--study-line)] pb-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div
          className="motion-enter motion-enter-strong relative"
          style={createMotionStyle(0)}
        >
          <div
            className="motion-orb absolute -left-8 top-0 h-28 w-28 rounded-full blur-3xl"
            style={{ backgroundColor: `${getCourseColor(course.color)}2f` }}
          />
          <div className="relative">
            <div
              className="motion-enter inline-flex items-center gap-2 border-b border-[var(--study-line)] pb-2 text-[0.7rem] font-medium uppercase tracking-[0.28em] text-[var(--study-kicker)]"
              style={createMotionStyle(80)}
            >
              <BookOpenText
                className="size-4"
                style={{ color: getCourseColor(course.color) }}
              />
              Course workspace
            </div>

            <div
              className="motion-enter mt-6 flex items-start gap-4"
              style={createMotionStyle(160)}
            >
              <span
                className="mt-3 inline-flex size-4 shrink-0 rounded-full"
                style={{ backgroundColor: getCourseColor(course.color) }}
              />
              <div>
                <h1 className="font-display text-[clamp(2.8rem,5.6vw,5.5rem)] leading-[0.94] tracking-[-0.06em] text-[var(--study-ink)]">
                  {course.name}
                </h1>
                {course.code ? (
                  <p className="mt-4 text-sm font-medium tracking-wide text-[var(--study-copy-muted)]">
                    {course.code}
                  </p>
                ) : null}
                <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--study-copy)]">
                  {course.description?.trim()
                    ? course.description
                    : 'Build this course into a real study sequence. Add readings, assignments, and revision blocks here so the subject becomes a visible line of work instead of a vague obligation in the background.'}
                </p>
              </div>
            </div>

            <div
              className="motion-enter mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-[var(--study-copy-muted)]"
              style={createMotionStyle(240)}
            >
              <div className="inline-flex items-center gap-2">
                <ClipboardList className="size-4" />
                {course.tasks.length} task{course.tasks.length === 1 ? '' : 's'}
              </div>
              <button
                type="button"
                onClick={() =>
                  setDeleteTarget({
                    type: 'course',
                    label: course.name
                  })
                }
                className="inline-flex items-center gap-2 text-sm text-destructive transition-colors hover:text-destructive/80"
              >
                <Trash2 className="size-4" />
                Delete course
              </button>
            </div>
          </div>
        </div>

        <div
          className="motion-enter lg:border-l lg:border-[var(--study-line)] lg:pl-8"
          style={createMotionStyle(140)}
        >
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.28em] text-[var(--study-kicker)]">
            Add task
          </p>
          <h2 className="font-display mt-4 text-[clamp(2rem,4vw,3.4rem)] leading-[0.96] tracking-[-0.05em] text-[var(--study-ink)]">
            Shape the next study block.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--study-copy-muted)]">
            Add one concrete task at a time so this course builds momentum
            through small, visible steps.
          </p>

          <form
            onSubmit={handleCreateTask}
            className="motion-enter mt-8 space-y-5"
            style={createMotionStyle(260)}
          >
            <div className="space-y-2">
              <label className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-[var(--study-kicker)]">
                Title
              </label>
              <Input
                value={taskTitle}
                onChange={(event) => setTaskTitle(event.target.value)}
                placeholder="Read chapter 3 and take notes"
                className="h-12 rounded-xl border border-[var(--study-line-strong)] bg-transparent"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-[var(--study-kicker)]">
                Details
              </label>
              <Textarea
                value={taskDescription}
                onChange={(event) => setTaskDescription(event.target.value)}
                placeholder="Optional notes, links, acceptance criteria..."
                className="min-h-[7.5rem] rounded-xl border border-[var(--study-line)] bg-transparent"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <label className="inline-flex items-center gap-2 text-[0.68rem] font-medium uppercase tracking-[0.24em] text-[var(--study-kicker)]">
                  <AlarmClock className="size-3.5" />
                  Deadline
                </label>
                <Input
                  type="datetime-local"
                  value={taskDeadline}
                  onChange={(event) => setTaskDeadline(event.target.value)}
                  className="h-12 rounded-xl border border-[var(--study-line)] bg-transparent"
                />
              </div>
              <div className="space-y-2">
                <label className="inline-flex items-center gap-2 text-[0.68rem] font-medium uppercase tracking-[0.24em] text-[var(--study-kicker)]">
                  <Timer className="size-3.5" />
                  Est. hours
                </label>
                <Input
                  type="number"
                  min={0}
                  step={0.25}
                  value={taskEstimatedHours}
                  onChange={(event) =>
                    setTaskEstimatedHours(event.target.value)
                  }
                  placeholder="2"
                  className="h-12 rounded-xl border border-[var(--study-line)] bg-transparent"
                />
              </div>
              <div className="space-y-2">
                <label className="inline-flex items-center gap-2 text-[0.68rem] font-medium uppercase tracking-[0.24em] text-[var(--study-kicker)]">
                  <Flag className="size-3.5" />
                  Priority
                </label>
                <select
                  value={taskPriority}
                  onChange={(event) =>
                    setTaskPriority(event.target.value as TaskPriorityOption)
                  }
                  className="h-12 w-full rounded-xl border border-[var(--study-line)] bg-transparent px-3 text-sm text-[var(--study-ink)]"
                >
                  <option value="">None</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--study-line)] bg-[var(--study-surface-soft)] px-4 py-3 text-xs text-[var(--study-copy-muted)]">
              <div className="min-w-0">
                <p className="truncate">
                  {taskTitle.trim() ? (
                    <>
                      Creating:{' '}
                      <span className="font-medium text-[var(--study-ink)]">
                        {taskTitle.trim()}
                      </span>
                    </>
                  ) : (
                    'Fill in a title to create a task.'
                  )}
                </p>
              </div>
              <div className="shrink-0">
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 ${getPriorityTone(
                    taskPriority || null
                  )}`}
                >
                  <Flag className="size-3.5" />
                  {taskPriority ? taskPriority.toUpperCase() : 'NO PRIORITY'}
                </span>
              </div>
            </div>
            <Button
              type="submit"
              size="lg"
              className="rounded-full px-5"
              disabled={createTaskMutation.isPending || !taskTitle.trim()}
              style={{
                backgroundColor: getCourseColor(course.color),
                color: 'white'
              }}
            >
              <Plus className="size-4" />
              {createTaskMutation.isPending ? 'Adding…' : 'Add task'}
            </Button>
          </form>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[0.28fr_0.72fr]">
        <div className="motion-enter" style={createMotionStyle(320)}>
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.28em] text-[var(--study-kicker)]">
            Task list
          </p>
          <p className="mt-4 max-w-xs text-sm leading-7 text-[var(--study-copy-muted)]">
            Keep the list clean and readable so you can see what belongs to this
            course at a glance.
          </p>
        </div>

        <div
          className="motion-enter border-t border-[var(--study-line)]"
          style={createMotionStyle(380)}
        >
          {course.tasks.length > 0 ? (
            <div className="divide-y divide-[var(--study-line)]">
              {course.tasks.map((task, index) => (
                <div
                  key={task.id}
                  className="motion-enter py-5"
                  style={createMotionStyle(440 + index * 70)}
                >
                  <div className="flex items-start gap-3">
                    <TaskCard
                      task={task}
                      index={index}
                      courseColor={getCourseColor(course.color)}
                      variant="row"
                      showCourseChip={false}
                      isUpdatingStatus={updateTaskMutation.isPending}
                      onUpdateStatus={(t, status) =>
                        updateTaskMutation.mutate({
                          taskId: t.id,
                          status
                        })
                      }
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setDeleteTarget({
                          type: 'task',
                          taskId: task.id,
                          label: task.title
                        })
                      }
                      className="ml-auto inline-flex size-9 shrink-0 items-center justify-center rounded-full text-destructive transition-colors hover:bg-destructive/10 hover:text-destructive/80"
                      aria-label={`Delete ${task.title}`}
                      title={`Delete ${task.title}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-sm leading-7 text-[var(--study-copy-muted)]">
              No tasks yet. Add the first task above to start structuring this
              course.
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {deleteTarget?.type === 'course'
                ? 'Delete course?'
                : 'Delete task?'}
            </DialogTitle>
            <DialogDescription>
              {deleteTarget?.type === 'course'
                ? `This will remove "${course.name}" and all tasks inside it.`
                : `This will remove "${deleteTarget?.label}" from ${course.name}.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="bg-background border-none">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleConfirmDelete()}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export default CoursePage;
