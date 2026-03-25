import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type PlannerTask = {
  id: string;
  title: string;
};

export type PlannerCourse = {
  id: string;
  name: string;
  slug: string;
  color: string;
  tasks: PlannerTask[];
};

type PlannerStore = {
  courses: PlannerCourse[];
  addCourse: (name: string, color?: string) => PlannerCourse | null;
  addTask: (courseId: string, title: string) => void;
  deleteCourse: (courseId: string) => void;
  deleteTask: (courseId: string, taskId: string) => void;
};

const DEFAULT_COURSE_COLOR = '#4f46e5';

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function slugifyCourseName(name: string) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'course';
}

function createUniqueCourseSlug(name: string, courses: PlannerCourse[]) {
  const baseSlug = slugifyCourseName(name);
  const existingSlugs = new Set(courses.map((course) => course.slug));

  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let suffix = 2;

  while (existingSlugs.has(`${baseSlug}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseSlug}-${suffix}`;
}

export const usePlannerStore = create<PlannerStore>()(
  persist(
    (set, get) => ({
      courses: [],
      addCourse: (name: string, color = DEFAULT_COURSE_COLOR) => {
        const normalizedName = name.trim();

        if (!normalizedName) {
          return null;
        }

        const course: PlannerCourse = {
          id: createId(),
          name: normalizedName,
          slug: createUniqueCourseSlug(normalizedName, get().courses),
          color,
          tasks: []
        };

        set((state) => ({
          courses: [...state.courses, course]
        }));

        return course;
      },
      addTask: (courseId: string, title: string) => {
        const normalizedTitle = title.trim();

        if (!normalizedTitle) {
          return;
        }

        set((state) => ({
          courses: state.courses.map((course) =>
            course.id === courseId
              ? {
                  ...course,
                  tasks: [
                    ...course.tasks,
                    {
                      id: createId(),
                      title: normalizedTitle
                    }
                  ]
                }
              : course
          )
        }));
      },
      deleteCourse: (courseId: string) => {
        set((state) => ({
          courses: state.courses.filter((course) => course.id !== courseId)
        }));
      },
      deleteTask: (courseId: string, taskId: string) => {
        set((state) => ({
          courses: state.courses.map((course) =>
            course.id === courseId
              ? {
                  ...course,
                  tasks: course.tasks.filter((task) => task.id !== taskId)
                }
              : course
          )
        }));
      }
    }),
    {
      name: 'smart-study-planner-courses',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
