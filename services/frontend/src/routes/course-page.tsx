import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent
} from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import {
  BookOpenText,
  CalendarClock,
  CheckCircle2,
  Dot,
  Eye,
  Gauge,
  PencilLine,
  Plus,
  SlidersHorizontal,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { createAnalysis, type AnalysisResult } from '@/lib/analysis-api';
import {
  deleteCourse as deleteCourseRequest,
  listCourses,
  updateCourse,
  type Course
} from '@/lib/courses-api';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import {
  createTask,
  deleteTask as deleteTaskRequest,
  updateTask,
  type Task,
  type TaskPriorityInput,
  type TaskStatusInput
} from '@/lib/tasks-api';

type DeleteTarget =
  | { type: 'course'; label: string }
  | { type: 'task'; taskId: number; label: string }
  | null;

type CoursesQueryData = {
  courses: Course[];
};

type AnalysisQueryData = {
  analyses: AnalysisResult[];
};

type UpdateCourseVariables = {
  targetCourseId: number;
  payload: {
    name?: string;
    color?: string;
    code?: string;
    description?: string;
  };
};

type TaskFormValues = {
  title: string;
  description: string;
  deadline: string;
  estimatedHours: string;
  actualHours: string;
  status: TaskStatusInput;
  priority: TaskPriorityInput | '';
  completedAt: string;
};

type TaskEditorState = {
  id: number;
  values: TaskFormValues;
};

const TEXTAREA_CLASS_NAME =
  'min-h-28 w-full rounded-2xl border border-[var(--study-line)] bg-[var(--study-surface-soft)] px-4 py-3 text-sm leading-6 text-[var(--study-ink)] outline-none transition-colors placeholder:text-[var(--study-copy-muted)] focus-visible:border-[var(--study-focus)]';

const FIELD_LABEL_CLASS_NAME =
  'text-[0.68rem] font-medium uppercase tracking-[0.24em] text-[var(--study-kicker)]';

const COURSE_COLOR_OPTIONS = [
  '#4f46e5',
  '#0f766e',
  '#ca8a04',
  '#c2410c',
  '#be185d',
  '#2563eb'
] as const;

const TASK_STATUS_OPTIONS: TaskStatusInput[] = [
  'pending',
  'in_progress',
  'completed',
  'overdue'
];

const TASK_PRIORITY_OPTIONS: TaskPriorityInput[] = ['low', 'medium', 'high'];

type TaskFilterId =
  | 'all'
  | 'open'
  | 'due-soon'
  | 'high-priority'
  | 'completed'
  | 'overdue';

const TASK_FILTER_STORAGE_KEY = 'study-planner:course-task-filter';

const TASK_FILTER_OPTIONS: Array<{
  id: TaskFilterId;
  label: string;
  description: string;
}> = [
  {
    id: 'all',
    label: 'All tasks',
    description: 'Show every task in this course.'
  },
  {
    id: 'open',
    label: 'Open tasks',
    description: 'Focus on pending and in-progress work.'
  },
  {
    id: 'due-soon',
    label: 'Due soon',
    description: 'Tasks due within the next 7 days.'
  },
  {
    id: 'high-priority',
    label: 'High priority',
    description: 'Only the tasks marked as high priority.'
  },
  {
    id: 'completed',
    label: 'Completed',
    description: 'Only tasks already marked as done.'
  },
  {
    id: 'overdue',
    label: 'Overdue',
    description: 'Tasks with overdue status.'
  }
];

function formatTaskStatus(status: Task['status']) {
  return status.toLowerCase().replace(/_/g, ' ');
}

function getTaskFilterLabel(filterId: TaskFilterId) {
  return (
    TASK_FILTER_OPTIONS.find((option) => option.id === filterId)?.label ??
    'All tasks'
  );
}

function readStoredTaskFilter(courseId: number): TaskFilterId {
  if (typeof window === 'undefined') {
    return 'all';
  }

  const raw = window.localStorage.getItem(
    `${TASK_FILTER_STORAGE_KEY}:${courseId}`
  );

  if (raw && TASK_FILTER_OPTIONS.some((option) => option.id === raw)) {
    return raw as TaskFilterId;
  }

  return 'all';
}

function isTaskDueSoon(task: Task) {
  if (!task.deadline || task.status === 'COMPLETED') {
    return false;
  }

  const now = Date.now();
  const deadlineTime = new Date(task.deadline).getTime();
  const diff = deadlineTime - now;
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  return diff >= 0 && diff <= sevenDays;
}

function matchesTaskFilter(task: Task, filterId: TaskFilterId) {
  switch (filterId) {
    case 'open':
      return task.status === 'PENDING' || task.status === 'IN_PROGRESS';
    case 'due-soon':
      return isTaskDueSoon(task);
    case 'high-priority':
      return task.priority === 'HIGH';
    case 'completed':
      return task.status === 'COMPLETED';
    case 'overdue':
      return task.status === 'OVERDUE';
    case 'all':
    default:
      return true;
  }
}

function getTaskFilterCount(tasks: Task[], filterId: TaskFilterId) {
  return tasks.filter((task) => matchesTaskFilter(task, filterId)).length;
}

function TaskFilterOption({
  option,
  count,
  isActive,
  onSelect,
  compact = false
}: {
  option: (typeof TASK_FILTER_OPTIONS)[number];
  count: number;
  isActive: boolean;
  onSelect: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-[1.15rem] border text-left transition-colors ${
        compact ? 'px-3 py-3' : 'px-3 py-3.5'
      } ${
        isActive
          ? 'border-[var(--study-focus)] bg-[var(--study-surface-soft)]'
          : 'border-[var(--study-line)] hover:bg-[var(--study-surface-soft)]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--study-ink)]">
            {option.label}
          </p>
          <p className="mt-1 text-xs leading-5 text-[var(--study-copy-muted)]">
            {option.description}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-[var(--study-surface)] px-2 py-1 text-xs font-medium text-[var(--study-copy)]">
            {count}
          </span>
          <span
            className={`inline-flex size-5 items-center justify-center rounded-full border ${
              isActive
                ? 'border-[var(--study-focus)] bg-[var(--study-ink)] text-white'
                : 'border-[var(--study-line)] text-transparent'
            }`}
          >
            •
          </span>
        </div>
      </div>
    </button>
  );
}

function TaskFilterRail({
  taskFilter,
  taskCountsByFilter,
  onSelect,
  onReset,
  className = '',
  compact = false
}: {
  taskFilter: TaskFilterId;
  taskCountsByFilter: Record<TaskFilterId, number>;
  onSelect: (filterId: TaskFilterId) => void;
  onReset?: () => void;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={className}>
      <div className="flex items-start justify-between gap-4">
        {taskFilter !== 'all' && onReset ? (
          <button
            type="button"
            onClick={onReset}
            className="text-[0.68rem] font-medium uppercase tracking-[0.22em] text-[var(--study-kicker)] transition-colors hover:text-[var(--study-ink)]"
          >
            Reset
          </button>
        ) : null}
      </div>

      <div>
        <div className="space-y-2">
          {TASK_FILTER_OPTIONS.map((option) => (
            <TaskFilterOption
              key={option.id}
              option={option}
              count={taskCountsByFilter[option.id]}
              isActive={taskFilter === option.id}
              onSelect={() => onSelect(option.id)}
              compact={compact}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function formatDateTimeLabel(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat('en-FI', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

function toDateTimeLocalValue(value: string | null) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);

  return localDate.toISOString().slice(0, 16);
}

function createEmptyTaskForm(): TaskFormValues {
  return {
    title: '',
    description: '',
    deadline: '',
    estimatedHours: '',
    actualHours: '0',
    status: 'pending',
    priority: '',
    completedAt: ''
  };
}

function createTaskFormFromTask(task: Task): TaskFormValues {
  return {
    title: task.title,
    description: task.description ?? '',
    deadline: toDateTimeLocalValue(task.deadline),
    estimatedHours: task.estimatedHours,
    actualHours: task.actualHours,
    status: task.status.toLowerCase() as TaskStatusInput,
    priority: task.priority
      ? (task.priority.toLowerCase() as TaskPriorityInput)
      : '',
    completedAt: toDateTimeLocalValue(task.completedAt)
  };
}

function buildTaskPayload(values: TaskFormValues) {
  return {
    title: values.title.trim(),
    ...(values.description.trim()
      ? { description: values.description.trim() }
      : {}),
    deadline: values.deadline,
    estimatedHours: values.estimatedHours,
    actualHours: values.actualHours || '0',
    status: values.status,
    ...(values.priority ? { priority: values.priority } : {}),
    ...(values.completedAt ? { completedAt: values.completedAt } : {})
  };
}

function buildTaskUpdatePayload(values: TaskFormValues) {
  return {
    title: values.title.trim(),
    description: values.description.trim() || null,
    deadline: values.deadline || null,
    estimatedHours: values.estimatedHours || '0',
    actualHours: values.actualHours || '0',
    status: values.status,
    priority: values.priority || null,
    completedAt: values.completedAt || null
  };
}

function buildCourseUpdatePayload(values: {
  name: string;
  color: string;
  code: string;
  description: string;
}) {
  return {
    name: values.name.trim(),
    color: values.color,
    code: values.code.trim() || undefined,
    description: values.description.trim() || undefined
  };
}

const EMPTY_PRIORITY_VALUE = '__none__';
const DEFAULT_TASK_TIME = '18:00';

function padDatePart(value: number) {
  return String(value).padStart(2, '0');
}

function formatLocalDatePart(date: Date) {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
}

function getDateFromDateTimeValue(value: string) {
  if (!value) {
    return undefined;
  }

  const [datePart] = value.split('T');

  if (!datePart) {
    return undefined;
  }

  const [year, month, day] = datePart.split('-').map((part) => Number(part));

  if ([year, month, day].some((part) => Number.isNaN(part))) {
    return undefined;
  }

  return new Date(year, month - 1, day);
}

function getTimeFromDateTimeValue(value: string) {
  const [, timePart] = value.split('T');
  return timePart?.slice(0, 5) ?? DEFAULT_TASK_TIME;
}

function updateDatePart(value: string, date?: Date) {
  if (!date) {
    return '';
  }

  return `${formatLocalDatePart(date)}T${getTimeFromDateTimeValue(value)}`;
}

function updateTimePart(value: string, time: string) {
  const selectedDate = getDateFromDateTimeValue(value);

  if (!selectedDate || !time) {
    return selectedDate
      ? `${formatLocalDatePart(selectedDate)}T${DEFAULT_TASK_TIME}`
      : '';
  }

  return `${formatLocalDatePart(selectedDate)}T${time}`;
}

function DateTimeField({
  id,
  label,
  value,
  placeholder,
  onChange,
  required = false
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  const selectedDate = getDateFromDateTimeValue(value);
  const timeValue = selectedDate
    ? getTimeFromDateTimeValue(value)
    : DEFAULT_TASK_TIME;

  return (
    <div className="space-y-2">
      <label htmlFor={id} className={FIELD_LABEL_CLASS_NAME}>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </label>
      <div className="space-y-2">
        <Popover>
          <Button
            asChild
            id={id}
            type="button"
            variant="outline"
            className="h-10 w-full justify-between rounded-lg border-[var(--study-line)] bg-[var(--study-surface-soft)] px-3 text-left text-sm font-normal text-[var(--study-ink)] hover:bg-[var(--study-surface-soft)]"
          >
            <PopoverTrigger>
              <span
                className={
                  value
                    ? 'text-[var(--study-ink)]'
                    : 'text-[var(--study-copy-muted)]'
                }
              >
                {formatDateTimeLabel(value) ?? placeholder}
              </span>
              <CalendarClock className="size-4 opacity-70" />
            </PopoverTrigger>
          </Button>
          <PopoverContent
            align="start"
            className="z-[70] w-auto rounded-[1.5rem] border-[var(--study-line)] bg-[var(--study-popover-surface)] p-3 shadow-[var(--study-popover-shadow)]"
          >
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => onChange(updateDatePart(value, date))}
              initialFocus
            />
            <div className="mt-3 flex items-center gap-2 border-t border-[var(--study-line)] pt-3">
              <Input
                type="time"
                value={timeValue}
                onChange={(event) =>
                  onChange(updateTimePart(value, event.target.value))
                }
                disabled={!selectedDate}
                className="h-10 rounded-lg border-[var(--study-line)] bg-[var(--study-surface-soft)] px-3 text-sm text-[var(--study-ink)]"
              />
              {value ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-[var(--study-copy)] hover:text-[var(--study-ink)]"
                  onClick={() => onChange('')}
                >
                  Clear
                </Button>
              ) : null}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

function TaskFields({
  values,
  onChange,
  requirePlanningFields = false
}: {
  values: TaskFormValues;
  onChange: (field: keyof TaskFormValues, value: string) => void;
  requirePlanningFields?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="task-title" className={FIELD_LABEL_CLASS_NAME}>
          Title
        </label>
        <Input
          id="task-title"
          value={values.title}
          onChange={(event) => onChange('title', event.target.value)}
          placeholder="Finish chapter summary"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="task-description" className={FIELD_LABEL_CLASS_NAME}>
          Description
        </label>
        <textarea
          id="task-description"
          value={values.description}
          onChange={(event) => onChange('description', event.target.value)}
          placeholder="Add notes, scope, or what success looks like"
          className={TEXTAREA_CLASS_NAME}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <DateTimeField
          id="task-deadline"
          label="Deadline"
          value={values.deadline}
          placeholder="Pick a deadline"
          onChange={(nextValue) => onChange('deadline', nextValue)}
          required={requirePlanningFields}
        />
        <DateTimeField
          id="task-completed-at"
          label="Completed at"
          value={values.completedAt}
          placeholder="Set completion time"
          onChange={(nextValue) => onChange('completedAt', nextValue)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="task-estimated-hours"
            className={FIELD_LABEL_CLASS_NAME}
          >
            Estimated hours
            {requirePlanningFields ? (
              <span className="text-destructive"> *</span>
            ) : null}
          </label>
          <Input
            id="task-estimated-hours"
            type="number"
            min={requirePlanningFields ? '0.25' : '0'}
            step="0.25"
            required={requirePlanningFields}
            value={values.estimatedHours}
            onChange={(event) => onChange('estimatedHours', event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="task-actual-hours" className={FIELD_LABEL_CLASS_NAME}>
            Actual hours
          </label>
          <Input
            id="task-actual-hours"
            type="number"
            min="0"
            step="0.25"
            value={values.actualHours}
            onChange={(event) => onChange('actualHours', event.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="task-status" className={FIELD_LABEL_CLASS_NAME}>
            Status
          </label>
          <Select
            value={values.status}
            onValueChange={(value) => onChange('status', value)}
          >
            <SelectTrigger id="task-status">
              <SelectValue placeholder="Select a status" />
            </SelectTrigger>
            <SelectContent>
              {TASK_STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label htmlFor="task-priority" className={FIELD_LABEL_CLASS_NAME}>
            Priority
          </label>
          <Select
            value={values.priority || EMPTY_PRIORITY_VALUE}
            onValueChange={(value) =>
              onChange('priority', value === EMPTY_PRIORITY_VALUE ? '' : value)
            }
          >
            <SelectTrigger id="task-priority">
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={EMPTY_PRIORITY_VALUE}>none</SelectItem>
              {TASK_PRIORITY_OPTIONS.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {priority}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

function CoursePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const analysisRefreshTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const pathname = useRouterState({
    select: (state) => state.location.pathname
  });

  const courseId = Number(pathname.split('/')[2] ?? '0');
  const coursesQuery = useQuery({
    queryKey: ['courses'],
    queryFn: listCourses
  });

  function patchCourseTasks(
    targetCourseId: number,
    updater: (tasks: Task[]) => Task[]
  ) {
    queryClient.setQueryData<CoursesQueryData>(['courses'], (current) => {
      if (!current) {
        return current;
      }

      return {
        courses: current.courses.map((item) =>
          item.id === targetCourseId
            ? { ...item, tasks: updater(item.tasks) }
            : item
        )
      };
    });
  }

  const refreshAnalysisMutation = useMutation({
    mutationFn: createAnalysis,
    onSuccess: ({ analysis }) => {
      queryClient.setQueryData<AnalysisQueryData>(['analysis'], (current) => ({
        analyses: [
          analysis,
          ...(current?.analyses.filter((item) => item.id !== analysis.id) ?? [])
        ]
      }));
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, 'Analytics refresh failed. Try again later.')
      );
    }
  });

  function scheduleAnalysisRefresh() {
    if (analysisRefreshTimeoutRef.current) {
      clearTimeout(analysisRefreshTimeoutRef.current);
    }

    analysisRefreshTimeoutRef.current = setTimeout(() => {
      refreshAnalysisMutation.mutate({});
      analysisRefreshTimeoutRef.current = null;
    }, 900);
  }

  useEffect(
    () => () => {
      if (analysisRefreshTimeoutRef.current) {
        clearTimeout(analysisRefreshTimeoutRef.current);
      }
    },
    []
  );

  const createTaskMutation = useMutation({
    mutationFn: createTask,
    onSuccess: ({ task }) => {
      toast.success('Task created');
      patchCourseTasks(task.courseId, (tasks) => [task, ...tasks]);
      scheduleAnalysisRefresh();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Unable to create task'));
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({
      taskId,
      payload
    }: {
      taskId: number;
      payload: ReturnType<typeof buildTaskUpdatePayload>;
    }) => updateTask(taskId, payload),
    onSuccess: ({ task }) => {
      toast.success('Task updated');
      patchCourseTasks(task.courseId, (tasks) =>
        tasks.map((item) => (item.id === task.id ? task : item))
      );
      scheduleAnalysisRefresh();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Unable to update task'));
    }
  });

  const completeTaskMutation = useMutation({
    mutationFn: ({ taskId }: { taskId: number }) =>
      updateTask(taskId, {
        status: 'completed',
        completedAt: new Date().toISOString()
      }),
    onSuccess: ({ task }) => {
      toast.success('Task marked as done');
      patchCourseTasks(task.courseId, (tasks) =>
        tasks.map((item) => (item.id === task.id ? task : item))
      );
      scheduleAnalysisRefresh();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Unable to mark task as done'));
    }
  });

  const updateCourseMutation = useMutation({
    mutationFn: ({ targetCourseId, payload }: UpdateCourseVariables) =>
      updateCourse(targetCourseId, payload),
    onMutate: async ({ targetCourseId, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['courses'] });

      const previousCourses = queryClient.getQueryData<CoursesQueryData>([
        'courses'
      ]);

      queryClient.setQueryData<CoursesQueryData>(['courses'], (current) => {
        if (!current) {
          return current;
        }

        return {
          courses: current.courses.map((item) =>
            item.id === targetCourseId
              ? {
                  ...item,
                  ...(payload.name !== undefined ? { name: payload.name } : {}),
                  ...(payload.color !== undefined
                    ? { color: payload.color }
                    : {}),
                  ...(payload.code !== undefined ? { code: payload.code } : {}),
                  ...(payload.description !== undefined
                    ? { description: payload.description }
                    : {})
                }
              : item
          )
        };
      });

      return { previousCourses };
    },
    onSuccess: ({ course }) => {
      toast.success('Course updated');
      queryClient.setQueryData<CoursesQueryData>(['courses'], (current) => {
        if (!current) {
          return { courses: [course] };
        }

        return {
          courses: current.courses.map((item) =>
            item.id === course.id ? course : item
          )
        };
      });
    },
    onError: (error, _variables, context) => {
      if (context?.previousCourses) {
        queryClient.setQueryData(['courses'], context.previousCourses);
      }

      toast.error(getApiErrorMessage(error, 'Unable to update course'));
    }
  });

  const deleteCourseMutation = useMutation({
    mutationFn: deleteCourseRequest,
    onSuccess: async () => {
      toast.success('Course deleted');
      await queryClient.invalidateQueries({ queryKey: ['courses'] });
      await navigate({ to: '/' });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Unable to delete course'));
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTaskRequest,
    onSuccess: (_data, taskId) => {
      toast.success('Task deleted');
      patchCourseTasks(courseId, (tasks) =>
        tasks.filter((item) => item.id !== taskId)
      );
      scheduleAnalysisRefresh();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Unable to delete task'));
    }
  });

  const [taskForm, setTaskForm] = useState<TaskFormValues>(
    createEmptyTaskForm()
  );
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [isCourseEditorOpen, setIsCourseEditorOpen] = useState(false);
  const [courseNameDraft, setCourseNameDraft] = useState('');
  const [courseColorDraft, setCourseColorDraft] = useState('#4f46e5');
  const [courseCodeDraft, setCourseCodeDraft] = useState('');
  const [courseDescriptionDraft, setCourseDescriptionDraft] = useState('');
  const [taskEditor, setTaskEditor] = useState<TaskEditorState | null>(null);
  const [completingTaskId, setCompletingTaskId] = useState<number | null>(null);
  const [taskFilter, setTaskFilter] = useState<TaskFilterId>(() =>
    readStoredTaskFilter(Number(pathname.split('/')[2] ?? '0'))
  );
  const [isTaskFilterOpen, setIsTaskFilterOpen] = useState(false);

  const courses = coursesQuery.data?.courses ?? [];
  const course = courses.find((item) => item.id === courseId) ?? null;
  const filteredTasks = course
    ? course.tasks.filter((task) => matchesTaskFilter(task, taskFilter))
    : [];
  const taskCountsByFilter: Record<TaskFilterId, number> = course
    ? {
        all: course.tasks.length,
        open: getTaskFilterCount(course.tasks, 'open'),
        'due-soon': getTaskFilterCount(course.tasks, 'due-soon'),
        'high-priority': getTaskFilterCount(course.tasks, 'high-priority'),
        completed: getTaskFilterCount(course.tasks, 'completed'),
        overdue: getTaskFilterCount(course.tasks, 'overdue')
      }
    : {
        all: 0,
        open: 0,
        'due-soon': 0,
        'high-priority': 0,
        completed: 0,
        overdue: 0
      };
  const openTasksCount = taskCountsByFilter.open;
  const dueSoonTasksCount = taskCountsByFilter['due-soon'];
  const highPriorityTasksCount = taskCountsByFilter['high-priority'];
  const currentTaskEditing = taskEditor
    ? (course?.tasks.find((task) => task.id === taskEditor.id) ?? null)
    : null;
  const courseUpdatePayload = course
    ? buildCourseUpdatePayload({
        name: courseNameDraft,
        color: courseColorDraft,
        code: courseCodeDraft,
        description: courseDescriptionDraft
      })
    : null;
  const hasCourseChanges = course
    ? JSON.stringify(courseUpdatePayload) !==
      JSON.stringify(
        buildCourseUpdatePayload({
          name: course.name,
          color: getCourseColor(course.color),
          code: course.code ?? '',
          description: course.description ?? ''
        })
      )
    : false;
  const hasTaskChanges =
    currentTaskEditing && taskEditor
      ? JSON.stringify(buildTaskUpdatePayload(taskEditor.values)) !==
        JSON.stringify(
          buildTaskUpdatePayload(createTaskFormFromTask(currentTaskEditing))
        )
      : false;

  useEffect(() => {
    setTaskFilter(readStoredTaskFilter(courseId));
  }, [courseId]);

  useEffect(() => {
    if (typeof window === 'undefined' || !courseId) {
      return;
    }

    window.localStorage.setItem(
      `${TASK_FILTER_STORAGE_KEY}:${courseId}`,
      taskFilter
    );
  }, [courseId, taskFilter]);

  function createMotionStyle(delay: number): CSSProperties {
    return {
      '--motion-delay': `${delay}ms`
    } as CSSProperties;
  }

  function getCourseColor(color: string | null) {
    return color ?? '#4f46e5';
  }

  function getMutationErrorMessage(error: unknown) {
    return getApiErrorMessage(error, 'Unable to save changes');
  }

  function openCourseEditor() {
    if (!course) {
      return;
    }

    setCourseNameDraft(course.name);
    setCourseColorDraft(getCourseColor(course.color));
    setCourseCodeDraft(course.code ?? '');
    setCourseDescriptionDraft(course.description ?? '');
    setIsCourseEditorOpen(true);
  }

  function openTaskEditor(task: Task) {
    updateTaskMutation.reset();
    setTaskEditor({
      id: task.id,
      values: createTaskFormFromTask(task)
    });
  }

  function updateTaskForm(field: keyof TaskFormValues, value: string) {
    setTaskForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  function updateTaskEditorField(field: keyof TaskFormValues, value: string) {
    setTaskEditor((current) =>
      current
        ? {
            ...current,
            values: {
              ...current.values,
              [field]: value
            }
          }
        : current
    );
  }

  function handleTaskRowKeyDown(
    event: KeyboardEvent<HTMLDivElement>,
    task: Task
  ) {
    if (
      event.target !== event.currentTarget ||
      (event.key !== 'Enter' && event.key !== ' ')
    ) {
      return;
    }

    event.preventDefault();
    openTaskEditor(task);
  }

  async function handleCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!course) {
      return;
    }

    const normalizedTitle = taskForm.title.trim();

    if (!normalizedTitle) {
      return;
    }

    if (!taskForm.deadline) {
      toast.error('Choose a deadline before adding the task');
      return;
    }

    const estimatedHours = Number(taskForm.estimatedHours);

    if (
      !taskForm.estimatedHours ||
      Number.isNaN(estimatedHours) ||
      estimatedHours <= 0
    ) {
      toast.error('Add estimated hours greater than 0 before adding the task');
      return;
    }

    await createTaskMutation.mutateAsync({
      courseId: course.id,
      ...buildTaskPayload(taskForm),
      title: normalizedTitle
    });

    setTaskForm(createEmptyTaskForm());
  }

  async function handleUpdateCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!course) {
      return;
    }

    const normalizedName = courseNameDraft.trim();

    if (!normalizedName || !hasCourseChanges || !courseUpdatePayload) {
      return;
    }

    await updateCourseMutation.mutateAsync({
      targetCourseId: course.id,
      payload: courseUpdatePayload
    });

    setIsCourseEditorOpen(false);
  }

  async function handleUpdateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!taskEditor) {
      return;
    }

    const normalizedTitle = taskEditor.values.title.trim();

    if (!normalizedTitle || !hasTaskChanges) {
      return;
    }

    await updateTaskMutation.mutateAsync({
      taskId: taskEditor.id,
      payload: {
        ...buildTaskUpdatePayload(taskEditor.values),
        title: normalizedTitle
      }
    });

    setTaskEditor(null);
  }

  async function handleMarkTaskDone(taskId: number) {
    setCompletingTaskId(taskId);

    try {
      await completeTaskMutation.mutateAsync({ taskId });
    } finally {
      setCompletingTaskId(null);
    }
  }

  async function handleConfirmDelete() {
    if (!course || !deleteTarget) {
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

  if (coursesQuery.isPending || coursesQuery.isFetching) {
    return (
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="border-b border-[var(--study-line)] pb-8">
          <p className="motion-enter text-[0.7rem] font-medium uppercase tracking-[0.28em] text-[var(--study-kicker)]">
            Course
          </p>
          <div className="motion-enter mt-5 h-14 w-72 rounded-2xl bg-[var(--study-surface-soft)]" />
          <div className="motion-enter mt-5 h-4 w-full max-w-xl rounded-full bg-[var(--study-surface-soft)]" />
          <div className="motion-enter mt-3 h-4 w-full max-w-md rounded-full bg-[var(--study-surface-soft)]" />
        </div>
      </section>
    );
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
            This course does not exist anymore, or you no longer have access to
            it.
          </p>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <div className="grid gap-10 border-b border-[var(--study-line)] pb-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
          <div
            className="motion-enter motion-enter-strong relative lg:min-h-[42rem]"
            style={createMotionStyle(0)}
          >
            <div
              className="motion-orb absolute -left-8 top-0 h-28 w-28 rounded-full blur-3xl"
              style={{ backgroundColor: `${getCourseColor(course.color)}2f` }}
            />
            <div className="relative flex h-full flex-col gap-10">
              <div>
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
                    <h1 className="font-display max-w-4xl text-[clamp(2.8rem,5.6vw,5.5rem)] leading-[0.94] tracking-[-0.06em] text-[var(--study-ink)]">
                      {course.name}
                    </h1>
                    <p className="mt-5 max-w-[42rem] text-base leading-8 text-[var(--study-copy)]">
                      {course.description?.trim() || 'No description.'}
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="motion-enter mt-10 grid gap-8 border-t border-[var(--study-line)] pt-8 xl:grid-cols-[0.8fr_0.2fr]"
                style={createMotionStyle(260)}
              >
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <p className="text-[0.65rem] font-medium uppercase tracking-[0.24em] text-[var(--study-kicker)]">
                      Tasks total
                    </p>
                    <p className="font-display mt-3 text-4xl leading-none tracking-[-0.05em] text-[var(--study-ink)]">
                      {course.tasks.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.65rem] font-medium uppercase tracking-[0.24em] text-[var(--study-kicker)]">
                      Open now
                    </p>
                    <p className="font-display mt-3 text-4xl leading-none tracking-[-0.05em] text-[var(--study-ink)]">
                      {openTasksCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.65rem] font-medium uppercase tracking-[0.24em] text-[var(--study-kicker)]">
                      Due soon
                    </p>
                    <p className="font-display mt-3 text-4xl leading-none tracking-[-0.05em] text-[var(--study-ink)]">
                      {dueSoonTasksCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.65rem] font-medium uppercase tracking-[0.24em] text-[var(--study-kicker)]">
                      High priority
                    </p>
                    <p className="font-display mt-3 text-4xl leading-none tracking-[-0.05em] text-[var(--study-ink)]">
                      {highPriorityTasksCount}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 border-t border-[var(--study-line)] pt-5 sm:grid-cols-[1fr_auto] sm:items-end sm:gap-6 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
                  <div className="flex flex-wrap gap-2.5 xl:flex-col xl:items-start">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 rounded-full border-[var(--study-line)] bg-[var(--study-surface-soft)] px-4 text-[var(--study-ink)] shadow-none transition-colors hover:border-[var(--study-focus)] hover:bg-[var(--study-surface)]"
                      onClick={openCourseEditor}
                    >
                      <span className="inline-flex size-7 items-center justify-center rounded-full bg-[var(--study-surface)] text-[var(--study-copy-muted)]">
                        <PencilLine className="size-3.5" />
                      </span>
                      Edit course
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-11 rounded-full px-4 text-[var(--study-copy)] transition-colors hover:bg-[color-mix(in_oklch,var(--study-danger,#dc2626)_10%,transparent)] hover:text-[var(--study-danger,#dc2626)]"
                      onClick={() =>
                        setDeleteTarget({
                          type: 'course',
                          label: course.name
                        })
                      }
                    >
                      <span className="inline-flex size-7 items-center justify-center rounded-full bg-[color-mix(in_oklch,var(--study-danger,#dc2626)_8%,transparent)] text-[var(--study-danger,#dc2626)]">
                        <Trash2 className="size-3.5" />
                      </span>
                      Archive course
                    </Button>
                  </div>
                </div>
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
            <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--study-copy-muted)]">
              Add the study parameters here: timing, effort, status, and
              priority.
            </p>

            <form
              onSubmit={handleCreateTask}
              className="motion-enter mt-8 space-y-5"
              style={createMotionStyle(260)}
            >
              <TaskFields
                values={taskForm}
                onChange={updateTaskForm}
                requirePlanningFields
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
            <div className="md:hidden">
              <Popover
                open={isTaskFilterOpen}
                onOpenChange={setIsTaskFilterOpen}
              >
                <Button
                  asChild
                  type="button"
                  variant="outline"
                  className="h-auto rounded-[1.15rem] border-[var(--study-line)] bg-[var(--study-surface-soft)] px-3 py-2 text-[var(--study-ink)] hover:bg-[var(--study-surface-soft)]"
                >
                  <PopoverTrigger>
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-flex size-8 items-center justify-center rounded-full bg-[var(--study-surface)] text-[var(--study-copy-muted)]">
                        <SlidersHorizontal className="size-4" />
                      </span>
                      <span className="flex min-w-0 flex-col items-start text-left">
                        <span className="text-[0.62rem] font-medium uppercase tracking-[0.22em] text-[var(--study-kicker)]">
                          Task lens
                        </span>
                        <span className="text-sm font-medium text-[var(--study-ink)]">
                          {getTaskFilterLabel(taskFilter)}
                        </span>
                      </span>
                      <span className="ml-1 inline-flex min-w-8 items-center justify-center rounded-full bg-[var(--study-ink)] px-2 py-1 text-[0.68rem] font-medium text-white">
                        {taskCountsByFilter[taskFilter]}
                      </span>
                    </span>
                  </PopoverTrigger>
                </Button>
                <PopoverContent
                  align="start"
                  sideOffset={10}
                  className="w-[24rem] max-w-[calc(100vw-2rem)] rounded-[1.6rem] border-[var(--study-line)] bg-[var(--study-popover-surface)] p-5 shadow-[var(--study-popover-shadow)]"
                >
                  <TaskFilterRail
                    taskFilter={taskFilter}
                    taskCountsByFilter={taskCountsByFilter}
                    onSelect={(filterId) => {
                      setTaskFilter(filterId);
                      setIsTaskFilterOpen(false);
                    }}
                    onReset={() => {
                      setTaskFilter('all');
                      setIsTaskFilterOpen(false);
                    }}
                    compact
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="hidden md:block">
              <div className="sticky top-24 pr-6">
                <TaskFilterRail
                  taskFilter={taskFilter}
                  taskCountsByFilter={taskCountsByFilter}
                  onSelect={setTaskFilter}
                  onReset={() => setTaskFilter('all')}
                />
              </div>
            </div>
          </div>

          <div
            className="motion-enter border-t border-[var(--study-line)]"
            style={createMotionStyle(380)}
          >
            {filteredTasks.length > 0 ? (
              <div className="divide-y divide-[var(--study-line)]">
                {filteredTasks.map((task, index) => (
                  <div
                    key={task.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openTaskEditor(task)}
                    onKeyDown={(event) => handleTaskRowKeyDown(event, task)}
                    className="motion-enter motion-task-row grid cursor-pointer gap-4 px-2 py-4 outline-none transition-colors hover:bg-[var(--study-surface-soft)] focus-visible:bg-[var(--study-surface-soft)] focus-visible:ring-2 focus-visible:ring-[var(--study-focus)] md:grid-cols-[0.08fr_0.92fr] rounded-none"
                    style={createMotionStyle(440 + index * 70)}
                    aria-label={`Open details for ${task.title}`}
                  >
                    <div className="flex items-center justify-start text-[0.7rem] font-medium uppercase tracking-[0.24em] text-[var(--study-kicker)]">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <Dot
                          className="size-5 shrink-0"
                          style={{ color: getCourseColor(course.color) }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="min-w-0 truncate text-lg font-semibold text-[var(--study-ink-strong)]">
                              {task.title}
                            </p>
                            <span className="inline-flex rounded-full bg-[var(--study-surface)] px-2 py-1 text-[0.62rem] font-medium uppercase tracking-[0.18em] text-[var(--study-kicker)]">
                              {formatTaskStatus(task.status)}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs uppercase tracking-[0.18em] text-[var(--study-kicker)]">
                            <span className="inline-flex items-center gap-2">
                              <CalendarClock className="size-3.5" />
                              {formatDateTimeLabel(task.deadline) ??
                                'No deadline'}
                            </span>
                            <span className="inline-flex items-center gap-2">
                              <Gauge className="size-3.5" />
                              {task.estimatedHours}h est.
                            </span>
                            {task.status === 'COMPLETED' && task.completedAt ? (
                              <span className="inline-flex items-center gap-2">
                                <CheckCircle2 className="size-3.5" />
                                completed
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <div className="ml-auto flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleMarkTaskDone(task.id);
                            }}
                            disabled={
                              task.status === 'COMPLETED' ||
                              completingTaskId === task.id
                            }
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-full px-3 text-[var(--study-copy-muted)] transition-colors hover:bg-[var(--study-surface)] hover:text-[var(--study-ink)] disabled:cursor-not-allowed disabled:bg-[var(--study-surface)] disabled:text-[var(--study-kicker)]"
                            aria-label={`Mark ${task.title} as done`}
                            title={
                              task.status === 'COMPLETED'
                                ? `${task.title} is already completed`
                                : `Mark ${task.title} as done`
                            }
                          >
                            <CheckCircle2 className="size-4" />
                            <span className="hidden text-xs font-medium uppercase tracking-[0.18em] sm:inline">
                              {completingTaskId === task.id
                                ? 'Saving'
                                : task.status === 'COMPLETED'
                                  ? 'Done'
                                  : 'Mark done'}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openTaskEditor(task);
                            }}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-full px-3 text-[var(--study-copy-muted)] transition-colors hover:bg-[var(--study-surface)] hover:text-[var(--study-ink)]"
                            aria-label={`View details for ${task.title}`}
                            title={`View details for ${task.title}`}
                          >
                            <Eye className="size-4" />
                            <span className="hidden text-xs font-medium uppercase tracking-[0.18em] sm:inline">
                              Details
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setDeleteTarget({
                                type: 'task',
                                taskId: task.id,
                                label: task.title
                              });
                            }}
                            className="inline-flex size-9 items-center justify-center rounded-full text-destructive transition-colors hover:bg-destructive/10 hover:text-destructive/80"
                            aria-label={`Delete ${task.title}`}
                            title={`Delete ${task.title}`}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : course.tasks.length > 0 ? (
              <div className="py-8 text-sm leading-7 text-[var(--study-copy-muted)]">
                No tasks match{' '}
                <span className="font-medium text-[var(--study-ink)]">
                  {getTaskFilterLabel(taskFilter).toLowerCase()}
                </span>{' '}
                right now. Try another suggestion or switch back to all tasks.
              </div>
            ) : (
              <div className="py-8 text-sm leading-7 text-[var(--study-copy-muted)]">
                No tasks yet. Add the first task above to start structuring this
                course.
              </div>
            )}
          </div>
        </div>
      </section>

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

      <Dialog open={isCourseEditorOpen} onOpenChange={setIsCourseEditorOpen}>
        <DialogContent className="overflow-hidden rounded-xl border border-[var(--study-popover-border)] bg-[var(--study-popover-surface)] p-0 text-[var(--study-ink)] shadow-[var(--study-popover-shadow)] sm:max-w-[28rem]">
          <div className="relative overflow-hidden rounded-[inherit] px-5 py-5">
            <div
              className="pointer-events-none absolute -left-8 top-4 h-20 w-20 rounded-full blur-2xl"
              style={{ backgroundColor: `${courseColorDraft}2f` }}
            />
            <DialogHeader className="relative border-b border-[var(--study-line)] pb-4 text-left">
              <p className="text-[0.68rem] font-medium uppercase tracking-[0.28em] text-[var(--study-kicker)]">
                Edit course
              </p>
              <DialogTitle className="font-display mt-3 text-[1.9rem] leading-[0.92] tracking-[-0.05em] text-[var(--study-ink-strong)]">
                Refine this lane.
              </DialogTitle>
              <DialogDescription className="mt-3 max-w-[20rem] text-sm leading-6 text-[var(--study-copy-muted)]">
                Update the name, color, code, and description while keeping the
                sidebar preview clear.
              </DialogDescription>
            </DialogHeader>

            <form
              className="relative mt-4 space-y-5"
              onSubmit={handleUpdateCourse}
            >
              <div className="space-y-2">
                <label
                  htmlFor="edit-course-name"
                  className={FIELD_LABEL_CLASS_NAME}
                >
                  Course name
                </label>
                <Input
                  id="edit-course-name"
                  value={courseNameDraft}
                  onChange={(event) => setCourseNameDraft(event.target.value)}
                  placeholder="System design"
                  className="h-12 rounded-none border-0 border-b border-[var(--study-line-strong)] bg-transparent px-0 text-base shadow-none focus-visible:border-[var(--study-focus)] focus-visible:ring-0"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className={FIELD_LABEL_CLASS_NAME}>Course color</p>
                  <div className="inline-flex items-center gap-2 text-xs text-[var(--study-copy-muted)]">
                    <span
                      className="inline-flex size-2.5 rounded-full"
                      style={{ backgroundColor: courseColorDraft }}
                    />
                    {courseColorDraft}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {COURSE_COLOR_OPTIONS.map((option) => {
                    const isSelected = option === courseColorDraft;

                    return (
                      <button
                        key={option}
                        type="button"
                        aria-label={`Use ${option} for this course`}
                        aria-pressed={isSelected}
                        onClick={() => setCourseColorDraft(option)}
                        className="inline-flex size-8 items-center justify-center rounded-full transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--study-focus)]"
                      >
                        <span
                          className="inline-flex size-6 rounded-full ring-1 ring-black/8"
                          style={{
                            backgroundColor: option,
                            boxShadow: isSelected
                              ? '0 0 0 2px rgba(255,255,255,0.9), 0 0 0 4px color-mix(in oklch, var(--foreground) 28%, transparent)'
                              : undefined
                          }}
                        />
                      </button>
                    );
                  })}

                  <label className="relative inline-flex size-8 cursor-pointer items-center justify-center overflow-hidden rounded-full ring-1 ring-black/8 transition-transform hover:scale-105">
                    <input
                      type="color"
                      value={courseColorDraft}
                      onChange={(event) =>
                        setCourseColorDraft(event.target.value)
                      }
                      className="absolute inset-0 cursor-pointer opacity-0"
                      aria-label="Choose a custom course color"
                    />
                    <span
                      className="inline-flex size-6 rounded-full"
                      style={{
                        background: `linear-gradient(135deg, ${courseColorDraft}, color-mix(in oklch, ${courseColorDraft} 62%, white))`
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-lg border border-[var(--study-line)] bg-[var(--study-surface-soft)] px-3 py-3">
                <div className="flex items-start gap-3">
                  <span
                    className="mt-1 inline-flex size-3 shrink-0 rounded-full"
                    style={{ backgroundColor: courseColorDraft }}
                  />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--study-kicker)]">
                      Sidebar preview
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--study-ink)]">
                      {courseNameDraft.trim() || 'Your next course'}
                    </p>
                    {courseCodeDraft.trim() ? (
                      <p className="mt-1 text-[0.68rem] font-medium uppercase tracking-[0.22em] text-[var(--study-kicker)]">
                        {courseCodeDraft.trim()}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="edit-course-code"
                  className={FIELD_LABEL_CLASS_NAME}
                >
                  Course code
                </label>
                <Input
                  id="edit-course-code"
                  value={courseCodeDraft}
                  onChange={(event) => setCourseCodeDraft(event.target.value)}
                  placeholder="CS101"
                  maxLength={30}
                  className="h-12 rounded-none border-0 border-b border-[var(--study-line)] bg-transparent px-0 text-base shadow-none focus-visible:border-[var(--study-focus)] focus-visible:ring-0"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="edit-course-description"
                  className={FIELD_LABEL_CLASS_NAME}
                >
                  Description
                </label>
                <textarea
                  id="edit-course-description"
                  value={courseDescriptionDraft}
                  onChange={(event) =>
                    setCourseDescriptionDraft(event.target.value)
                  }
                  placeholder="What does this course cover?"
                  maxLength={10000}
                  className="min-h-24 w-full rounded-2xl border border-[var(--study-line)] bg-[var(--study-surface-soft)] px-4 py-3 text-sm leading-6 text-[var(--study-ink)] outline-none transition-colors placeholder:text-[var(--study-copy-muted)] focus-visible:border-[var(--study-focus)]"
                />
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-[var(--study-line)] pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-full px-0 text-[var(--study-copy-muted)] hover:bg-transparent hover:text-[var(--study-ink-strong)]"
                  onClick={() => setIsCourseEditorOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-full px-4 text-white"
                  style={{ backgroundColor: courseColorDraft }}
                  disabled={
                    updateCourseMutation.isPending ||
                    !courseNameDraft.trim() ||
                    !hasCourseChanges
                  }
                >
                  {updateCourseMutation.isPending ? 'Saving' : 'Save changes'}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(taskEditor)}
        onOpenChange={(open) => {
          if (!open) {
            updateTaskMutation.reset();
            setTaskEditor(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Task details
            </DialogTitle>
            <DialogDescription>
              Review the full task context and update any field here.
            </DialogDescription>
          </DialogHeader>
          <form
            id="edit-task-form"
            className="space-y-5"
            onSubmit={handleUpdateTask}
          >
            <TaskFields
              values={taskEditor?.values ?? createEmptyTaskForm()}
              onChange={updateTaskEditorField}
            />
            {updateTaskMutation.error ? (
              <p className="text-sm text-destructive">
                {getMutationErrorMessage(updateTaskMutation.error)}
              </p>
            ) : null}
            <DialogFooter className="bg-background border-none">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setTaskEditor(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="edit-task-form"
                disabled={updateTaskMutation.isPending || !hasTaskChanges}
              >
                {updateTaskMutation.isPending ? 'Saving...' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default CoursePage;
