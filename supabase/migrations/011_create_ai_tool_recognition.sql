-- AI Tool Recognition System
-- Extends tool tracking with AI-powered image recognition

-- Create tool_images table for storing reference images of tools
CREATE TABLE tool_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL, -- URL to stored image
  image_filename TEXT NOT NULL,
  image_hash TEXT UNIQUE, -- For duplicate detection
  image_metadata JSONB, -- AI analysis results, dimensions, etc.
  is_primary BOOLEAN NOT NULL DEFAULT false, -- Main reference image
  uploaded_by UUID,
  uploaded_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tool_recognition_results table for AI analysis results
CREATE TABLE tool_recognition_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL, -- URL of analyzed image
  image_hash TEXT, -- For duplicate analysis prevention
  analysis_provider TEXT NOT NULL DEFAULT 'google_vision', -- google_vision, aws_rekognition, etc.
  analysis_version TEXT, -- Version of AI model used
  raw_response JSONB, -- Full AI service response
  detected_objects JSONB, -- Array of detected objects with confidence scores
  recognized_tools JSONB, -- Matched tools with confidence scores
  processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_error TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tool_recognition_matches table for linking recognition to inventory
CREATE TABLE tool_recognition_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recognition_result_id UUID REFERENCES tool_recognition_results(id) ON DELETE CASCADE,
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
  confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  bounding_box JSONB, -- Coordinates of detected object in image
  match_reason TEXT, -- Why this tool was matched
  verified_by_user BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tool_inventory_counts table for photo-based inventory counting
CREATE TABLE tool_inventory_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location TEXT NOT NULL, -- Storage location being counted
  counted_by UUID,
  counted_by_name TEXT,
  photo_url TEXT, -- Photo used for counting
  recognition_result_id UUID REFERENCES tool_recognition_results(id),
  counted_tools JSONB, -- Array of {material_id, count, confidence}
  manual_overrides JSONB, -- Manual corrections to AI counts
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'verified', 'applied')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX idx_tool_images_material_id ON tool_images(material_id);
CREATE INDEX idx_tool_images_is_primary ON tool_images(material_id, is_primary);
CREATE INDEX idx_tool_recognition_results_image_hash ON tool_recognition_results(image_hash);
CREATE INDEX idx_tool_recognition_results_status ON tool_recognition_results(processing_status);
CREATE INDEX idx_tool_recognition_matches_recognition_result_id ON tool_recognition_matches(recognition_result_id);
CREATE INDEX idx_tool_recognition_matches_material_id ON tool_recognition_matches(material_id);
CREATE INDEX idx_tool_recognition_matches_confidence ON tool_recognition_matches(confidence_score DESC);
CREATE INDEX idx_tool_inventory_counts_location ON tool_inventory_counts(location);
CREATE INDEX idx_tool_inventory_counts_status ON tool_inventory_counts(status);

-- Create function to automatically update tool recognition matches
CREATE OR REPLACE FUNCTION process_tool_recognition_matches()
RETURNS TRIGGER AS $$
BEGIN
  -- This function would be called after AI analysis to create matches
  -- For now, it's a placeholder for the matching logic
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for processing recognition results
CREATE TRIGGER trigger_process_tool_recognition_matches
    AFTER INSERT ON tool_recognition_results
    FOR EACH ROW
    WHEN (NEW.processing_status = 'completed')
    EXECUTE FUNCTION process_tool_recognition_matches();

-- Create view for tool recognition summary
CREATE VIEW tool_recognition_summary AS
SELECT
  trr.id as recognition_id,
  trr.image_url,
  trr.processing_status,
  trr.processed_at,
  COUNT(trm.id) as total_matches,
  COUNT(CASE WHEN trm.confidence_score >= 0.8 THEN 1 END) as high_confidence_matches,
  COUNT(CASE WHEN trm.verified_by_user = true THEN 1 END) as verified_matches,
  json_agg(
    json_build_object(
      'material_id', trm.material_id,
      'material_name', m.name,
      'confidence_score', trm.confidence_score,
      'verified', trm.verified_by_user
    )
  ) FILTER (WHERE trm.id IS NOT NULL) as matched_tools
FROM tool_recognition_results trr
LEFT JOIN tool_recognition_matches trm ON trr.id = trm.recognition_result_id
LEFT JOIN materials m ON trm.material_id = m.id
GROUP BY trr.id, trr.image_url, trr.processing_status, trr.processed_at;

-- Create function to get tool recognition statistics
CREATE OR REPLACE FUNCTION get_tool_recognition_stats(
  days_back INTEGER DEFAULT 30
) RETURNS TABLE (
  total_analyses bigint,
  successful_analyses bigint,
  average_matches numeric,
  high_confidence_rate numeric,
  verification_rate numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_analyses,
    COUNT(*) FILTER (WHERE processing_status = 'completed') as successful_analyses,
    ROUND(AVG(match_count), 2) as average_matches,
    ROUND(
      (COUNT(*) FILTER (WHERE high_confidence_matches > 0)::numeric /
       NULLIF(COUNT(*) FILTER (WHERE total_matches > 0), 0)) * 100, 2
    ) as high_confidence_rate,
    ROUND(
      (COUNT(*) FILTER (WHERE verified_matches > 0)::numeric /
       NULLIF(COUNT(*) FILTER (WHERE total_matches > 0), 0)) * 100, 2
    ) as verification_rate
  FROM (
    SELECT
      trr.id,
      COUNT(trm.id) as total_matches,
      COUNT(CASE WHEN trm.confidence_score >= 0.8 THEN 1 END) as high_confidence_matches,
      COUNT(CASE WHEN trm.verified_by_user = true THEN 1 END) as verified_matches
    FROM tool_recognition_results trr
    LEFT JOIN tool_recognition_matches trm ON trr.id = trm.recognition_result_id
    WHERE trr.created_at >= NOW() - INTERVAL '1 day' * days_back
    GROUP BY trr.id
  ) stats;
END;
$$ LANGUAGE plpgsql;