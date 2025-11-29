import { NextResponse } from 'next/server';
import { getInventorySummary, getStockAlerts } from '@/lib/db/materials';

// GET /api/materials/analytics/summary - Get inventory summary
export async function GET() {
  try {
    const [summary, alerts] = await Promise.all([
      getInventorySummary(),
      getStockAlerts(),
    ]);

    return NextResponse.json({
      summary,
      alerts,
      alert_count: alerts.length,
      critical_alerts: alerts.filter((a) => a.severity === 'critical').length,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
