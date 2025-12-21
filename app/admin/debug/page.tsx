import {
  createAuthClient,
  getCurrentAccountContext,
} from '@/lib/supabase-auth';
import Link from 'next/link';
import { DesignTokensShowcase } from '@/components/design-tokens/DesignTokensShowcase';

export default async function DebugPage() {
  const supabase = await createAuthClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Debug: Not Authenticated</h1>
        <p>Please log in first.</p>
        <a href="/auth/login" className="text-blue-500 underline">
          Go to Login
        </a>
      </div>
    );
  }

  // Get account context
  const context = await getCurrentAccountContext();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Information</h1>

      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold">User Info:</h2>
          <p>ID: {user.id}</p>
          <p>Email: {user.email}</p>
        </div>

        <div className="bg-blue-100 p-4 rounded">
          <h2 className="font-semibold">Account Context:</h2>
          {context ? (
            <div>
              <p>Account ID: {context.accountId}</p>
              <p>Role: {context.role}</p>
              <p>Account Name: {context.account.name}</p>
              <p>User Name: {context.user.full_name || context.user.email}</p>
            </div>
          ) : (
            <p>No account context found!</p>
          )}
        </div>

        <div className="bg-green-100 p-4 rounded">
          <h2 className="font-semibold">Role Check:</h2>
          {context && (context.role === 'OWNER' || context.role === 'ADMIN') ? (
            <p className="text-green-700">✅ Has admin access</p>
          ) : (
            <p className="text-red-700">❌ No admin access</p>
          )}
        </div>

        <div className="space-x-4">
          <a
            href="/admin/dashboard"
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Go to Admin Dashboard
          </a>
          <a
            href="/admin/team"
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Go to Team Management
          </a>
          <Link href="/" className="bg-gray-500 text-white px-4 py-2 rounded">
            Go to Main Dashboard
          </Link>
        </div>

        <DesignTokensShowcase />
      </div>
    </div>
  );
}
