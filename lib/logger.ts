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
