'use client';

import { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ToolRecognitionResult {
  id: string;
  material_id: string;
  material_name: string;
  confidence_score: number;
  bounding_box?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  verified: boolean;
}

interface AIToolRecognitionProps {
  onToolsRecognized?: (tools: ToolRecognitionResult[]) => void;
  mode?: 'checkin' | 'inventory' | 'verification';
}

export function AIToolRecognition({
  onToolsRecognized,
  mode = 'checkin',
}: AIToolRecognitionProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<ToolRecognitionResult[]>([]);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setResults([]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = () => {
    // In a real implementation, this would open the camera
    // For now, we'll simulate with a placeholder
    alert(
      'Camera integration would open here. For demo purposes, please upload an image.'
    );
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;

    setAnalyzing(true);
    setProgress(0);

    // Simulate AI analysis progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      // Simulate API call to AI service
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock AI recognition results
      const mockResults: ToolRecognitionResult[] = [
        {
          id: '1',
          material_id: 'tool-1',
          material_name: 'Makita Cordless Drill',
          confidence_score: 0.95,
          bounding_box: { x: 100, y: 150, width: 200, height: 100 },
          verified: false,
        },
        {
          id: '2',
          material_id: 'tool-2',
          material_name: 'Stanley Hammer',
          confidence_score: 0.87,
          bounding_box: { x: 350, y: 200, width: 150, height: 80 },
          verified: false,
        },
        {
          id: '3',
          material_id: 'tool-3',
          material_name: 'Craftsman Screwdriver Set',
          confidence_score: 0.76,
          bounding_box: { x: 50, y: 300, width: 180, height: 60 },
          verified: false,
        },
      ];

      setResults(mockResults);
      setProgress(100);

      if (onToolsRecognized) {
        onToolsRecognized(mockResults);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setAnalyzing(false);
      clearInterval(progressInterval);
    }
  };

  const verifyTool = (toolId: string) => {
    setResults((prev) =>
      prev.map((tool) =>
        tool.id === toolId ? { ...tool, verified: true } : tool
      )
    );
  };

  const rejectTool = (toolId: string) => {
    setResults((prev) => prev.filter((tool) => tool.id !== toolId));
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadge = (score: number) => {
    if (score >= 0.9)
      return (
        <Badge className="bg-green-100 text-green-800">High Confidence</Badge>
      );
    if (score >= 0.7)
      return (
        <Badge className="bg-yellow-100 text-yellow-800">
          Medium Confidence
        </Badge>
      );
    return <Badge className="bg-red-100 text-red-800">Low Confidence</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold">AI Tool Recognition</h2>
        <p className="text-muted-foreground">
          {mode === 'checkin' &&
            'Take a photo of tools being returned to automatically identify them'}
          {mode === 'inventory' &&
            'Photograph your tool storage to count inventory automatically'}
          {mode === 'verification' &&
            'Verify tools are present and accounted for'}
        </p>
      </div>

      {/* Image Upload/Capture */}
      <Card>
        <CardHeader>
          <CardTitle>Step 1: Capture or Upload Image</CardTitle>
          <CardDescription>
            Take a clear photo of the tools you want to identify
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedImage ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <div className="space-y-4">
                <div className="flex justify-center space-x-4">
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Image
                  </Button>
                  <Button variant="outline" onClick={handleCameraCapture}>
                    <Camera className="w-4 h-4 mr-2" />
                    Use Camera
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Supported formats: JPG, PNG, WebP (max 10MB)
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={selectedImage}
                  alt="Selected for analysis"
                  className="w-full max-h-96 object-contain rounded-lg border"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => setSelectedImage(null)}
                >
                  Change Image
                </Button>
              </div>
              <Button
                onClick={analyzeImage}
                disabled={analyzing}
                className="w-full"
              >
                {analyzing ? 'Analyzing...' : 'Analyze Image'}
              </Button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Analysis Progress */}
      {analyzing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Analyzing image with AI...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recognition Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Review Recognition Results</CardTitle>
            <CardDescription>
              AI has identified {results.length} tool
              {results.length !== 1 ? 's' : ''}. Please verify the matches.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((tool) => (
                <div
                  key={tool.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Eye className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                      <h4 className="font-medium">{tool.material_name}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        {getConfidenceBadge(tool.confidence_score)}
                        <span
                          className={`text-sm ${getConfidenceColor(tool.confidence_score)}`}
                        >
                          {(tool.confidence_score * 100).toFixed(1)}% confidence
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {tool.verified ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => verifyTool(tool.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Verify
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rejectTool(tool.id)}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {results.some((r) => !r.verified) && (
              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Please verify or reject all tool matches before proceeding.
                </AlertDescription>
              </Alert>
            )}

            {results.every((r) => r.verified) && (
              <div className="mt-4 text-center">
                <Button className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete Tool{' '}
                  {mode === 'checkin'
                    ? 'Check-in'
                    : mode === 'inventory'
                      ? 'Inventory Count'
                      : 'Verification'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Tips for Best Results</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Ensure good lighting and clear focus</li>
            <li>• Photograph tools individually or in small groups</li>
            <li>• Keep the camera steady and at a consistent distance</li>
            <li>• Include tool labels or serial numbers when visible</li>
            <li>• Clean tools before photographing for better recognition</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
