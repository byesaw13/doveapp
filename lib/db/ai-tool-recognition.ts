import { supabase } from '@/lib/supabase';
import type {
  ToolImage,
  ToolRecognitionResult,
  ToolRecognitionMatch,
  ToolInventoryCount,
  ToolRecognitionStats,
  ToolRecognitionAnalysis,
  ToolImageUpload,
  ToolVerification,
} from '@/types/ai-tool-recognition';

// Tool Image Management
export async function uploadToolReferenceImage(
  uploadData: ToolImageUpload
): Promise<ToolImage> {
  // First, check if image already exists (by hash to prevent duplicates)
  const { data: existing } = await supabase
    .from('tool_images')
    .select('id')
    .eq('image_hash', uploadData.image_hash)
    .single();

  if (existing) {
    throw new Error('This image has already been uploaded');
  }

  const { data, error } = await supabase
    .from('tool_images')
    .insert([
      {
        material_id: uploadData.material_id,
        image_url: uploadData.image_url,
        image_filename: uploadData.image_filename,
        image_hash: uploadData.image_hash,
        image_metadata: uploadData.image_metadata,
        is_primary: uploadData.is_primary || false,
        uploaded_by_name: uploadData.uploaded_by_name,
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to upload tool reference image: ${error.message}`);
  }

  return data;
}

export async function getToolImages(materialId?: string): Promise<ToolImage[]> {
  let query = supabase
    .from('tool_images')
    .select('*')
    .order('created_at', { ascending: false });

  if (materialId) {
    query = query.eq('material_id', materialId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch tool images: ${error.message}`);
  }

  return data || [];
}

export async function deleteToolImage(id: string): Promise<void> {
  const { error } = await supabase.from('tool_images').delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete tool image: ${error.message}`);
  }
}

// AI Analysis and Recognition
export async function analyzeImageForTools(
  analysisData: ToolRecognitionAnalysis
): Promise<ToolRecognitionResult> {
  // Check if this image has already been analyzed
  const { data: existing } = await supabase
    .from('tool_recognition_results')
    .select('id, processing_status')
    .eq('image_hash', analysisData.image_hash)
    .single();

  if (existing && existing.processing_status === 'completed') {
    // Return existing result
    return await getToolRecognitionResult(existing.id);
  }

  // Create new analysis record
  const { data: result, error } = await supabase
    .from('tool_recognition_results')
    .insert([
      {
        image_url: analysisData.image_url,
        image_hash: analysisData.image_hash,
        analysis_provider: analysisData.provider || 'google_vision',
        processing_status: 'pending',
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create recognition analysis: ${error.message}`);
  }

  // TODO: Integrate with actual AI vision service
  // For now, we'll simulate the analysis
  try {
    const aiResults = await callAIVisionService(
      analysisData.image_url,
      analysisData.provider
    );

    // Update with results
    await supabase
      .from('tool_recognition_results')
      .update({
        raw_response: aiResults.rawResponse,
        detected_objects: aiResults.detectedObjects,
        recognized_tools: aiResults.recognizedTools,
        processing_status: 'completed',
        processed_at: new Date().toISOString(),
      })
      .eq('id', result.id);

    // Create matches based on recognized tools
    if (aiResults.recognizedTools && aiResults.recognizedTools.length > 0) {
      await createToolMatches(result.id, aiResults.recognizedTools);
    }

    return await getToolRecognitionResult(result.id);
  } catch (error) {
    // Update with error
    await supabase
      .from('tool_recognition_results')
      .update({
        processing_status: 'failed',
        processing_error:
          error instanceof Error ? error.message : 'Unknown error',
        processed_at: new Date().toISOString(),
      })
      .eq('id', result.id);

    throw error;
  }
}

export async function getToolRecognitionResult(
  id: string
): Promise<ToolRecognitionResult> {
  const { data, error } = await supabase
    .from('tool_recognition_results')
    .select(
      `
      *,
      matches:tool_recognition_matches(
        id,
        material_id,
        confidence_score,
        bounding_box,
        match_reason,
        verified_by_user,
        verified_at,
        material:materials(name, category, serial_number)
      )
    `
    )
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch recognition result: ${error.message}`);
  }

  return data;
}

export async function getToolRecognitionResults(
  limit = 20,
  offset = 0
): Promise<ToolRecognitionResult[]> {
  const { data, error } = await supabase
    .from('tool_recognition_results')
    .select(
      `
      *,
      matches:tool_recognition_matches(
        id,
        material_id,
        confidence_score,
        bounding_box,
        match_reason,
        verified_by_user,
        verified_at,
        material:materials(name, category, serial_number)
      )
    `
    )
    .order('created_at', { ascending: false })
    .limit(limit)
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to fetch recognition results: ${error.message}`);
  }

  return data || [];
}

