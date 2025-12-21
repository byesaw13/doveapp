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
  provider = 'openai_vision'
): Promise<any> {
  // Check if OpenAI API key is configured
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    console.warn('OpenAI API key not configured, falling back to mock data');
    return getMockVisionResponse(provider);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this image and identify any tools or equipment that appear to be construction, plumbing, electrical, or HVAC tools. For each tool you identify, provide: 1) The tool name, 2) Your confidence level (0-1), 3) A brief description, 4) Approximate location in the image. Return the results as a JSON object with a "tools" array containing objects with "name", "confidence", "description", and "location" fields.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                  detail: 'low', // Use low detail for faster processing
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.1, // Low temperature for consistent results
      }),
    });

    if (!response.ok) {
      throw new Error(
        `OpenAI API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response content from OpenAI');
    }

    // Parse the JSON response
    let parsedResponse;
    try {
      // Extract JSON from the response (it might be wrapped in markdown)
      const jsonMatch =
        content.match(/```json\s*(\{[\s\S]*?\})\s*```/) ||
        content.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
      parsedResponse = JSON.parse(jsonString);
    } catch (parseError) {
      console.warn('Failed to parse OpenAI response as JSON, using fallback');
      return getMockVisionResponse(provider);
    }

    // Transform OpenAI response to our format
    const detectedObjects =
      parsedResponse.tools?.map((tool: any) => ({
        name: tool.name,
        confidence: tool.confidence,
        description: tool.description,
        location: tool.location,
      })) || [];

    // For now, we'll create mock recognized tools since we don't have a tool matching system yet
    const recognizedTools = detectedObjects
      .filter((tool: any) => tool.confidence > 0.7) // Only high confidence matches
      .map((tool: any) => ({
        material_id: `tool-${tool.name.toLowerCase().replace(/\s+/g, '-')}`,
        confidence: tool.confidence,
        matchReason: `AI detected ${tool.name} with ${Math.round(tool.confidence * 100)}% confidence`,
        boundingBox: { x: 0, y: 0, width: 100, height: 100 }, // Placeholder
      }));

    return {
      rawResponse: {
        provider: 'openai_vision',
        timestamp: new Date().toISOString(),
        model: data.model,
        usage: data.usage,
      },
      detectedObjects,
      recognizedTools,
    };
  } catch (error) {
    console.error('OpenAI Vision API error:', error);
    // Fall back to mock data on error
    return getMockVisionResponse(provider);
  }
}

function getMockVisionResponse(provider: string) {
  return {
    rawResponse: {
      provider,
      timestamp: new Date().toISOString(),
      mock: true,
      reason: 'OpenAI API not configured or failed',
    },
    detectedObjects: [
      {
        name: 'hammer',
        confidence: 0.85,
        description: 'A claw hammer commonly used in construction',
        location: 'center left of image',
      },
    ],
    recognizedTools: [
      {
        material_id: 'mock-hammer-001',
        confidence: 0.85,
        matchReason: 'Mock AI detection - OpenAI not configured',
        boundingBox: { x: 50, y: 50, width: 100, height: 80 },
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
