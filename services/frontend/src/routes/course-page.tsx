import { useState, type CSSProperties, type FormEvent } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { BookOpenText, ClipboardList, Dot, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  deleteCourse as deleteCourseRequest,
  listCourses
} from '@/lib/courses-api';
import { createTask, deleteTask as deleteTaskRequest } from '@/lib/tasks-api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

type DeleteTarget =
  | { type: 'course'; label: string }
  | { type: 'task'; taskId: number; label: string }
  | null;

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

  const [taskTitle, setTaskTitle] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  const courses = coursesQuery.data?.courses ?? [];
  const course = courses.find((item) => item.id === courseId) ?? null;

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
      title: taskTitle.trim()
    });
    setTaskTitle('');
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
                <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--study-copy)]">
                  Build this course into a real study sequence. Add readings,
                  assignments, and revision blocks here so the subject becomes a
                  visible line of work instead of a vague obligation in the
                  background.
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
            className="motion-enter mt-8 space-y-4"
            style={createMotionStyle(260)}
          >
            <Input
              value={taskTitle}
              onChange={(event) => setTaskTitle(event.target.value)}
              placeholder="Task title"
              className="h-12 rounded-none border-0 border-b border-[var(--study-line-strong)] bg-transparent px-0 focus-visible:border-[var(--study-focus)] focus-visible:ring-0"
            />
            <Button
              type="submit"
              size="lg"
              className="rounded-full px-5"
              style={{
                backgroundColor: getCourseColor(course.color),
                color: 'white'
              }}
            >
              <Plus className="size-4" />
              Add task
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
                  className="motion-enter motion-task-row grid gap-4 py-5 md:grid-cols-[0.08fr_0.92fr]"
                  style={createMotionStyle(440 + index * 70)}
                >
                  <div className="flex items-start justify-start text-[0.7rem] font-medium uppercase tracking-[0.24em] text-[var(--study-kicker)]">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-start gap-3">
                      <Dot
                        className="mt-0.5 size-5 shrink-0"
                        style={{ color: getCourseColor(course.color) }}
                      />
                      <div className="min-w-0">
                        <p className="text-lg font-semibold text-[var(--study-ink-strong)]">
                          {task.title}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[var(--study-copy-muted)]">
                          Planned inside {course.name}
                        </p>
                      </div>
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
