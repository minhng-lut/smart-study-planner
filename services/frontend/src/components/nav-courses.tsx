import { useState, type FormEvent } from 'react';

import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import {
  ArrowUpRight,
  BookOpenText,
  ChevronRight,
  ClipboardList,
  Dot,
  MoreHorizontal,
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
import { usePlannerStore } from '@/stores/planner-store';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from './ui/dropdown-menu';

type DeleteTarget =
  | { type: 'course'; courseId: string; label: string }
  | { type: 'task'; courseId: string; taskId: string; label: string }
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
  const pathname = useRouterState({
    select: (state) => state.location.pathname
  });
  const courses = usePlannerStore((state) => state.courses);
  const addCourse = usePlannerStore((state) => state.addCourse);
  const deleteCourse = usePlannerStore((state) => state.deleteCourse);
  const deleteTask = usePlannerStore((state) => state.deleteTask);

  const [isCoursePopoverOpen, setIsCoursePopoverOpen] = useState(false);
  const [courseName, setCourseName] = useState('');
  const [courseColor, setCourseColor] = useState<string>(
    COURSE_COLOR_OPTIONS[0]
  );
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  function handleCreateCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const createdCourse = addCourse(courseName, courseColor);

    if (!createdCourse) {
      return;
    }

    setCourseName('');
    setCourseColor(COURSE_COLOR_OPTIONS[0]);
    setIsCoursePopoverOpen(false);
    void navigate({
      to: '/courses/$courseSlug',
      params: {
        courseSlug: createdCourse.slug
      }
    });
  }

  function handleConfirmDelete() {
    if (!deleteTarget) {
      return;
    }

    if (deleteTarget.type === 'course') {
      deleteCourse(deleteTarget.courseId);
      void navigate({ to: '/' });
    } else {
      deleteTask(deleteTarget.courseId, deleteTarget.taskId);
    }

    setDeleteTarget(null);
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
          className="w-[22rem] max-h-[85vh] overflow-y-auto rounded-xl border border-[var(--study-popover-border)] bg-[var(--study-popover-surface)] p-0 text-[var(--study-ink)] shadow-[var(--study-popover-shadow)] bg-background"
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
                  </div>
                </div>
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
                    pathname === `/courses/${course.slug}` ||
                    pathname.startsWith(`/courses/${course.slug}/`)
                  }
                >
                  <Link
                    to="/courses/$courseSlug"
                    params={{ courseSlug: course.slug }}
                  >
                    <Dot
                      className="rounded-full"
                      style={{
                        backgroundColor: course.color,
                        color: course.color
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
                          to: '/courses/$courseSlug',
                          params: { courseSlug: course.slug }
                        })
                      }
                    >
                      <Plus className="text-muted-foreground" />
                      <span>Create new task</span>
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
                        <SidebarMenuSubItem key={task.title}>
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
              onClick={handleConfirmDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarGroup>
  );
}
