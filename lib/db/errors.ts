export interface DatabaseError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

export function normalizeDatabaseError(error: any): DatabaseError {
  if (error?.message) {
    return {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    };
  }
  return { message: 'Unknown database error' };
}
