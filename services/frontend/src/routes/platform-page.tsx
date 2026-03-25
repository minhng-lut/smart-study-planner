import { Link } from '@tanstack/react-router';
import type { LucideIcon } from 'lucide-react';
import { ArrowLeft, Bot, ExternalLink, FileText, Server } from 'lucide-react';

import { Button } from '@/components/ui/button';

const resources = [
  {
    icon: FileText,
    label: 'Backend Swagger',
    href: '/api/docs',
    description: 'Inspect the backend auth and health API documentation.'
  },
  {
    icon: Server,
    label: 'Backend Health',
    href: '/api/health',
    description: 'Quick check for the Express API service.'
  },
  {
    icon: Bot,
    label: 'Python Service Health',
    href: '/python/health',
    description: 'Quick check for the FastAPI microservice.'
  }
] satisfies Array<{
  icon: LucideIcon;
  label: string;
  href: string;
  description: string;
}>;

function PlatformPage() {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-16">
      <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-8 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.24)]">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">
          Platform
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
          Router, query, and shared state are now part of the frontend foundation.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          This route exists to prove TanStack Router is active beyond a single page and
          to keep developer-facing links close to the new app shell.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {resources.map((resource) => (
            <a
              key={resource.label}
              href={resource.href}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition-colors hover:border-slate-300 hover:bg-white"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
                    <resource.icon className="size-5" />
                  </div>
                  <span className="text-sm font-semibold text-slate-900">
                    {resource.label}
                  </span>
                </div>
                <ExternalLink className="size-4 text-slate-500" />
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{resource.description}</p>
            </a>
          ))}
        </div>
        <div className="mt-8">
          <Button asChild variant="outline" size="lg">
            <Link to="/">
              <ArrowLeft className="size-4" />
              Back to dashboard
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export default PlatformPage;
