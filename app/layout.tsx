import type { Metadata, Viewport } from 'next';
// Layout Component - Force cache reload
// Version: 1.1

import { Geist, Geist_Mono } from 'next/font/google';
import { Sidebar } from '@/components/sidebar';
import { CommandPalette } from '@/components/command-palette';
import { QuickAddLead } from '@/components/quick-add-lead';
import { ToastProvider } from '@/components/ui/toast';
import { RegisterServiceWorker } from './register-sw';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'DoveApp - Business Management',
  description:
    'Manage your field service business - clients, jobs, scheduling, and payments',
  applicationName: 'DoveApp',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DoveApp',
  },
  formatDetection: {
    telephone: false,
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#10b981', // Emerald 500 - Jobber green
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="DoveApp" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <RegisterServiceWorker />
        <ToastProvider>
          <CommandPalette />
          <QuickAddLead />
          <div className="flex h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 overflow-auto">
              {/* Jobber-style main content area */}
              <div className="min-h-full">
                <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-[1600px] mx-auto">
                  {children}
                </div>
              </div>
            </main>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
