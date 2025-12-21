// Seed routes to crawl for link auditing
export const routes = [
  '/',
  '/auth/login',
  '/admin/dashboard',
  '/tech',
  '/tech/jobs',
  '/portal/home',
  '/portal/upcoming',
  '/admin/settings',
  // Legacy redirects (should work via Next.js redirects)
  '/admin', // redirects to /admin/dashboard
  '/login', // redirects to /auth/login
  '/settings', // redirects to /admin/settings
  // Add more routes as needed
];
