'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Image as ImageIcon,
  Trash2,
  Eye,
  X,
  GitCompare,
  ArrowLeftRight,
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
  const [compareMode, setCompareMode] = useState(false);
  const [comparePhotos, setComparePhotos] = useState<
    [JobPhoto | null, JobPhoto | null]
  >([null, null]);
  const [activeTab, setActiveTab] = useState('all');

  // Group photos by type
  const groupedPhotos = photos.reduce(
    (acc, photo) => {
      const type = photo.photo_type || 'other';
      if (!acc[type]) acc[type] = [];
      acc[type].push(photo);
      return acc;
    },
    {} as Record<string, JobPhoto[]>
  );

  const photoTypes = [
    { key: 'before', label: 'Before', icon: '📷' },
    { key: 'during', label: 'Progress', icon: '🔄' },
    { key: 'after', label: 'After', icon: '✅' },
    { key: 'other', label: 'Other', icon: '📎' },
  ];

  const handleDeletePhoto = async () => {
    if (!photoToDelete) return;

    try {
      await deleteJobPhoto(photoToDelete.id);
      onPhotoDeleted(photoToDelete.id);
      setDeleteDialogOpen(false);
      setPhotoToDelete(null);
    } catch (error) {
      console.error('Failed to delete photo:', error);
    }
  };

  const handleComparePhotos = (photo: JobPhoto) => {
    if (!compareMode) return;

    setComparePhotos((prev) => {
      if (!prev[0]) {
        return [photo, null];
      } else if (!prev[1]) {
        return [prev[0], photo];
      } else {
        return [photo, null];
      }
    });
  };

  const clearComparison = () => {
    setComparePhotos([null, null]);
  };

  const filteredPhotos =
    activeTab === 'all'
      ? photos
      : photos.filter((photo) => (photo.photo_type || 'other') === activeTab);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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
        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-medium">Photo Gallery</h3>
            <Badge variant="secondary">{photos.length} photos</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={compareMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setCompareMode(!compareMode);
                if (compareMode) clearComparison();
              }}
            >
              <GitCompare className="w-4 h-4 mr-2" />
              Compare
            </Button>
          </div>
        </div>

        {/* Comparison View */}
        {compareMode && (comparePhotos[0] || comparePhotos[1]) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5" />
                Photo Comparison
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearComparison}
                  className="ml-auto"
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[0, 1].map((index) => (
                  <div key={index} className="space-y-2">
                    <div className="text-sm font-medium">
                      {index === 0 ? 'Photo 1' : 'Photo 2'}
                      {comparePhotos[index] && (
                        <Badge variant="outline" className="ml-2">
                          {comparePhotos[index]?.photo_type || 'other'}
                        </Badge>
                      )}
                    </div>
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300">
                      {comparePhotos[index] ? (
                        <Image
                          src={comparePhotos[index]!.file_path}
                          alt={
                            comparePhotos[index]!.caption || 'Comparison photo'
                          }
                          width={400}
                          height={225}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => setSelectedPhoto(comparePhotos[index])}
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          Click a photo below to add to comparison
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Photo Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All ({photos.length})</TabsTrigger>
            {photoTypes.map((type) => (
              <TabsTrigger key={type.key} value={type.key}>
                {type.icon} {type.label} ({groupedPhotos[type.key]?.length || 0}
                )
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredPhotos.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="font-medium mb-2">
                    No photos in this category
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {activeTab === 'all'
                      ? 'Upload photos to document your work progress.'
                      : `No ${activeTab} photos yet.`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {filteredPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      compareMode
                        ? comparePhotos.includes(photo)
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-gray-200 hover:border-primary/50'
                        : 'border-gray-200 hover:border-primary'
                    }`}
                    onClick={() => {
                      if (compareMode) {
                        handleComparePhotos(photo);
                      } else {
                        setSelectedPhoto(photo);
                      }
                    }}
                  >
                    <div className="aspect-square bg-gray-100">
                      <Image
                        src={photo.file_path}
                        alt={photo.caption || 'Job photo'}
                        width={200}
                        height={200}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    {/* Photo Type Badge */}
                    <div className="absolute top-2 left-2">
                      <Badge
                        variant="secondary"
                        className="text-xs bg-black/70 text-white border-0"
                      >
                        {photo.photo_type || 'other'}
                      </Badge>
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                      {compareMode ? (
                        <div className="text-white text-center">
                          <GitCompare className="w-6 h-6 mx-auto mb-1" />
                          <div className="text-xs">Click to compare</div>
                        </div>
                      ) : (
                        <Eye className="text-white w-6 h-6" />
                      )}
                    </div>

                    {/* Delete Button */}
                    <div className="absolute top-2 right-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPhotoToDelete(photo);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Caption */}
                    {photo.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-2">
                        {photo.caption}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Photo Detail Dialog */}
      <Dialog
        open={!!selectedPhoto}
        onOpenChange={() => setSelectedPhoto(null)}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Photo Details</DialogTitle>
          </DialogHeader>
          {selectedPhoto && (
            <div className="space-y-4">
              <div className="relative">
                <Image
                  src={selectedPhoto.file_path}
                  alt={selectedPhoto.caption || 'Job photo'}
                  width={800}
                  height={600}
                  className="w-full max-h-96 object-contain rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Type:</span>
                  <Badge variant="outline" className="ml-2">
                    {selectedPhoto.photo_type || 'other'}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Size:</span>
                  <span className="ml-2">
                    {formatFileSize(selectedPhoto.file_size)}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Uploaded:</span>
                  <span className="ml-2">
                    {new Date(selectedPhoto.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="font-medium">File:</span>
                  <span className="ml-2 text-xs text-muted-foreground">
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
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
