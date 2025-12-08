import { supabase } from '@/lib/supabase';
import type { AIEstimateRequest } from '@/types/estimate';

export interface HistoricalPricingData {
  avgLaborRate: number;
  avgMaterialMarkup: number;
  avgProfitMargin: number;
  avgOverhead: number;
  similarJobs: SimilarJob[];
  totalEstimates: number;
  totalJobs: number;
  confidence: number; // 0-1 based on data availability
}

export interface SimilarJob {
  id: string;
  title: string;
  description: string;
  serviceType: string;
  laborHours: number;
  laborCost: number;
  materialsCost: number;
  total: number;
  createdAt: string;
  similarity: number; // 0-1 similarity score
}

/**
 * Analyze historical estimates and jobs to learn pricing patterns
 */
export async function analyzeHistoricalPricing(
  request: AIEstimateRequest
): Promise<HistoricalPricingData> {
  // Fetch recent estimates (last 12 months)
  const { data: estimates, error: estimatesError } = await supabase
    .from('estimates')
    .select('*')
    .gte(
      'created_at',
      new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
    )
    .order('created_at', { ascending: false })
    .limit(100);

  // Fetch completed jobs with line items (last 12 months)
  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('*, job_line_items(*)')
    .in('status', ['completed', 'invoiced'])
    .gte(
      'created_at',
      new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
    )
    .order('created_at', { ascending: false })
    .limit(100);

  if (estimatesError || jobsError) {
    console.error('Error fetching historical data:', {
      estimatesError,
      jobsError,
    });
    return getDefaultPricingData();
  }

  // Calculate metrics from historical data
  const laborRates: number[] = [];
  const materialMarkups: number[] = [];
  const profitMargins: number[] = [];
  const overheads: number[] = [];

  // Analyze estimates
  (estimates || []).forEach((estimate) => {
    const lineItems = Array.isArray(estimate.line_items)
      ? estimate.line_items
      : [];

    lineItems.forEach((item: any) => {
      // Extract labor rates
      if (
        item.description?.toLowerCase().includes('labor') ||
        item.unit === 'hour'
      ) {
        laborRates.push(item.unit_price || 0);
      }

      // Detect profit/overhead line items
      if (item.description?.toLowerCase().includes('profit')) {
        const margin = (item.total / estimate.subtotal) * 100;
        profitMargins.push(margin);
      }

      if (item.description?.toLowerCase().includes('overhead')) {
        const overhead = (item.total / estimate.subtotal) * 100;
        overheads.push(overhead);
      }
    });
  });

  // Analyze completed jobs
  (jobs || []).forEach((job: any) => {
    const lineItems = job.job_line_items || [];
    let totalLabor = 0;
    let totalLaborHours = 0;

    lineItems.forEach((item: any) => {
      if (item.item_type === 'labor') {
        totalLabor += item.total || 0;
        totalLaborHours += item.quantity || 0;
      }
    });

    if (totalLaborHours > 0) {
      laborRates.push(totalLabor / totalLaborHours);
    }
  });

  // Find similar jobs based on description similarity
  const similarJobs = findSimilarJobs(request, [
    ...(estimates || []),
    ...(jobs || []),
  ]);

  // Calculate averages
  const avgLaborRate =
    laborRates.length > 0
      ? laborRates.reduce((a, b) => a + b, 0) / laborRates.length
      : 65; // fallback

  const avgMaterialMarkup =
    materialMarkups.length > 0
      ? materialMarkups.reduce((a, b) => a + b, 0) / materialMarkups.length
      : 15; // fallback

  const avgProfitMargin =
    profitMargins.length > 0
      ? profitMargins.reduce((a, b) => a + b, 0) / profitMargins.length
      : 20; // fallback

  const avgOverhead =
    overheads.length > 0
      ? overheads.reduce((a, b) => a + b, 0) / overheads.length
      : 12; // fallback

  // Calculate confidence based on data availability
  const totalDataPoints = (estimates?.length || 0) + (jobs?.length || 0);
  const confidence = Math.min(totalDataPoints / 50, 1.0); // 100% confidence at 50+ records

  return {
    avgLaborRate: Math.round(avgLaborRate * 100) / 100,
    avgMaterialMarkup: Math.round(avgMaterialMarkup * 100) / 100,
    avgProfitMargin: Math.round(avgProfitMargin * 100) / 100,
    avgOverhead: Math.round(avgOverhead * 100) / 100,
    similarJobs,
    totalEstimates: estimates?.length || 0,
    totalJobs: jobs?.length || 0,
    confidence: Math.round(confidence * 100) / 100,
  };
}

/**
 * Find similar jobs/estimates based on description and service type
 */
function findSimilarJobs(
  request: AIEstimateRequest,
  records: any[]
): SimilarJob[] {
  const requestWords = tokenize(request.description);

  const scoredRecords = records
    .map((record) => {
      const description = record.description || record.title || '';
      const recordWords = tokenize(description);

      // Calculate similarity score (0-1)
      const commonWords = requestWords.filter((word) =>
        recordWords.includes(word)
      );
      const similarity =
        commonWords.length / Math.max(requestWords.length, recordWords.length);

      // Boost score if service types match
      const serviceTypeMatch =
        record.service_type === request.service_type ? 0.2 : 0;

      // Extract labor and materials info
      const lineItems = Array.isArray(record.line_items)
        ? record.line_items
        : record.job_line_items || [];

      let laborHours = 0;
      let laborCost = 0;
      let materialsCost = 0;

      lineItems.forEach((item: any) => {
        if (
          item.item_type === 'labor' ||
          item.description?.toLowerCase().includes('labor') ||
          item.unit === 'hour'
        ) {
          laborHours += item.quantity || 0;
          laborCost += item.total || 0;
        } else if (
          item.item_type === 'material' ||
          item.description?.toLowerCase().includes('material')
        ) {
          materialsCost += item.total || 0;
        }
      });

      return {
        id: record.id,
        title: record.title || 'Untitled',
        description: description,
        serviceType: record.service_type || 'general',
        laborHours: Math.round(laborHours * 100) / 100,
        laborCost: Math.round(laborCost * 100) / 100,
        materialsCost: Math.round(materialsCost * 100) / 100,
        total: record.total || 0,
        createdAt: record.created_at,
        similarity: Math.round((similarity + serviceTypeMatch) * 100) / 100,
      };
    })
    .filter((record) => record.similarity > 0.2) // Only include reasonably similar
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5); // Top 5 most similar

  return scoredRecords;
}

/**
 * Tokenize text for similarity matching
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter(
      (word) => word.length > 3 && !isCommonWord(word) // Filter short and common words
    );
}

/**
 * Check if word is too common to be useful for matching
 */
function isCommonWord(word: string): boolean {
  const commonWords = [
    'the',
    'and',
    'for',
    'with',
    'this',
    'that',
    'from',
    'will',
    'need',
    'have',
    'work',
    'install',
    'replace',
    'repair',
  ];
  return commonWords.includes(word);
}

/**
 * Get default pricing data when no historical data is available
 */
function getDefaultPricingData(): HistoricalPricingData {
  return {
    avgLaborRate: 65,
    avgMaterialMarkup: 15,
    avgProfitMargin: 20,
    avgOverhead: 12,
    similarJobs: [],
    totalEstimates: 0,
    totalJobs: 0,
    confidence: 0,
  };
}
