import {
  BookMarked,
  CalendarDays,
  ChartColumnBig,
  LoaderCircle,
  LogOutIcon,
  Settings2
} from 'lucide-react';

import { NavCourses } from '@/components/nav-courses';
import { NavMain } from '@/components/nav-main';
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

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  isLoggingOut: boolean;
  onLogoutRequest: () => void;
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
  isLoggingOut,
  onLogoutRequest,
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
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={onLogoutRequest}
              disabled={isLoggingOut}
              className="text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoggingOut ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <LogOutIcon />
              )}
              <span>{isLoggingOut ? 'Signing out...' : 'Log out'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
