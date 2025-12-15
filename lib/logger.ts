interface LogContext {
  route?: string;
  userId?: string;
  role?: string;
  requestId?: string;
}

export function logInfo(message: string, context?: LogContext) {
  console.log(
    JSON.stringify({
      level: 'info',
      message,
      ...context,
      timestamp: new Date().toISOString(),
    })
  );
}

export function logError(message: string, error?: Error, context?: LogContext) {
  console.error(
    JSON.stringify({
      level: 'error',
      message,
      error: error?.message,
      stack: error?.stack,
      ...context,
      timestamp: new Date().toISOString(),
    })
  );
}

export async function logActivity(
  supabase: any,
  actorUserId: string,
  actorRole: string,
  entityType: string,
  entityId: string,
  action: string,
  meta?: Record<string, any>
) {
  await supabase.from('activity_log').insert({
    actor_user_id: actorUserId,
    actor_role: actorRole,
    entity_type: entityType,
    entity_id: entityId,
    action,
    meta_json: meta || {},
  });
}
