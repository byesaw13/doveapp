import { NextRequest, NextResponse } from 'next/server';
import { getJobTemplates, createJobTemplate } from '@/lib/db/jobs';
import { jobTemplateSchema } from '@/lib/validations/job';

// GET /api/job-templates - Get all job templates
export async function GET() {
  try {
    const templates = await getJobTemplates();
    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching job templates:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to fetch job templates';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// POST /api/job-templates - Create a new job template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = jobTemplateSchema.parse(body);

    const template = await createJobTemplate(validatedData);
    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Error creating job template:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: (error as any).errors },
        { status: 400 }
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : 'Failed to create job template';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
