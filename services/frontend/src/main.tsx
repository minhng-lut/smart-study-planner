import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { Toaster } from 'sonner';

import './index.css';
import { TooltipProvider } from './components/ui/tooltip';
import { queryClient } from './lib/query-client';
import { router } from './router';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <RouterProvider router={router} />
        <Toaster
          position="top-right"
          theme="light"
          richColors
          closeButton
          toastOptions={{
            classNames: {
              toast:
                'border border-[var(--study-line)] bg-[var(--study-popover-surface)] text-[var(--study-ink)] shadow-[var(--study-popover-shadow)]',
              title: 'font-medium text-[var(--study-ink)]',
              description: 'text-[var(--study-copy-muted)]',
              actionButton: 'bg-[var(--study-ink)] text-white',
              cancelButton:
                'bg-[var(--study-surface-soft)] text-[var(--study-ink)]'
            }
          }}
        />
      </TooltipProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
