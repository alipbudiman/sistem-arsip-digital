import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';
import { getSessionUserFromRequest } from '@/lib/auth';
import { ArchiveDocument, isValidJenisArsip } from '@/lib/models';
import { uploadFileToGridFS, deleteFileFromGridFS } from '@/lib/storage/gridfs';

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

    if (!doc) {
      return NextResponse.json({ error: 'Arsip tidak ditemukan' }, { status: 404 });
    }

    let uploaderName = 'Petugas';
    if (doc.user_id && ObjectId.isValid(doc.user_id)) {
      const uploader = await db.collection('users').findOne({ _id: new ObjectId(doc.user_id) });
      if (uploader) {
        uploaderName = uploader.nama_lengkap || uploader.username;
      }
    }

    return NextResponse.json({
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
      uploader_name: uploaderName,
      created_at: doc.created_at ? doc.created_at.toISOString() : '',
      updated_at: doc.updated_at ? doc.updated_at.toISOString() : '',
    });
  } catch (error) {
    console.error('Get archive detail error:', error);
    return NextResponse.json({ error: 'Gagal mengambil detail arsip' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
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
    const existing = await db.collection<ArchiveDocument>('archives').findOne({
      _id: new ObjectId(id),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Arsip tidak ditemukan' }, { status: 404 });
    }

    const contentType = req.headers.get('content-type') || '';
    let updateFields: Partial<ArchiveDocument> = {
      updated_at: new Date(),
    };

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const kepada = (formData.get('kepada') as string)?.trim();
      const perihal = (formData.get('perihal') as string)?.trim();
      const nomor_surat = (formData.get('nomor_surat') as string)?.trim();
      const tanggal_surat = (formData.get('tanggal_surat') as string)?.trim();
      const jenis_arsip = (formData.get('jenis_arsip') as string)?.trim();
      const keterangan = (formData.get('keterangan') as string)?.trim();
      const file = (formData.get('file') || formData.get('data')) as File | null;

      if (kepada) updateFields.kepada = kepada;
      if (perihal) updateFields.perihal = perihal;
      if (nomor_surat) updateFields.nomor_surat = nomor_surat;
      if (tanggal_surat) updateFields.tanggal_surat = tanggal_surat;
      if (jenis_arsip) {
        if (!isValidJenisArsip(jenis_arsip)) {
          return NextResponse.json(
            { error: 'jenis_arsip harus salah satu dari: "Surat masuk" atau "Surat keluar"' },
            { status: 400 }
          );
        }
        updateFields.jenis_arsip = jenis_arsip;
      }
      if (keterangan !== undefined) {
        updateFields.keterangan = keterangan;
      }

      // If user uploaded a replacement file
      if (file && typeof file.arrayBuffer === 'function' && file.size > 0) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const uploadResult = await uploadFileToGridFS(
          buffer,
          file.name,
          file.type || 'application/octet-stream'
        );

        // Delete previous GridFS file
        if (existing.data) {
          await deleteFileFromGridFS(existing.data);
        }

        updateFields.data = uploadResult.fileId;
        updateFields.file_name = file.name;
        updateFields.file_size = file.size;
        updateFields.file_type = file.type || 'application/octet-stream';
      }
    } else {
      const body = await req.json();
      if (body.kepada) updateFields.kepada = body.kepada.trim();
      if (body.perihal) updateFields.perihal = body.perihal.trim();
      if (body.nomor_surat) updateFields.nomor_surat = body.nomor_surat.trim();
      if (body.tanggal_surat) updateFields.tanggal_surat = body.tanggal_surat.trim();
      if (body.jenis_arsip) {
        if (!isValidJenisArsip(body.jenis_arsip)) {
          return NextResponse.json(
            { error: 'jenis_arsip harus salah satu dari: "Surat masuk" atau "Surat keluar"' },
            { status: 400 }
          );
        }
        updateFields.jenis_arsip = body.jenis_arsip;
      }
      if (body.keterangan !== undefined) {
        updateFields.keterangan = body.keterangan.trim();
      }
    }

    await db.collection<ArchiveDocument>('archives').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    return NextResponse.json({
      success: true,
      message: 'Data arsip berhasil diperbarui',
    });
  } catch (error) {
    console.error('Update archive error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui data arsip' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
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

    if (!doc) {
      return NextResponse.json({ error: 'Arsip tidak ditemukan' }, { status: 404 });
    }

    // Clean up GridFS file binary
    if (doc.data) {
      await deleteFileFromGridFS(doc.data);
    }

    await db.collection<ArchiveDocument>('archives').deleteOne({
      _id: new ObjectId(id),
    });

    return NextResponse.json({
      success: true,
      message: 'Arsip dan file binary berhasil dihapus dari sistem',
    });
  } catch (error) {
    console.error('Delete archive error:', error);
    return NextResponse.json({ error: 'Gagal menghapus data arsip' }, { status: 500 });
  }
}
