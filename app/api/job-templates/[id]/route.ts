import { NextRequest, NextResponse } from 'next/server';
import {
  getJobTemplateById,
  updateJobTemplate,
  deleteJobTemplate,
} from '@/lib/db/jobs';
import { jobTemplateSchema } from '@/lib/validations/job';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/job-templates/[id] - Get a specific job template
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const template = await getJobTemplateById(id);

    if (!template) {
      return NextResponse.json(
        { error: 'Job template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error fetching job template:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to fetch job template';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PUT /api/job-templates/[id] - Update a job template
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validatedData = jobTemplateSchema.partial().parse(body);

    const template = await updateJobTemplate(id, validatedData);
    return NextResponse.json(template);
  } catch (error) {
    console.error('Error updating job template:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: (error as any).errors },
        { status: 400 }
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : 'Failed to update job template';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE /api/job-templates/[id] - Delete a job template
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await deleteJobTemplate(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting job template:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to delete job template';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
