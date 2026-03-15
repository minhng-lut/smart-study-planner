import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

function App() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-950">
      <section className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-2xl rounded-3xl border border-slate-200/80 bg-white/90 p-10 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.35)] backdrop-blur">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">
            Frontend running
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" className="px-4">
              Explore UI
              <ArrowRight className="size-4" />
            </Button>
            <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-600">
              base-nova theme
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
