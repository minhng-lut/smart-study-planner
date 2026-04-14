import type { CSSProperties } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { TaskCard } from '@/components/task-card';
import { listCourses } from '@/lib/courses-api';
import { listTasks, updateTask } from '@/lib/tasks-api';

function TasksPage() {
  const queryClient = useQueryClient();
  const tasksQuery = useQuery({
    queryKey: ['tasks'],
    queryFn: () => listTasks()
  });

  const coursesQuery = useQuery({
    queryKey: ['courses'],
    queryFn: listCourses
  });

  const tasks = tasksQuery.data?.tasks ?? [];
  const courses = coursesQuery.data?.courses ?? [];

  const courseById = new Map(courses.map((course) => [course.id, course]));

  const updateTaskMutation = useMutation({
    mutationFn: ({
      taskId,
      status
    }: {
      taskId: number;
      status: 'pending' | 'in_progress' | 'completed' | 'overdue';
    }) => updateTask(taskId, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['courses'] });
    }
  });

  function createMotionStyle(delay: number): CSSProperties {
    return {
      '--motion-delay': `${delay}ms`
    } as CSSProperties;
  }

  const sortedTasks = [...tasks].sort((a, b) => {
    const aDeadline = a.deadline
      ? new Date(a.deadline).getTime()
      : Number.POSITIVE_INFINITY;
    const bDeadline = b.deadline
      ? new Date(b.deadline).getTime()
      : Number.POSITIVE_INFINITY;
    if (aDeadline !== bDeadline) return aDeadline - bDeadline;
    return b.createdAt.localeCompare(a.createdAt);
  });

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-10">
      <div className="border-b border-[var(--study-line)] pb-10">
        <p
          className="motion-enter text-[0.7rem] font-medium uppercase tracking-[0.28em] text-[var(--study-kicker)]"
          style={createMotionStyle(0)}
        >
          Tasks
        </p>
        <div
          className="motion-enter mt-5 flex flex-wrap items-end justify-between gap-6"
          style={createMotionStyle(90)}
        >
          <div className="motion-enter" style={createMotionStyle(160)}>
            <h1 className="font-display text-[clamp(2.6rem,5vw,4.8rem)] leading-[0.95] tracking-[-0.06em] text-[var(--study-ink)]">
              Everything you need to do.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--study-copy)]">
              Scan tasks across all courses. Tasks with deadlines float to the
              top so you can spot what’s coming up next.
            </p>
          </div>
          <div
            className="motion-enter rounded-full border border-[var(--study-line)] bg-white/60 px-4 py-2 text-sm text-[var(--study-copy-muted)]"
            style={createMotionStyle(220)}
          >
            {sortedTasks.length} task{sortedTasks.length === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      <div className="motion-enter" style={createMotionStyle(300)}>
        {sortedTasks.length > 0 ? (
          <div className="grid gap-4">
            {sortedTasks.map((task, index) => {
              const course = courseById.get(task.courseId) ?? null;

              return (
                <div key={task.id} style={createMotionStyle(340 + index * 35)}>
                  <TaskCard
                    task={task}
                    index={index}
                    course={course}
                    variant="card"
                    isUpdatingStatus={updateTaskMutation.isPending}
                    onUpdateStatus={(t, status) =>
                      updateTaskMutation.mutate({ taskId: t.id, status })
                    }
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-sm leading-7 text-[var(--study-copy-muted)]">
            No tasks yet. Add tasks inside a course to start building your plan.
          </div>
        )}
      </div>
    </section>
  );
}

export default TasksPage;
