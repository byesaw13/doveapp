'use client';

import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  X,
  Image as ImageIcon,
  Camera,
  Loader2,
  AlertCircle,
  CheckCircle,
  Smartphone,
} from 'lucide-react';
import type { JobPhoto } from '@/types/job-photo';

interface PhotoUploadProps {
  jobId: string;
  onPhotoUploaded: (photo: JobPhoto) => void;
}

export function PhotoUpload({ jobId, onPhotoUploaded }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [selectedPhotoType, setSelectedPhotoType] = useState<
    'before' | 'during' | 'after' | 'other'
  >('before');
  const [caption, setCaption] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      await uploadPhoto(file);
    },
    [jobId, selectedPhotoType, caption]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const uploadPhoto = async (file: File) => {
    setUploading(true);
    setUploadProgress('Compressing...');

    // Compress the image before upload
    const compressedFile = await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    });

    setUploadProgress('Uploading...');

    try {
      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('photoType', selectedPhotoType);
      if (caption.trim()) {
        formData.append('caption', caption.trim());
      }

      const response = await fetch(`/api/jobs/${jobId}/photos`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();
      setUploadProgress('Upload successful!');
      onPhotoUploaded(result.photo);

      // Reset form
      setCaption('');
      setTimeout(() => setUploadProgress(null), 2000);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress(
        `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      setTimeout(() => setUploadProgress(null), 3000);
    } finally {
      setUploading(false);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Use back camera on mobile
        audio: false,
      });
      setStream(mediaStream);
      setCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions and try again.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
    setCapturedImage(null);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob and create file
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `photo-${Date.now()}.jpg`, {
            type: 'image/jpeg',
          });
          setCapturedImage(canvas.toDataURL('image/jpeg'));
          // Don't upload immediately, let user confirm
        }
      },
      'image/jpeg',
      0.8
    );
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const photoTypes = [
    {
      value: 'before' as const,
      label: 'Before Work',
      icon: Camera,
      color: 'bg-blue-100 text-blue-800',
    },
    {
      value: 'during' as const,
      label: 'During Work',
      icon: ImageIcon,
      color: 'bg-yellow-100 text-yellow-800',
    },
    {
      value: 'after' as const,
      label: 'After Work',
      icon: CheckCircle,
      color: 'bg-green-100 text-green-800',
    },
    {
      value: 'other' as const,
      label: 'Other',
      icon: ImageIcon,
      color: 'bg-gray-100 text-gray-800',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Photos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Photo Type Selection */}
        <div>
          <Label className="text-sm font-medium">Photo Type</Label>
          <div className="flex gap-2 mt-2">
            {photoTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedPhotoType(type.value)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedPhotoType === type.value
                    ? type.color
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <type.icon className="w-4 h-4" />
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Caption Input */}
        <div>
          <Label htmlFor="caption">Caption (Optional)</Label>
          <Input
            id="caption"
            placeholder="Describe this photo..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="mt-1"
          />
        </div>

        {/* Camera Interface */}
        {cameraActive && !capturedImage && (
          <div className="border-2 border-blue-400 rounded-lg p-4 bg-blue-50">
            <div className="flex flex-col items-center gap-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full max-w-md rounded-lg"
              />
              <div className="flex gap-2">
                <Button
                  onClick={capturePhoto}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Capture Photo
                </Button>
                <Button variant="outline" onClick={stopCamera}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
            {/* Hidden canvas for photo capture */}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {/* Captured Image Preview */}
        {capturedImage && (
          <div className="border-2 border-green-400 rounded-lg p-4 bg-green-50">
            <div className="flex flex-col items-center gap-4">
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full max-w-md rounded-lg"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    // Convert data URL back to blob and upload
                    fetch(capturedImage!)
                      .then((res) => res.blob())
                      .then((blob) => {
                        const file = new File(
                          [blob],
                          `photo-${Date.now()}.jpg`,
                          { type: 'image/jpeg' }
                        );
                        uploadPhoto(file);
                      });
                  }}
                  disabled={uploading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Upload Photo'}
                </Button>
                <Button variant="outline" onClick={retakePhoto}>
                  <Camera className="w-4 h-4 mr-2" />
                  Retake
                </Button>
                <Button variant="outline" onClick={stopCamera}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Area */}
        {!cameraActive && !capturedImage && (
          <div className="space-y-4">
            {/* Camera Button for Mobile */}
            <div className="flex justify-center">
              <Button
                onClick={startCamera}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                Take Photo with Camera
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or</span>
              </div>
            </div>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-4">
                {uploading ? (
                  <>
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    <p className="text-sm text-gray-600">Uploading photo...</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {isDragActive
                          ? 'Drop the photo here'
                          : 'Click to upload or drag and drop'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Upload Status */}
        {uploadProgress && (
          <div
            className={`p-3 rounded-md text-sm ${
              uploadProgress.includes('successful')
                ? 'bg-green-50 text-green-800 border border-green-200'
                : uploadProgress.includes('failed')
                  ? 'bg-red-50 text-red-800 border border-red-200'
                  : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}
          >
            {uploadProgress.includes('successful') ? (
              <CheckCircle className="w-4 h-4 inline mr-2" />
            ) : uploadProgress.includes('failed') ? (
              <AlertCircle className="w-4 h-4 inline mr-2" />
            ) : (
              <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
            )}
            {uploadProgress}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
