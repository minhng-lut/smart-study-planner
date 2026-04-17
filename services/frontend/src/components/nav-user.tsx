import { useMemo, useState } from 'react';

import { useNavigate } from '@tanstack/react-router';
import {
  LoaderCircle,
  LogOutIcon,
  Settings2Icon,
  ShieldCheckIcon
} from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { AuthUser } from '@/types/auth';

type NavUserProps = {
  user: AuthUser | null;
  isLoggingOut: boolean;
  onLogoutRequest: () => void;
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

export function NavUser({ user, isLoggingOut, onLogoutRequest }: NavUserProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

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
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'icon-lg' }),
            'rounded-full border border-[var(--study-line)] bg-white/72 text-[var(--study-ink)] shadow-[0_10px_30px_-18px_rgba(15,23,42,0.45)] backdrop-blur-sm hover:bg-white focus-visible:ring-[var(--study-focus)]'
          )}
          aria-label="Open account popover"
        >
          <Avatar>
            <AvatarFallback>{profile.initials}</AvatarFallback>
          </Avatar>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={10}
        className="w-72 gap-0 rounded-[1.4rem] border border-[var(--study-line)] bg-[var(--study-popover-surface)] p-2 shadow-[var(--study-popover-shadow)]"
      >
        <div className="rounded-[1rem] px-3 py-3">
          <div className="flex items-center gap-3 text-left">
            <Avatar size="lg">
              <AvatarFallback>{profile.initials}</AvatarFallback>
            </Avatar>
            <PopoverHeader className="min-w-0 flex-1 gap-0.5">
              <PopoverTitle className="font-display truncate text-[1rem] tracking-[-0.04em] text-[var(--study-ink-strong)]">
                {profile.name}
              </PopoverTitle>
              <PopoverDescription className="truncate text-xs text-[var(--study-copy-muted)]">
                {profile.email}
              </PopoverDescription>
            </PopoverHeader>
          </div>
        </div>
        <div className="my-1 h-px bg-[var(--study-line)]" />
        <div className="space-y-1">
          <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--study-copy-muted)]">
            <ShieldCheckIcon className="size-4" />
            <span>Role: {profile.role}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="h-10 w-full justify-start rounded-xl px-3 text-[var(--study-ink)] hover:bg-white"
            onClick={() => {
              setIsOpen(false);
              void navigate({ to: '/settings' });
            }}
          >
            <Settings2Icon />
            Settings
          </Button>
        </div>
        <div className="my-1 h-px bg-[var(--study-line)]" />
        <Button
          type="button"
          variant="ghost"
          className="h-10 w-full justify-start rounded-xl px-3 text-red-600 hover:bg-red-50 hover:text-red-600"
          onClick={() => {
            setIsOpen(false);
            onLogoutRequest();
          }}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <LogOutIcon />
          )}
          {isLoggingOut ? 'Signing out...' : 'Log out'}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
