'use client';

import { useTheme } from '@/lib/theme-context';

export function ThemeDebug() {
  const { theme, resolvedTheme } = useTheme();

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-sm font-mono z-50">
      <div>Theme: {theme}</div>
      <div>Resolved: {resolvedTheme}</div>
      <div>
        HTML Classes:{' '}
        {typeof window !== 'undefined'
          ? document.documentElement.className
          : 'N/A'}
      </div>
    </div>
  );
}
