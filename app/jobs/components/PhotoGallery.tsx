'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Camera,
  Image as ImageIcon,
  CheckCircle,
  Trash2,
  Eye,
  Calendar,
  X,
} from 'lucide-react';
import { deleteJobPhoto } from '@/lib/db/job-photos';
import type { JobPhoto } from '@/types/job-photo';

interface PhotoGalleryProps {
  photos: JobPhoto[];
  onPhotoDeleted: (photoId: string) => void;
}

export function PhotoGallery({ photos, onPhotoDeleted }: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<JobPhoto | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<JobPhoto | null>(null);

  const handleDeletePhoto = async () => {
    if (!photoToDelete) return;

    try {
      await deleteJobPhoto(photoToDelete.id);
      onPhotoDeleted(photoToDelete.id);
      setDeleteDialogOpen(false);
      setPhotoToDelete(null);
    } catch (error) {
      console.error('Failed to delete photo:', error);
      alert('Failed to delete photo');
    }
  };

  const getPhotoTypeIcon = (type: string) => {
    switch (type) {
      case 'before':
        return <Camera className="w-4 h-4" />;
      case 'during':
        return <ImageIcon className="w-4 h-4" />;
      case 'after':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <ImageIcon className="w-4 h-4" />;
    }
  };

  const getPhotoTypeColor = (type: string) => {
    switch (type) {
      case 'before':
        return 'bg-blue-100 text-blue-800';
      case 'during':
        return 'bg-yellow-100 text-yellow-800';
      case 'after':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const groupedPhotos = photos.reduce(
    (acc, photo) => {
      if (!acc[photo.photo_type]) {
        acc[photo.photo_type] = [];
      }
      acc[photo.photo_type].push(photo);
      return acc;
    },
    {} as Record<string, JobPhoto[]>
  );

  if (photos.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h4 className="font-medium mb-2">No photos yet</h4>
          <p className="text-sm text-muted-foreground">
            Upload photos to document your work progress.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {Object.entries(groupedPhotos).map(([type, typePhotos]) => (
          <Card key={type}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 capitalize">
                {getPhotoTypeIcon(type)}
                {type} Photos ({typePhotos.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {typePhotos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden border bg-gray-100">
                      <img
                        src={photo.file_path}
                        alt={photo.caption || photo.original_filename}
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => setSelectedPhoto(photo)}
                      />
                    </div>

                    {/* Overlay with actions */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setSelectedPhoto(photo)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setPhotoToDelete(photo);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Photo type badge */}
                    <div className="absolute top-2 left-2">
                      <Badge className={getPhotoTypeColor(type)}>{type}</Badge>
                    </div>

                    {/* Caption overlay */}
                    {photo.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2">
                        <p className="text-xs truncate">{photo.caption}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Photo Detail Modal */}
      <Dialog
        open={!!selectedPhoto}
        onOpenChange={() => setSelectedPhoto(null)}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>
                {selectedPhoto?.caption || selectedPhoto?.original_filename}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPhoto(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {selectedPhoto && (
            <div className="space-y-4">
              {/* Large Image */}
              <div className="flex justify-center">
                <img
                  src={selectedPhoto.file_path}
                  alt={selectedPhoto.caption || selectedPhoto.original_filename}
                  className="max-w-full max-h-96 object-contain rounded-lg"
                />
              </div>

              {/* Photo Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Type:</span>
                  <Badge
                    className={`ml-2 ${getPhotoTypeColor(selectedPhoto.photo_type)}`}
                  >
                    {selectedPhoto.photo_type}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">File Size:</span>
                  <span className="ml-2">
                    {formatFileSize(selectedPhoto.file_size)}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Uploaded:</span>
                  <span className="ml-2 flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(selectedPhoto.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Original Name:</span>
                  <span className="ml-2">
                    {selectedPhoto.original_filename}
                  </span>
                </div>
              </div>

              {selectedPhoto.caption && (
                <div>
                  <span className="font-medium">Caption:</span>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedPhoto.caption}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Photo</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this photo? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePhoto}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Photo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
