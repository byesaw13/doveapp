import { NextRequest, NextResponse } from 'next/server';
import {
  analyzeImageForTools,
  uploadToolReferenceImage,
  getToolRecognitionResults,
  verifyToolMatch,
  getToolRecognitionStats,
  getPendingRecognitionImages,
  createInventoryCount,
} from '@/lib/db/ai-tool-recognition';
import {
  toolRecognitionSchema,
  toolImageUploadSchema,
  toolVerificationSchema,
  toolInventoryCountSchema,
} from '@/lib/validations/ai-tool-recognition';

// GET /api/ai/tool-recognition - Get recognition results and analytics
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'results':
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');
        const results = await getToolRecognitionResults(limit, offset);
        return NextResponse.json({ results });

      case 'stats':
        const days = parseInt(searchParams.get('days') || '30');
        const stats = await getToolRecognitionStats(days);
        return NextResponse.json({ stats });

      case 'pending':
        // Get images waiting for analysis
        const pending = await getPendingRecognitionImages();
        return NextResponse.json({ pending });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in AI tool recognition GET:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recognition data' },
      { status: 500 }
    );
  }
}

// POST /api/ai/tool-recognition - AI tool recognition operations
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    const body = await request.json();

    switch (action) {
      case 'analyze':
        const analysisData = toolRecognitionSchema.parse(body);
        const analysisResult = await analyzeImageForTools(analysisData);
        return NextResponse.json(analysisResult, { status: 201 });

      case 'upload_reference':
        const uploadData = toolImageUploadSchema.parse(body);
        const uploadResult = await uploadToolReferenceImage(uploadData);
        return NextResponse.json(uploadResult, { status: 201 });

      case 'verify':
        const verificationData = toolVerificationSchema.parse(body);
        const verificationResult = await verifyToolMatch(verificationData);
        return NextResponse.json(verificationResult);

      case 'inventory_count':
        const countData = toolInventoryCountSchema.parse(body);
        const countResult = await createInventoryCount(countData);
        return NextResponse.json(countResult, { status: 201 });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in AI tool recognition POST:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: (error as any).errors },
        { status: 400 }
      );
    }

    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Failed to process AI recognition request';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