// Tool Matching and Verification
export async function createToolMatches(
  recognitionResultId: string,
  recognizedTools: any[]
): Promise<void> {
  const matches = recognizedTools.map((tool) => ({
    recognition_result_id: recognitionResultId,
    material_id: tool.material_id,
    confidence_score: tool.confidence,
    bounding_box: tool.boundingBox,
    match_reason: tool.matchReason || 'AI recognition',
  }));

  const { error } = await supabase
    .from('tool_recognition_matches')
    .insert(matches);

  if (error) {
    throw new Error(`Failed to create tool matches: ${error.message}`);
  }
}

export async function verifyToolMatch(
  verificationData: ToolVerification
): Promise<ToolRecognitionMatch> {
  const { data, error } = await supabase
    .from('tool_recognition_matches')
    .update({
      verified_by_user: true,
      verified_at: new Date().toISOString(),
    })
    .eq('id', verificationData.match_id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to verify tool match: ${error.message}`);
  }

  return data;
}

// Inventory Counting with Photos
export async function createInventoryCount(
  countData: any
): Promise<ToolInventoryCount> {
  const { data, error } = await supabase
    .from('tool_inventory_counts')
    .insert([
      {
        location: countData.location,
        counted_by_name: countData.counted_by_name,
        photo_url: countData.photo_url,
        recognition_result_id: countData.recognition_result_id,
        counted_tools: countData.counted_tools,
        notes: countData.notes,
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create inventory count: ${error.message}`);
  }

  return data;
}

export async function getInventoryCounts(
  location?: string
): Promise<ToolInventoryCount[]> {
  let query = supabase
    .from('tool_inventory_counts')
    .select('*')
    .order('created_at', { ascending: false });

  if (location) {
    query = query.eq('location', location);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch inventory counts: ${error.message}`);
  }

  return data || [];
}

// Analytics and Statistics
export async function getToolRecognitionStats(
  daysBack = 30
): Promise<ToolRecognitionStats> {
  const { data, error } = await supabase.rpc('get_tool_recognition_stats', {
    days_back: daysBack,
  });

  if (error) {
    // Fallback if RPC doesn't exist
    console.warn('RPC function not available, returning basic stats');
    return {
      total_analyses: 0,
      successful_analyses: 0,
      average_matches: 0,
      high_confidence_rate: 0,
      verification_rate: 0,
    };
  }

  return (
    data[0] || {
      total_analyses: 0,
      successful_analyses: 0,
      average_matches: 0,
      high_confidence_rate: 0,
      verification_rate: 0,
    }
  );
}

// Helper Functions
async function callAIVisionService(
  imageUrl: string,
  provider = 'google_vision'
): Promise<any> {
  // TODO: Implement actual AI vision service integration
  // For now, return mock data

  // This would typically:
  // 1. Call Google Vision API, AWS Rekognition, or similar
  // 2. Process the response to identify tools
  // 3. Match against tool database using image similarity or object detection

  return {
    rawResponse: {
      provider,
      timestamp: new Date().toISOString(),
      mock: true,
    },
    detectedObjects: [
      {
        name: 'hammer',
        confidence: 0.95,
        boundingBox: { x: 100, y: 100, width: 200, height: 150 },
      },
      {
        name: 'screwdriver',
        confidence: 0.87,
        boundingBox: { x: 350, y: 120, width: 180, height: 40 },
      },
    ],
    recognizedTools: [
      {
        material_id: 'tool-uuid-1', // Would be matched from database
        confidence: 0.95,
        matchReason: 'Visual similarity to reference image',
        boundingBox: { x: 100, y: 100, width: 200, height: 150 },
      },
    ],
  };
}

export async function getPendingRecognitionImages(): Promise<any[]> {
  // Get images that haven't been analyzed yet
  const { data, error } = await supabase
    .from('tool_recognition_results')
    .select('image_url, image_hash, created_at')
    .eq('processing_status', 'pending')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(`Failed to fetch pending images: ${error.message}`);
  }

  return data || [];
}

// Batch processing for multiple images
export async function batchAnalyzeImages(
  imageUrls: string[]
): Promise<ToolRecognitionResult[]> {
  const results: ToolRecognitionResult[] = [];

  for (const imageUrl of imageUrls) {
    try {
      const result = await analyzeImageForTools({
        image_url: imageUrl,
        image_hash: generateImageHash(imageUrl), // Simple hash for demo
        provider: 'google_vision',
      });
      results.push(result);
    } catch (error) {
      console.error(`Failed to analyze image ${imageUrl}:`, error);
      // Continue with other images
    }
  }

  return results;
}

// Utility function for generating image hash (simplified)
function generateImageHash(imageUrl: string): string {
  // In production, you'd calculate actual image hash
  return btoa(imageUrl).slice(0, 32);
}
