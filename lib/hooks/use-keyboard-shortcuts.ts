'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if no input/textarea is focused
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Ctrl/Cmd + key combinations
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'n':
            event.preventDefault();
            // New item - context dependent
            if (window.location.pathname.includes('/jobs')) {
              router.push('/jobs/new');
            } else if (window.location.pathname.includes('/clients')) {
              // Could trigger new client modal
            } else if (window.location.pathname.includes('/estimates')) {
              router.push('/estimates');
            }
            break;
          case 'k':
            event.preventDefault();
            // Focus search/command palette if exists
            break;
          case '/':
            event.preventDefault();
            // Focus search input
            const searchInput = document.querySelector(
              'input[type="search"], input[placeholder*="search" i]'
            ) as HTMLInputElement;
            if (searchInput) {
              searchInput.focus();
            }
            break;
        }
      }

      // Alt + key for navigation (existing)
      if (event.altKey) {
        switch (event.key.toLowerCase()) {
          case 'd':
            event.preventDefault();
            router.push('/dashboard');
            break;
          case 'k':
            event.preventDefault();
            router.push('/kpi');
            break;
          case 'j':
            event.preventDefault();
            router.push('/jobs');
            break;
          case 'c':
            event.preventDefault();
            router.push('/clients');
            break;
          case 'e':
            event.preventDefault();
            router.push('/estimates');
            break;
          case 'i':
            event.preventDefault();
            router.push('/invoices');
            break;
          case 't':
            event.preventDefault();
            router.push('/time-tracking');
            break;
        }
      }

      // Escape key
      if (event.key === 'Escape') {
        // Close modals, clear selections, etc.
        // Could be enhanced per page
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [router]);
}
