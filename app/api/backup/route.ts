import { NextRequest, NextResponse } from 'next/server';
import { backupAllData, importDataFromJSON, BackupData } from '@/lib/backup';

// GET /api/backup - Download backup
export async function GET() {
  try {
    const backup = await backupAllData();
    return NextResponse.json(backup);
  } catch (error) {
    console.error('Backup failed:', error);
    return NextResponse.json(
      { error: 'Failed to create backup' },
      { status: 500 }
    );
  }
}

// POST /api/backup - Upload and import backup
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('backup') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No backup file provided' },
        { status: 400 }
      );
    }

    const text = await file.text();
    const backup: BackupData = JSON.parse(text);

    if (!backup.timestamp || !backup.tables) {
      return NextResponse.json(
        { error: 'Invalid backup file format' },
        { status: 400 }
      );
    }

    const result = await importDataFromJSON(backup);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Import failed', details: result.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Backup imported successfully',
    });
  } catch (error) {
    console.error('Import failed:', error);
    return NextResponse.json(
      { error: 'Failed to import backup' },
      { status: 500 }
    );
  }
}
