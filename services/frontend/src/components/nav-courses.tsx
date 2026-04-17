import { useState, type FormEvent } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { toast } from 'sonner';
import {
  ArrowUpRight,
  BookOpenText,
  ChevronRight,
  ClipboardList,
  Dot,
  MoreHorizontal,
  PencilLine,
  Plus,
  Trash2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
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
  PopoverTitle,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  createCourse,
  deleteCourse as deleteCourseRequest,
  listCourses
} from '@/lib/courses-api';
import { deleteTask as deleteTaskRequest } from '@/lib/tasks-api';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from './ui/dropdown-menu';

type DeleteTarget =
  | { type: 'course'; courseId: number; label: string }
  | { type: 'task'; taskId: number; label: string }
  | null;

const COURSE_COLOR_OPTIONS = [
  '#4f46e5',
  '#0f766e',
  '#ca8a04',
  '#c2410c',
  '#be185d',
  '#2563eb'
] as const;

export function NavCourses() {
  const { state, toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({
    select: (state) => state.location.pathname
  });
  const coursesQuery = useQuery({
    queryKey: ['courses'],
    queryFn: listCourses
  });
  const courses = coursesQuery.data?.courses ?? [];

  const createCourseMutation = useMutation({
    mutationFn: createCourse,
    onSuccess: async ({ course }) => {
      toast.success(`Created course: ${course.name}`);
      await queryClient.invalidateQueries({ queryKey: ['courses'] });
      await navigate({
        to: '/courses/$courseId',
        params: {
          courseId: String(course.id)
        }
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Unable to create course'));
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
    onSuccess: async () => {
      toast.success('Task deleted');
      await queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Unable to delete task'));
    }
  });

  const [isCoursePopoverOpen, setIsCoursePopoverOpen] = useState(false);
  const [courseName, setCourseName] = useState('');
  const [courseColor, setCourseColor] = useState<string>(
    COURSE_COLOR_OPTIONS[0]
  );
  const [courseCode, setCourseCode] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  async function handleCreateCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedName = courseName.trim();

    if (!normalizedName) {
      return;
    }

    await createCourseMutation.mutateAsync({
      name: normalizedName,
      color: courseColor,
      code: courseCode.trim() || undefined,
      description: courseDescription.trim() || undefined
    });

    setCourseName('');
    setCourseColor(COURSE_COLOR_OPTIONS[0]);
    setCourseCode('');
    setCourseDescription('');
    setIsCoursePopoverOpen(false);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) {
      return;
    }

    if (deleteTarget.type === 'course') {
      await deleteCourseMutation.mutateAsync(deleteTarget.courseId);
    } else {
      await deleteTaskMutation.mutateAsync(deleteTarget.taskId);
    }

    setDeleteTarget(null);
  }

  function getCourseColor(color: string | null) {
    return color ?? '#4f46e5';
  }
  if (state === 'collapsed') {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Courses"
                onClick={() => toggleSidebar()}
                className="rounded-xl"
              >
                <BookOpenText />
                <span>Courses</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Courses</SidebarGroupLabel>
      <Popover
        open={isCoursePopoverOpen}
        onOpenChange={(open) => {
          setIsCoursePopoverOpen(open);
          if (!open) {
            setCourseName('');
            setCourseColor(COURSE_COLOR_OPTIONS[0]);
            setCourseCode('');
            setCourseDescription('');
          }
        }}
      >
        <SidebarGroupAction
          asChild
          aria-label="Create course"
          title="Create course"
        >
          <PopoverTrigger>
            <Plus />
          </PopoverTrigger>
        </SidebarGroupAction>
        <PopoverContent
          side="right"
          align="start"
          className="w-[22rem] rounded-xl border border-[var(--study-popover-border)] bg-[var(--study-popover-surface)] p-0 text-[var(--study-ink)] shadow-[var(--study-popover-shadow)] bg-background"
        >
          <div className="relative overflow-hidden rounded-[inherit] px-4 py-4">
            <div
              className="pointer-events-none absolute -left-6 top-3 h-16 w-16 rounded-full blur-2xl"
              style={{ backgroundColor: `${courseColor}2f` }}
            />
            <div className="relative border-b border-[var(--study-line)] pb-4">
              <p className="text-[0.68rem] font-medium uppercase tracking-[0.28em] text-[var(--study-kicker)]">
                New course
              </p>
              <PopoverTitle className="font-display mt-3 text-[1.9rem] leading-[0.92] tracking-[-0.05em] text-[var(--study-ink-strong)]">
                Start a study lane.
              </PopoverTitle>
              <p className="mt-3 max-w-[17rem] text-sm leading-6 text-[var(--study-copy-muted)]">
                Name the course, pick its color, and keep it easy to spot in the
                planner.
              </p>
            </div>

            <form onSubmit={handleCreateCourse} className="mt-4 space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="course-name"
                  className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-[var(--study-kicker)]"
                >
                  Course name
                </label>
                <Input
                  id="course-name"
                  value={courseName}
                  onChange={(event) => setCourseName(event.target.value)}
                  placeholder="System design"
                  className="h-12 rounded-none border-0 border-b border-[var(--study-line-strong)] bg-transparent px-0 text-base shadow-none focus-visible:border-[var(--study-focus)] focus-visible:ring-0"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-[var(--study-kicker)]">
                    Course color
                  </p>
                  <div className="inline-flex items-center gap-2 text-xs text-[var(--study-copy-muted)]">
                    <span
                      className="inline-flex size-2.5 rounded-full"
                      style={{ backgroundColor: courseColor }}
                    />
                    {courseColor}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {COURSE_COLOR_OPTIONS.map((option) => {
                    const isSelected = option === courseColor;

                    return (
                      <button
                        key={option}
                        type="button"
                        aria-label={`Use ${option} for this course`}
                        aria-pressed={isSelected}
                        onClick={() => setCourseColor(option)}
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
                      value={courseColor}
                      onChange={(event) => setCourseColor(event.target.value)}
                      className="absolute inset-0 cursor-pointer opacity-0"
                      aria-label="Choose a custom course color"
                    />
                    <span
                      className="inline-flex size-6 rounded-full"
                      style={{
                        background: `linear-gradient(135deg, ${courseColor}, color-mix(in oklch, ${courseColor} 62%, white))`
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-lg border border-[var(--study-line)] bg-[var(--study-surface-soft)] px-3 py-3">
                <div className="flex items-start gap-3">
                  <span
                    className="mt-1 inline-flex size-3 shrink-0 rounded-full"
                    style={{ backgroundColor: courseColor }}
                  />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--study-kicker)]">
                      Sidebar preview
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--study-ink)]">
                      {courseName.trim() || 'Your next course'}
                    </p>
                    {courseCode.trim() ? (
                      <p className="mt-1 text-[0.68rem] font-medium uppercase tracking-[0.22em] text-[var(--study-kicker)]">
                        {courseCode.trim()}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="course-code"
                  className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-[var(--study-kicker)]"
                >
                  Course code
                </label>
                <Input
                  id="course-code"
                  value={courseCode}
                  onChange={(event) => setCourseCode(event.target.value)}
                  placeholder="CS101"
                  maxLength={30}
                  className="h-12 rounded-none border-0 border-b border-[var(--study-line)] bg-transparent px-0 text-base shadow-none focus-visible:border-[var(--study-focus)] focus-visible:ring-0"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="course-description"
                  className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-[var(--study-kicker)]"
                >
                  Description
                </label>
                <textarea
                  id="course-description"
                  value={courseDescription}
                  onChange={(event) => setCourseDescription(event.target.value)}
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
                  onClick={() => {
                    setCourseName('');
                    setCourseColor(COURSE_COLOR_OPTIONS[0]);
                    setCourseCode('');
                    setCourseDescription('');
                    setIsCoursePopoverOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-full px-4 text-white"
                  style={{ backgroundColor: courseColor }}
                >
                  Add course
                </Button>
              </div>
            </form>
          </div>
        </PopoverContent>
      </Popover>

      <SidebarGroupContent>
        {courses.length === 0 ? (
          <div className="rounded-[1.2rem] border border-dashed border-sidebar-border/80 bg-sidebar-accent/20 px-3 py-4 text-sm leading-6 text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
            Add your first course here, then create tasks inside it as your plan
            takes shape.
          </div>
        ) : null}

        <SidebarMenu>
          {courses.map((course) => (
            <Collapsible key={course.name}>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={
                    pathname === `/courses/${course.id}` ||
                    pathname.startsWith(`/courses/${course.id}/`)
                  }
                >
                  <Link
                    to="/courses/$courseId"
                    params={{ courseId: String(course.id) }}
                  >
                    <Dot
                      className="rounded-full"
                      style={{
                        backgroundColor: getCourseColor(course.color),
                        color: getCourseColor(course.color)
                      }}
                    />
                    <span>{course.name}</span>
                  </Link>
                </SidebarMenuButton>
                <CollapsibleTrigger asChild>
                  <SidebarMenuAction
                    className="left-2 bg-sidebar-accent text-sidebar-accent-foreground data-[state=open]:rotate-90"
                    showOnHover
                  >
                    <ChevronRight />
                  </SidebarMenuAction>
                </CollapsibleTrigger>
                <DropdownMenu>
                  <SidebarMenuAction showOnHover>
                    <DropdownMenuTrigger asChild>
                      <MoreHorizontal />
                    </DropdownMenuTrigger>
                  </SidebarMenuAction>
                  <DropdownMenuContent
                    className="w-56 rounded-lg"
                    side={'right'}
                    align={'start'}
                  >
                    <DropdownMenuItem
                      onClick={() =>
                        void navigate({
                          to: '/courses/$courseId',
                          params: { courseId: String(course.id) }
                        })
                      }
                    >
                      <PencilLine className="text-muted-foreground" />
                      <span>Edit course</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <ArrowUpRight className="text-muted-foreground" />
                      <span>Open in New Tab</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() =>
                        setDeleteTarget({
                          type: 'course',
                          courseId: course.id,
                          label: course.name
                        })
                      }
                    >
                      <Trash2 className="text-muted-foreground" />
                      <span>Delete course</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {course.tasks.length > 0 ? (
                      course.tasks.map((task) => (
                        <SidebarMenuSubItem key={task.id}>
                          <SidebarMenuSubButton asChild>
                            <a href="#">
                              <ClipboardList className="text-sidebar-foreground/55" />
                              <span>{task.title}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))
                    ) : (
                      <SidebarMenuSubItem>
                        <div className="rounded-md px-2 py-1.5 text-xs leading-5 text-sidebar-foreground/60">
                          No tasks yet.
                        </div>
                      </SidebarMenuSubItem>
                    )}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ))}

          {courses.length > 10 ? (
            <SidebarMenuItem>
              <SidebarMenuButton className="text-sidebar-foreground/70">
                <MoreHorizontal />
                <span>More</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : null}
        </SidebarMenu>
      </SidebarGroupContent>

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
                ? `This will remove "${deleteTarget.label}" and all tasks inside it.`
                : `This will remove "${deleteTarget?.label}" from the course.`}
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
    </SidebarGroup>
  );
}
