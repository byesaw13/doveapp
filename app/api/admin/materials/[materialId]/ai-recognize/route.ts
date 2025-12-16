import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { analyzeImageForTools } from '@/lib/db/ai-tool-recognition';

function generateSimpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ materialId: string }> }
) {
  try {
    const supabase = createClient();
    const { materialId } = await params;
    const body = await request.json();
    const { imageUrl, provider = 'openai_vision' } = body;

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate input
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Verify material exists and user has access
    const { data: material, error: materialError } = await supabase
      .from('materials')
      .select('id, name')
      .eq('id', materialId)
      .single();

    if (materialError || !material) {
      return NextResponse.json(
        { error: 'Material not found' },
        { status: 404 }
      );
    }

    // Generate a simple hash for the image URL
    const imageHash = await generateSimpleHash(imageUrl);

    // Analyze the image with AI
    const result = await analyzeImageForTools({
      image_url: imageUrl,
      image_hash: imageHash,
      provider,
    });

    return NextResponse.json({
      success: true,
      result,
      message: 'Image analysis completed successfully',
    });
  } catch (error) {
    console.error('Error in AI tool recognition:', error);
    return NextResponse.json(
      {
        error: 'Failed to analyze image',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
