import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getSessionUserFromRequest } from '@/lib/auth';
import { ArchiveDocument } from '@/lib/models';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    const archivesCol = db.collection<ArchiveDocument>('archives');

    const [totalArchives, totalSuratMasuk, totalSuratKeluar, recentList, pendingUsers] =
      await Promise.all([
        archivesCol.countDocuments({}),
        archivesCol.countDocuments({ jenis_arsip: 'Surat masuk' }),
        archivesCol.countDocuments({ jenis_arsip: 'Surat keluar' }),
        archivesCol
          .find({})
          .sort({ created_at: -1 })
          .limit(5)
          .project({
            _id: 1,
            nomor_surat: 1,
            tanggal_surat: 1,
            jenis_arsip: 1,
            kepada: 1,
            perihal: 1,
            created_at: 1,
          })
          .toArray(),
        user.role === 'admin'
          ? db.collection('users').countDocuments({ status: 'pending' })
          : Promise.resolve(0),
      ]);

    const formattedRecent = recentList.map((it) => ({
      id: it._id?.toString(),
      nomor_surat: it.nomor_surat,
      tanggal_surat: it.tanggal_surat,
      jenis_arsip: it.jenis_arsip,
      kepada: it.kepada,
      perihal: it.perihal,
      created_at: it.created_at ? it.created_at.toISOString() : '',
    }));

    return NextResponse.json({
      stats: {
        totalArchives,
        totalSuratMasuk,
        totalSuratKeluar,
        pendingUsers,
      },
      recent: formattedRecent,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Gagal memuat ringkasan statistik' },
      { status: 500 }
    );
  }
}
