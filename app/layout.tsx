import type { Metadata, Viewport } from 'next';
// Layout Component - Force cache reload
// Version: 1.1

import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from '@/lib/theme-context';
import { RegisterServiceWorker } from './register-sw';
// import { Analytics } from '@vercel/analytics/react';
// import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';
import { SWRConfig } from 'swr';
import { KeyboardShortcuts } from '@/components/KeyboardShortcuts';
import { SkipLink } from '@/components/ui/skip-link';
import { ErrorBoundary } from '@/components/ui/error-boundary';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'DoveApp - Field Service Management Platform',
    template: '%s | DoveApp',
  },
  description:
    'Professional field service management platform for contractors, technicians, and service businesses. Manage jobs, clients, scheduling, estimates, and payments all in one place.',
  keywords: [
    'field service management',
    'contractor software',
    'job management',
    'service scheduling',
    'client management',
    'work order management',
    'technician management',
    'service business software',
    'field service app',
    'maintenance management',
  ],
  authors: [{ name: 'DoveApp Team' }],
  creator: 'DoveApp',
  publisher: 'DoveApp',
  applicationName: 'DoveApp',
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  metadataBase: new URL('https://doveapp.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://doveapp.com',
    title: 'DoveApp - Field Service Management Platform',
    description:
      'Professional field service management for contractors and service businesses. Manage jobs, clients, scheduling, and payments.',
    siteName: 'DoveApp',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'DoveApp - Field Service Management',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DoveApp - Field Service Management Platform',
    description:
      'Professional field service management for contractors and service businesses.',
    images: ['/og-image.png'],
    creator: '@doveapp',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DoveApp',
    startupImage: [
      {
        url: '/apple-startup.png',
        media: '(device-width: 768px) and (device-height: 1024px)',
      },
    ],
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
    shortcut: '/favicon.ico',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'DoveApp',
    'msapplication-TileColor': '#0066cc',
    'msapplication-config': '/browserconfig.xml',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#0066cc', // Housecall Pro blue
};

// Structured data for SEO
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'DoveApp',
  description:
    'Professional field service management platform for contractors, technicians, and service businesses',
  url: 'https://doveapp.com',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web Browser',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  featureList: [
    'Job Management',
    'Client Management',
    'Scheduling',
    'Estimates & Quotes',
    'Payment Processing',
    'Technician Management',
    'Mobile Access',
    'Reporting & Analytics',
  ],
  screenshot: 'https://doveapp.com/screenshot.png',
  author: {
    '@type': 'Organization',
    name: 'DoveApp',
  },
  publisher: {
    '@type': 'Organization',
    name: 'DoveApp',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <ThemeProvider>
          <SWRConfig
            value={{
              revalidateOnFocus: false,
              revalidateOnReconnect: true,
              dedupingInterval: 5000,
            }}
          >
            <SkipLink />
            <KeyboardShortcuts />
            <ErrorBoundary>
              <main id="main-content">{children}</main>
            </ErrorBoundary>
          </SWRConfig>
        </ThemeProvider>
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
