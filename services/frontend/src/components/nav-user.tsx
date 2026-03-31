import { useMemo } from 'react';

import { useNavigate } from '@tanstack/react-router';
import {
  ChevronsUpDown,
  LoaderCircle,
  LogOutIcon,
  Settings2Icon,
  ShieldCheckIcon
} from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar';
import type { AuthUser } from '@/types/auth';

type NavUserProps = {
  user: AuthUser | null;
  isLoggingOut: boolean;
  onLogout: () => void;
};

function getDisplayName(email: string | undefined) {
  if (!email) {
    return 'Study planner';
  }

  const localPart = email.split('@')[0] ?? '';
  const formatted = localPart
    .replace(/[._-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());

  return formatted || email;
}

function getInitials(email: string | undefined) {
  const displayName = getDisplayName(email);
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return initials || 'SP';
}

export function NavUser({ user, isLoggingOut, onLogout }: NavUserProps) {
  const navigate = useNavigate();
  const { isMobile } = useSidebar();

  const profile = useMemo(
    () => ({
      name: getDisplayName(user?.email),
      email: user?.email ?? 'Loading profile',
      initials: getInitials(user?.email),
      role: user?.role ?? 'student'
    }),
    [user]
  );

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <SidebarMenuButton
            asChild
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <DropdownMenuTrigger>
              <Avatar>
                <AvatarFallback>{profile.initials}</AvatarFallback>
              </Avatar>
              <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                <span className="font-display truncate text-[0.98rem] tracking-[-0.04em]">
                  {profile.name}
                </span>
                <span className="truncate text-xs text-sidebar-foreground/70">
                  {profile.email}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </DropdownMenuTrigger>
          </SidebarMenuButton>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={8}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-3 px-2 py-2.5 text-left">
                  <Avatar size="lg">
                    <AvatarFallback>{profile.initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-display truncate text-[1rem] tracking-[-0.04em] text-foreground">
                      {profile.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {profile.email}
                    </p>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem disabled>
                <ShieldCheckIcon />
                Role: {profile.role}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => void navigate({ to: '/settings' })}
              >
                <Settings2Icon />
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onLogout}
              disabled={isLoggingOut}
              variant="destructive"
            >
              {isLoggingOut ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <LogOutIcon />
              )}
              {isLoggingOut ? 'Signing out...' : 'Log out'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
