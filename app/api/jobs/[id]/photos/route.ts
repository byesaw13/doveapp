import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { createJobPhoto } from '@/lib/db/job-photos';
import { randomUUID } from 'crypto';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const formData = await request.formData();

    const file = formData.get('file') as File;
    const photoType = formData.get('photoType') as string;
    const caption = formData.get('caption') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (
      !photoType ||
      !['before', 'during', 'after', 'other'].includes(photoType)
    ) {
      return NextResponse.json(
        { error: 'Invalid photo type' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const filename = `${randomUUID()}.${fileExtension}`;

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'job-photos');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }

    // Save file to disk
    const filePath = join(uploadsDir, filename);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Create database record
    const photoData = {
      job_id: jobId,
      filename,
      original_filename: file.name,
      file_path: `/uploads/job-photos/${filename}`,
      file_size: file.size,
      mime_type: file.type,
      photo_type: photoType as 'before' | 'during' | 'after' | 'other',
      caption: caption || null,
      taken_at: new Date().toISOString(),
    };

    const photo = await createJobPhoto(photoData);

    return NextResponse.json({
      success: true,
      photo,
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    return NextResponse.json(
      { error: 'Failed to upload photo' },
      { status: 500 }
    );
  }
}
