import { createClient } from '@/lib/supabase-server';

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'VIEW'
  | 'LOGIN'
  | 'LOGOUT'
  | 'EXPORT'
  | 'IMPORT'
  | 'APPROVE'
  | 'DECLINE';

export type AuditResource =
  | 'CLIENT'
  | 'JOB'
  | 'ESTIMATE'
  | 'INVOICE'
  | 'LEAD'
  | 'USER'
  | 'ACCOUNT'
  | 'SETTING';

export interface AuditLogEntry {
  user_id: string;
  account_id?: string;
  action: AuditAction;
  resource: AuditResource;
  resource_id?: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Log an audit event
 * This creates a permanent record of sensitive operations for compliance and security
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = createClient();

    const auditEntry = {
      ...entry,
      created_at: new Date().toISOString(),
    };

    // Store in audit_logs table (needs migration)
    // For now, just log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Audit Log:', auditEntry);
    }

    // In production, insert into database:
    // await supabase.from('audit_logs').insert(auditEntry);
  } catch (error) {
    // CRITICAL: Never fail the main operation if audit logging fails
    // Just log the error
    console.error('Failed to log audit event:', error);
  }
}

/**
 * Log a successful login
 */
export async function logLogin(
  userId: string,
  accountId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    user_id: userId,
    account_id: accountId,
    action: 'LOGIN',
    resource: 'USER',
    resource_id: userId,
    ip_address: ipAddress,
    user_agent: userAgent,
  });
}

/**
 * Log data access for sensitive resources
 */
export async function logDataAccess(
  userId: string,
  accountId: string,
  resource: AuditResource,
  resourceId: string
): Promise<void> {
  await logAuditEvent({
    user_id: userId,
    account_id: accountId,
    action: 'VIEW',
    resource,
    resource_id: resourceId,
  });
}

/**
 * Log data modification
 */
export async function logDataModification(
  userId: string,
  accountId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  resource: AuditResource,
  resourceId: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    user_id: userId,
    account_id: accountId,
    action,
    resource,
    resource_id: resourceId,
    metadata,
  });
}
