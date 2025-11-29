import { z } from 'zod';

export const toolRecognitionSchema = z.object({
  image_url: z.string().url('Invalid image URL'),
  image_hash: z.string().optional(),
  provider: z
    .enum(['google_vision', 'aws_rekognition', 'azure_vision'])
    .default('google_vision'),
});

export const toolImageUploadSchema = z.object({
  material_id: z.string().uuid('Invalid material ID'),
  image_url: z.string().url('Invalid image URL'),
  image_filename: z.string().min(1, 'Filename is required'),
  image_hash: z.string().min(1, 'Image hash is required'),
  image_metadata: z.any().optional(),
  is_primary: z.boolean().default(false),
  uploaded_by_name: z.string().optional(),
});

export const toolVerificationSchema = z.object({
  match_id: z.string().uuid('Invalid match ID'),
  verified: z.boolean().default(true),
  notes: z.string().optional(),
});

export const toolInventoryCountSchema = z.object({
  location: z.string().min(1, 'Location is required'),
  counted_by_name: z.string().min(1, 'Counter name is required'),
  photo_url: z.string().url().optional(),
  recognition_result_id: z.string().uuid().optional(),
  counted_tools: z
    .array(
      z.object({
        material_id: z.string().uuid(),
        count: z.number().min(0),
        confidence: z.number().min(0).max(1).optional(),
      })
    )
    .optional(),
  notes: z.string().optional(),
});

export const toolMatchSchema = z.object({
  recognition_result_id: z.string().uuid(),
  material_id: z.string().uuid(),
  confidence_score: z.number().min(0).max(1),
  bounding_box: z.any().optional(),
  match_reason: z.string().optional(),
});

export const batchAnalysisSchema = z.object({
  image_urls: z.array(z.string().url()).min(1).max(10),
  provider: z
    .enum(['google_vision', 'aws_rekognition', 'azure_vision'])
    .default('google_vision'),
});

// Query/filter schemas
export const toolRecognitionQuerySchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
  provider: z.string().optional(),
  material_id: z.string().uuid().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  min_confidence: z.number().min(0).max(1).optional(),
  verified_only: z.boolean().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export type ToolRecognitionAnalysis = z.infer<typeof toolRecognitionSchema>;
export type ToolImageUpload = z.infer<typeof toolImageUploadSchema>;
export type ToolVerification = z.infer<typeof toolVerificationSchema>;
export type ToolInventoryCountData = z.infer<typeof toolInventoryCountSchema>;
export type ToolMatchData = z.infer<typeof toolMatchSchema>;
export type BatchAnalysisData = z.infer<typeof batchAnalysisSchema>;
export type ToolRecognitionQueryParams = z.infer<
  typeof toolRecognitionQuerySchema
>;
