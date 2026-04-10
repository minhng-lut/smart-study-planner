import { BookMarked, CalendarDays, ChartColumnBig, Settings2 } from 'lucide-react';

import { NavCourses } from '@/components/nav-courses';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail
} from '@/components/ui/sidebar';
import type { AuthUser } from '@/types/auth';

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user: AuthUser | null;
  isLoggingOut: boolean;
  onLogout: () => void;
};

const mainNavigation = [
  {
    title: 'Dashboard',
    url: '/',
    icon: ChartColumnBig
  },
  {
    title: 'Calendar',
    url: '/calendar',
    icon: CalendarDays
  },
  {
    title: 'Settings',
    url: '/settings',
    icon: Settings2
  }
];

export function AppSidebar({
  user,
  isLoggingOut,
  onLogout,
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-sidebar-border/70">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <BookMarked className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="font-display truncate text-[1.02rem] tracking-[-0.04em]">
                  Smart Study Planner
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={mainNavigation} />
        <NavCourses />
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/70">
        <NavUser user={user} isLoggingOut={isLoggingOut} onLogout={onLogout} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
