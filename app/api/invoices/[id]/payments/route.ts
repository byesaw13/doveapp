import { NextRequest } from 'next/server';
import { addPayment } from '@/lib/db/invoices';
import { validateRequest, addInvoicePaymentSchema } from '@/lib/api/validation';
import {
  errorResponse,
  successResponse,
  validationErrorResponse,
  rateLimitResponse,
} from '@/lib/api-helpers';
import {
  checkRateLimit,
  RATE_LIMITS,
  getRateLimitHeaders,
} from '@/lib/rate-limit';
import { PerformanceLogger } from '@/lib/api/performance';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const url = new URL(request.url);
  const perfLogger = new PerformanceLogger(url.pathname, request.method);

  try {
    const { id: invoiceId } = await params;

    if (!invoiceId) {
      const errorResp = validationErrorResponse('Invoice ID is required');
      perfLogger.complete(errorResp.status);
      return errorResp;
    }

    // Apply rate limiting (strict for payment operations)
    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const rateLimit = checkRateLimit(`payment:${ip}`, RATE_LIMITS.API_STRICT);

    if (!rateLimit.allowed) {
      const rateLimitResp = rateLimitResponse(
        Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
      );
      perfLogger.complete(rateLimitResp.status);
      return rateLimitResp;
    }

    // Validate request body
    const { data, error } = await validateRequest(
      request,
      addInvoicePaymentSchema
    );
    if (error) {
      perfLogger.complete(error.status);
      return error;
    }

    perfLogger.incrementQueryCount(); // Track database query
    const updatedInvoice = await addPayment(invoiceId, data!);

    // Add rate limit headers to successful response
    const response = successResponse(updatedInvoice);
    const headers = getRateLimitHeaders(rateLimit.remaining, rateLimit.resetAt);

    // Add performance headers
    const metrics = perfLogger.complete(response.status);
    headers['X-Response-Time'] = `${metrics.duration}ms`;
    if (metrics.queryCount) {
      headers['X-Query-Count'] = metrics.queryCount.toString();
    }

    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    perfLogger.complete(500);
    return errorResponse(error, 'Failed to record payment');
  }
}
