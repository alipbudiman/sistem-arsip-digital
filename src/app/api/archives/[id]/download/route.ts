import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { Readable } from 'stream';
import { getDatabase } from '@/lib/mongodb';
import { getSessionUserFromRequest } from '@/lib/auth';
import { ArchiveDocument } from '@/lib/models';
import { getGridFSDownloadStream } from '@/lib/storage/gridfs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const user = await getSessionUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID Arsip tidak valid' }, { status: 400 });
    }

    const db = await getDatabase();
    const doc = await db.collection<ArchiveDocument>('archives').findOne({
      _id: new ObjectId(id),
    });

    if (!doc || !doc.data) {
      return NextResponse.json({ error: 'File arsip tidak ditemukan' }, { status: 404 });
    }

    const { stream, fileDoc } = await getGridFSDownloadStream(doc.data);
    const filename = doc.file_name || fileDoc.filename || 'arsip_dokumen';
    const contentType = doc.file_type || fileDoc.metadata?.contentType || 'application/octet-stream';

    // Convert Node Readable stream to Web ReadableStream
    const webStream = Readable.toWeb(stream) as ReadableStream<Uint8Array>;

    return new Response(webStream, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileDoc.length.toString(),
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Gagal mengunduh file arsip' }, { status: 500 });
  }
}
