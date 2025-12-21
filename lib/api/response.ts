export interface ApiSuccessResponse<T = any> {
  data: T;
  [key: string]: any;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

export function successResponse<T = any>(
  data: T,
  meta?: Record<string, any>
): ApiSuccessResponse<T> {
  return { data, ...meta };
}

export function errorResponse(code: string, message: string): ApiErrorResponse {
  return { error: { code, message } };
}
