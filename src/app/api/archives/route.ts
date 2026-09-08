import { NextRequest, NextResponse } from 'next/server';
import { ObjectId, Filter } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';
import { getSessionUserFromRequest } from '@/lib/auth';
import { ArchiveDocument, isValidJenisArsip } from '@/lib/models';
import { uploadFileToGridFS } from '@/lib/storage/gridfs';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const jenis_arsip = searchParams.get('jenis_arsip')?.trim() || 'all';
    const bulan = searchParams.get('bulan')?.trim() || 'all';
    const tahun = searchParams.get('tahun')?.trim() || 'all';
    
    // Pagination constraint: max 20 items per page
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const rawLimit = parseInt(searchParams.get('limit') || '20', 10);
    const limit = Math.min(Math.max(1, rawLimit), 20);
    const skip = (page - 1) * limit;

    const filter: Filter<ArchiveDocument> = {};

    // 1. Filter by jenis_arsip
    if (jenis_arsip !== 'all' && isValidJenisArsip(jenis_arsip)) {
      filter.jenis_arsip = jenis_arsip;
    }

    // 2. Filter by month and/or year on tanggal_surat (YYYY-MM-DD format)
    if (tahun !== 'all' && bulan !== 'all') {
      const paddedMonth = bulan.padStart(2, '0');
      filter.tanggal_surat = { $regex: `^${tahun}-${paddedMonth}` };
    } else if (tahun !== 'all') {
      filter.tanggal_surat = { $regex: `^${tahun}` };
    } else if (bulan !== 'all') {
      const paddedMonth = bulan.padStart(2, '0');
      filter.tanggal_surat = { $regex: `-${paddedMonth}-` };
    }

    // 3. Text search on nomor_surat, tanggal_surat, jenis_arsip, kepada (and perihal)
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      const searchConditions = [
        { nomor_surat: searchRegex },
        { tanggal_surat: searchRegex },
        { jenis_arsip: searchRegex },
        { kepada: searchRegex },
        { perihal: searchRegex },
      ];

      if (Object.keys(filter).length > 0) {
        filter.$and = [{ $or: searchConditions }];
      } else {
        filter.$or = searchConditions;
      }
    }

    const db = await getDatabase();
    const archivesCol = db.collection<ArchiveDocument>('archives');

    const [items, total] = await Promise.all([
      archivesCol
        .find(filter)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      archivesCol.countDocuments(filter),
    ]);

    // Fetch user names for display if available
    const userIds = [...new Set(items.map((it) => it.user_id).filter(Boolean))];
    const usersMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const objectIds = userIds
        .filter((id) => ObjectId.isValid(id))
        .map((id) => new ObjectId(id));
      const users = await db
        .collection('users')
        .find({ _id: { $in: objectIds } })
        .project({ _id: 1, nama_lengkap: 1, username: 1 })
        .toArray();
      users.forEach((u) => {
        usersMap[u._id.toString()] = u.nama_lengkap || u.username;
      });
    }

    const formattedItems = items.map((doc) => ({
      id: doc._id?.toString(),
      kepada: doc.kepada,
      perihal: doc.perihal,
      nomor_surat: doc.nomor_surat,
      tanggal_surat: doc.tanggal_surat,
      jenis_arsip: doc.jenis_arsip,
      ...(doc.keterangan ? { keterangan: doc.keterangan } : {}),
      user_id: doc.user_id,
      data: doc.data ? doc.data.toString() : '',
      file_name: doc.file_name,
      file_size: doc.file_size,
      file_type: doc.file_type,
      uploader_name: usersMap[doc.user_id] || 'Petugas',
      created_at: doc.created_at ? doc.created_at.toISOString() : '',
      updated_at: doc.updated_at ? doc.updated_at.toISOString() : '',
    }));

    return NextResponse.json({
      items: formattedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error('Fetch archives error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memuat data arsip' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Constraint: user_id must never be client input — always derive server-side from session
    const user = await getSessionUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Sesi telah berakhir atau tidak valid. Silakan login kembali.' }, { status: 401 });
    }

    const formData = await req.formData();
    const kepada = (formData.get('kepada') as string)?.trim();
    const perihal = (formData.get('perihal') as string)?.trim();
    const nomor_surat = (formData.get('nomor_surat') as string)?.trim();
    const tanggal_surat = (formData.get('tanggal_surat') as string)?.trim();
    const jenis_arsip = (formData.get('jenis_arsip') as string)?.trim();
    const keterangan = (formData.get('keterangan') as string)?.trim();
    const file = (formData.get('file') || formData.get('data')) as File | null;

    if (!kepada || !perihal || !nomor_surat || !tanggal_surat || !jenis_arsip) {
      return NextResponse.json(
        { error: 'Semua field wajib diisi: kepada, perihal, nomor_surat, tanggal_surat, jenis_arsip' },
        { status: 400 }
      );
    }

    // Constraint: jenis_arsip is a constrained enum of exactly two values: "Surat masuk" and "Surat keluar"
    if (!isValidJenisArsip(jenis_arsip)) {
      return NextResponse.json(
        { error: 'jenis_arsip harus salah satu dari: "Surat masuk" atau "Surat keluar"' },
        { status: 400 }
      );
    }

    if (!file || typeof file.arrayBuffer !== 'function' || file.size === 0) {
      return NextResponse.json(
        { error: 'File dokumen arsip wajib diunggah' },
        { status: 400 }
      );
    }

    // Convert file to Buffer and store in MongoDB GridFS
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const uploadResult = await uploadFileToGridFS(
      buffer,
      file.name,
      file.type || 'application/octet-stream'
    );

    const now = new Date();

    // Verbatim Archive Data Model
    const archiveDoc: ArchiveDocument = {
      kepada,
      perihal,
      nomor_surat,
      tanggal_surat,
      jenis_arsip,
      user_id: user.id, // Strictly auto-filled from session
      data: uploadResult.fileId, // Binary stored in GridFS
      file_name: file.name,
      file_size: file.size,
      file_type: file.type || 'application/octet-stream',
      created_at: now,
      updated_at: now,
    };

    // Constraint: keterangan is optional (omitempty)
    if (keterangan) {
      archiveDoc.keterangan = keterangan;
    }

    const db = await getDatabase();
    const result = await db.collection<ArchiveDocument>('archives').insertOne(archiveDoc);

    return NextResponse.json(
      {
        success: true,
        message: 'Arsip berhasil disimpan ke sistem dan GridFS',
        id: result.insertedId.toString(),
        archive: {
          id: result.insertedId.toString(),
          kepada: archiveDoc.kepada,
          perihal: archiveDoc.perihal,
          nomor_surat: archiveDoc.nomor_surat,
          tanggal_surat: archiveDoc.tanggal_surat,
          jenis_arsip: archiveDoc.jenis_arsip,
          ...(archiveDoc.keterangan ? { keterangan: archiveDoc.keterangan } : {}),
          user_id: archiveDoc.user_id,
          data: archiveDoc.data.toString(),
          file_name: archiveDoc.file_name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create archive error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat menyimpan arsip' },
      { status: 500 }
    );
  }
}
