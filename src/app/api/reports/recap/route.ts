import { NextRequest, NextResponse } from 'next/server';
import { Filter } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';
import { getSessionUserFromRequest } from '@/lib/auth';
import { ArchiveDocument, isValidJenisArsip } from '@/lib/models';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tahun = searchParams.get('tahun')?.trim() || 'all';
    const bulan = searchParams.get('bulan')?.trim() || 'all';
    const jenis_arsip = searchParams.get('jenis_arsip')?.trim() || 'all';
    const exportAll = searchParams.get('exportAll') === 'true';

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const rawLimit = parseInt(searchParams.get('limit') || '20', 10);
    const limit = Math.min(Math.max(1, rawLimit), 20);
    const skip = (page - 1) * limit;

    const filter: Filter<ArchiveDocument> = {};

    if (jenis_arsip !== 'all' && isValidJenisArsip(jenis_arsip)) {
      filter.jenis_arsip = jenis_arsip;
    }

    if (tahun !== 'all' && bulan !== 'all') {
      const paddedMonth = bulan.padStart(2, '0');
      filter.tanggal_surat = { $regex: `^${tahun}-${paddedMonth}` };
    } else if (tahun !== 'all') {
      filter.tanggal_surat = { $regex: `^${tahun}` };
    } else if (bulan !== 'all') {
      const paddedMonth = bulan.padStart(2, '0');
      filter.tanggal_surat = { $regex: `-${paddedMonth}-` };
    }

    const db = await getDatabase();
    const archivesCol = db.collection<ArchiveDocument>('archives');

    // 1. Overall breakdown
    const [totalMasuk, totalKeluar, totalAll] = await Promise.all([
      archivesCol.countDocuments({ jenis_arsip: 'Surat masuk' }),
      archivesCol.countDocuments({ jenis_arsip: 'Surat keluar' }),
      archivesCol.countDocuments({}),
    ]);

    // 2. Monthly recap aggregation (extract YYYY-MM from tanggal_surat)
    const monthlyAggregation = await archivesCol
      .aggregate([
        {
          $project: {
            yearMonth: { $substrCP: ['$tanggal_surat', 0, 7] },
            jenis_arsip: 1,
          },
        },
        {
          $group: {
            _id: '$yearMonth',
            total: { $sum: 1 },
            suratMasuk: {
              $sum: { $cond: [{ $eq: ['$jenis_arsip', 'Surat masuk'] }, 1, 0] },
            },
            suratKeluar: {
              $sum: { $cond: [{ $eq: ['$jenis_arsip', 'Surat keluar'] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: -1 } },
        { $limit: 12 },
      ])
      .toArray();

    // 3. Yearly recap aggregation (extract YYYY from tanggal_surat)
    const yearlyAggregation = await archivesCol
      .aggregate([
        {
          $project: {
            year: { $substrCP: ['$tanggal_surat', 0, 4] },
            jenis_arsip: 1,
          },
        },
        {
          $group: {
            _id: '$year',
            total: { $sum: 1 },
            suratMasuk: {
              $sum: { $cond: [{ $eq: ['$jenis_arsip', 'Surat masuk'] }, 1, 0] },
            },
            suratKeluar: {
              $sum: { $cond: [{ $eq: ['$jenis_arsip', 'Surat keluar'] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: -1 } },
        { $limit: 10 },
      ])
      .toArray();

    // 4. Filtered table records (for UI table & export)
    let recordsQuery = archivesCol.find(filter).sort({ tanggal_surat: -1, created_at: -1 });

    let items;
    let total;

    if (exportAll) {
      // Export gets all records matching filter
      items = await recordsQuery.toArray();
      total = items.length;
    } else {
      [items, total] = await Promise.all([
        recordsQuery.skip(skip).limit(limit).toArray(),
        archivesCol.countDocuments(filter),
      ]);
    }

    const formattedItems = items.map((doc, idx) => ({
      no: exportAll ? idx + 1 : skip + idx + 1,
      id: doc._id?.toString(),
      nomor_surat: doc.nomor_surat,
      tanggal_surat: doc.tanggal_surat,
      jenis_arsip: doc.jenis_arsip,
      kepada: doc.kepada,
      perihal: doc.perihal,
      keterangan: doc.keterangan || '-',
      file_name: doc.file_name || 'arsip_dokumen',
    }));

    return NextResponse.json({
      breakdown: {
        totalAll,
        totalMasuk,
        totalKeluar,
        ratioMasuk: totalAll > 0 ? Math.round((totalMasuk / totalAll) * 100) : 0,
        ratioKeluar: totalAll > 0 ? Math.round((totalKeluar / totalAll) * 100) : 0,
      },
      monthlyRecap: monthlyAggregation.map((m) => ({
        period: m._id || 'Tidak Valid',
        total: m.total,
        suratMasuk: m.suratMasuk,
        suratKeluar: m.suratKeluar,
      })),
      yearlyRecap: yearlyAggregation.map((y) => ({
        year: y._id || 'Tidak Valid',
        total: y.total,
        suratMasuk: y.suratMasuk,
        suratKeluar: y.suratKeluar,
      })),
      table: {
        items: formattedItems,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error) {
    console.error('Reports recap error:', error);
    return NextResponse.json(
      { error: 'Gagal memuat rekap laporan' },
      { status: 500 }
    );
  }
}
