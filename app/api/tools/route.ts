import { NextRequest, NextResponse } from 'next/server';
import {
  getToolAvailability,
  checkoutTool,
  checkinTool,
  getToolAssignments,
  scheduleToolMaintenance,
  getToolMaintenance,
  assignToolToJob,
  getJobTools,
  returnJobTool,
  getOverdueToolReturns,
  getToolsDueForMaintenance,
} from '@/lib/db/materials';
import {
  toolCheckoutSchema,
  toolCheckinSchema,
  toolMaintenanceSchema,
} from '@/lib/validations/materials';

// GET /api/tools/availability - Get tool availability
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'availability':
        const availability = await getToolAvailability();
        return NextResponse.json({ tools: availability });

      case 'assignments':
        const status = searchParams.get('status') || undefined;
        const assigned_to = searchParams.get('assigned_to') || undefined;
        const assignments = await getToolAssignments({ status, assigned_to });
        return NextResponse.json({ assignments });

      case 'maintenance':
        const materialId = searchParams.get('material_id');
        const maintenance = await getToolMaintenance(materialId || undefined);
        return NextResponse.json({ maintenance });

      case 'overdue':
        const overdue = await getOverdueToolReturns();
        return NextResponse.json({ overdue });

      case 'maintenance_due':
        const due = await getToolsDueForMaintenance();
        return NextResponse.json({ due });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in tools API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tool data' },
      { status: 500 }
    );
  }
}

// POST /api/tools - Tool operations (checkout, maintenance, etc.)
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    const body = await request.json();

    switch (action) {
      case 'checkout':
        const checkoutData = toolCheckoutSchema.parse(body);
        const checkoutResult = await checkoutTool(checkoutData);
        return NextResponse.json(checkoutResult, { status: 201 });

      case 'checkin':
        const checkinData = toolCheckinSchema.parse(body);
        const checkinResult = await checkinTool(checkinData);
        return NextResponse.json(checkinResult);

      case 'maintenance':
        const maintenanceData = toolMaintenanceSchema.parse(body);
        const maintenanceResult =
          await scheduleToolMaintenance(maintenanceData);
        return NextResponse.json(maintenanceResult, { status: 201 });

      case 'assign_to_job':
        const { job_id, material_id, assigned_by_name } = body;
        if (!job_id || !material_id) {
          return NextResponse.json(
            { error: 'job_id and material_id are required' },
            { status: 400 }
          );
        }
        const assignmentResult = await assignToolToJob(
          job_id,
          material_id,
          assigned_by_name
        );
        return NextResponse.json(assignmentResult, { status: 201 });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in tools POST API:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to process tool operation' },
      { status: 500 }
    );
  }
}
