'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  FolderArchive,
  Search,
  Filter,
  FilePlus,
  Eye,
  Edit,
  Trash2,
  Download,
  Calendar,
  Tag,
  AlertCircle,
  CheckCircle2,
  X,
  FileText,
  Clock,
  User,
  ExternalLink,
} from 'lucide-react';
import { ArchiveResponseItem, JenisArsip } from '@/lib/models';

function ArchivesContent() {
  const searchParams = useSearchParams();
  const justCreated = searchParams.get('created') === 'true';

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [jenisArsip, setJenisArsip] = useState('all');
  const [bulan, setBulan] = useState('all');
  const [tahun, setTahun] = useState('all');
  const [page, setPage] = useState(1);

  // Data state
  const [archives, setArchives] = useState<ArchiveResponseItem[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState(
    justCreated ? 'Dokumen arsip berhasil disimpan ke MongoDB GridFS!' : ''
  );
  const [errorMsg, setErrorMsg] = useState('');

  // Modals state
  const [viewItem, setViewItem] = useState<ArchiveResponseItem | null>(null);
  const [editItem, setEditItem] = useState<ArchiveResponseItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<ArchiveResponseItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit form state
  const [editNomorSurat, setEditNomorSurat] = useState('');
  const [editTanggalSurat, setEditTanggalSurat] = useState('');
  const [editKepada, setEditKepada] = useState('');
  const [editPerihal, setEditPerihal] = useState('');
  const [editJenisArsip, setEditJenisArsip] = useState<JenisArsip>('Surat masuk');
  const [editKeterangan, setEditKeterangan] = useState('');
  const [editFile, setEditFile] = useState<File | null>(null);

  // Debounce search input (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset to page 1 on new search
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch archives with debounced search & filters
  const fetchArchives = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (jenisArsip !== 'all') params.set('jenis_arsip', jenisArsip);
      if (bulan !== 'all') params.set('bulan', bulan);
      if (tahun !== 'all') params.set('tahun', tahun);
      params.set('page', page.toString());
      params.set('limit', '20'); // Capped at 20 items per page

      const res = await fetch(`/api/archives?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Gagal memuat arsip');
      }

      const data = await res.json();
      setArchives(data.items || []);
      setTotalRecords(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Fetch archives error:', err);
      setErrorMsg('Gagal memuat data arsip dari server');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, jenisArsip, bulan, tahun, page]);

  useEffect(() => {
    fetchArchives();
  }, [fetchArchives]);

  // Open Edit modal
  const handleOpenEdit = (item: ArchiveResponseItem) => {
    setEditItem(item);
    setEditNomorSurat(item.nomor_surat);
    setEditTanggalSurat(item.tanggal_surat);
    setEditKepada(item.kepada);
    setEditPerihal(item.perihal);
    setEditJenisArsip(item.jenis_arsip);
    setEditKeterangan(item.keterangan || '');
    setEditFile(null);
  };

  // Submit Edit form
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    setActionLoading(true);

    try {
      const formData = new FormData();
      formData.append('nomor_surat', editNomorSurat);
      formData.append('tanggal_surat', editTanggalSurat);
      formData.append('kepada', editKepada);
      formData.append('perihal', editPerihal);
      formData.append('jenis_arsip', editJenisArsip);
      formData.append('keterangan', editKeterangan);
      if (editFile) {
        formData.append('file', editFile);
      }

      const res = await fetch(`/api/archives/${editItem.id}`, {
        method: 'PUT',
        body: formData,
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Gagal menyimpan perubahan');
      }

      setSuccessMsg('Data arsip berhasil diperbarui');
      setEditItem(null);
      fetchArchives();
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteItem) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/archives/${deleteItem.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Gagal menghapus arsip');
      }

      setSuccessMsg(`Arsip "${deleteItem.nomor_surat}" berhasil dihapus dari sistem dan GridFS`);
      setDeleteItem(null);
      fetchArchives();
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const months = [
    { value: '1', label: 'Januari' },
    { value: '2', label: 'Februari' },
    { value: '3', label: 'Maret' },
    { value: '4', label: 'April' },
    { value: '5', label: 'Mei' },
    { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' },
    { value: '8', label: 'Agustus' },
    { value: '9', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => (currentYear - 3 + i).toString());

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Data Berkas Arsip Digital
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '2px' }}>
            Daftar lengkap surat masuk dan surat keluar dengan penelusuran terpadu dan penyimpanan GridFS.
          </p>
        </div>

        <Link
          href="/dashboard/input"
          id="btn-tambah-arsip"
          className="btn btn-primary"
        >
          <FilePlus size={18} />
          Input Arsip Baru
        </Link>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div
          className="alert alert-success"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} />
            <div>{successMsg}</div>
          </div>
          <button
            onClick={() => setSuccessMsg('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <div>{errorMsg}</div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px',
            alignItems: 'flex-end',
          }}
        >
          {/* Text search with debounce */}
          <div style={{ gridColumn: 'span 2' }}>
            <label className="form-label" htmlFor="archive-search-input">
              <Search size={15} />
              Cari Arsip (Debounced)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="archive-search-input"
                type="text"
                className="form-input"
                placeholder="Cari nomor surat, perihal, pihak (kepada), atau tanggal..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '38px' }}
              />
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Filter Jenis Arsip */}
          <div>
            <label className="form-label" htmlFor="filter-jenis">
              <Tag size={15} />
              Jenis Arsip
            </label>
            <select
              id="filter-jenis"
              className="form-select"
              value={jenisArsip}
              onChange={(e) => {
                setJenisArsip(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">Semua Jenis</option>
              <option value="Surat masuk">Surat Masuk</option>
              <option value="Surat keluar">Surat Keluar</option>
            </select>
          </div>

          {/* Filter Bulan */}
          <div>
            <label className="form-label" htmlFor="filter-bulan">
              <Calendar size={15} />
              Bulan
            </label>
            <select
              id="filter-bulan"
              className="form-select"
              value={bulan}
              onChange={(e) => {
                setBulan(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">Semua Bulan</option>
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Tahun */}
          <div>
            <label className="form-label" htmlFor="filter-tahun">
              <Calendar size={15} />
              Tahun
            </label>
            <select
              id="filter-tahun"
              className="form-select"
              value={tahun}
              onChange={(e) => {
                setTahun(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">Semua Tahun</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active filter reset indicator */}
        {(debouncedSearch || jenisArsip !== 'all' || bulan !== 'all' || tahun !== 'all') && (
          <div
            style={{
              marginTop: '14px',
              paddingTop: '12px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
            }}
          >
            <div>
              Menampilkan hasil filter: <strong>{totalRecords} arsip ditemukan</strong>
            </div>
            <button
              onClick={() => {
                setSearchTerm('');
                setDebouncedSearch('');
                setJenisArsip('all');
                setBulan('all');
                setTahun('all');
                setPage(1);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Reset Semua Filter
            </button>
          </div>
        )}
      </div>

      {/* Archive List Table */}
      <div className="table-container" id="archive-list-container">
        <div className="table-scroll">
          <table className="table" id="archive-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>No</th>
                <th style={{ width: '130px' }}>Jenis Arsip</th>
                <th style={{ width: '180px' }}>Nomor Surat</th>
                <th style={{ width: '120px' }}>Tanggal</th>
                <th style={{ width: '220px' }}>Kepada / Pengirim</th>
                <th>Perihal</th>
                <th style={{ width: '130px' }}>Berkas</th>
                <th style={{ width: '160px', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Memuat data arsip...
                  </td>
                </tr>
              ) : archives.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '50px 20px' }}>
                    <FolderArchive size={40} style={{ color: '#cbd5e1', marginBottom: '8px' }} />
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                      Tidak ada dokumen arsip ditemukan
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Coba sesuaikan kata kunci pencarian atau reset filter.
                    </div>
                  </td>
                </tr>
              ) : (
                archives.map((item, index) => (
                  <tr key={item.id} id={`archive-row-${item.id}`}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {(page - 1) * 20 + index + 1}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          item.jenis_arsip === 'Surat masuk' ? 'badge-masuk' : 'badge-keluar'
                        }`}
                      >
                        {item.jenis_arsip}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                      {item.nomor_surat}
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.84rem' }}>
                      {item.tanggal_surat}
                    </td>
                    <td style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.kepada}>
                      {item.kepada}
                    </td>
                    <td style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.perihal}>
                      {item.perihal}
                    </td>
                    <td>
                      <a
                        href={`/api/archives/${item.id}/download`}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                        title="Unduh berkas dari GridFS"
                        download
                      >
                        <FileText size={13} color="var(--primary)" />
                        Unduh
                      </a>
                    </td>
                    <td>
                      {/* Task 5 Actions: read (view detail), delete, update, and download */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        {/* Read / View Detail */}
                        <button
                          type="button"
                          onClick={() => setViewItem(item)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '6px' }}
                          title="Lihat Rincian Arsip"
                          id={`action-view-${item.id}`}
                        >
                          <Eye size={15} color="var(--primary)" />
                        </button>

                        {/* Update / Edit */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '6px' }}
                          title="Perbarui Data Arsip"
                          id={`action-edit-${item.id}`}
                        >
                          <Edit size={15} color="#d97706" />
                        </button>

                        {/* Download */}
                        <a
                          href={`/api/archives/${item.id}/download`}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '6px' }}
                          title="Unduh File"
                          id={`action-download-${item.id}`}
                          download
                        >
                          <Download size={15} color="#0284c7" />
                        </a>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => setDeleteItem(item)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '6px' }}
                          title="Hapus Arsip"
                          id={`action-delete-${item.id}`}
                        >
                          <Trash2 size={15} color="var(--danger)" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Task 5 Constraint: Pagination with a maximum of 20 items per page */}
        <div className="pagination" id="archives-pagination">
          <div>
            Menampilkan{' '}
            <strong>
              {totalRecords === 0 ? 0 : (page - 1) * 20 + 1} -{' '}
              {Math.min(page * 20, totalRecords)}
            </strong>{' '}
            dari <strong>{totalRecords}</strong> arsip (Maksimal 20 item per halaman)
          </div>

          <div className="pagination-controls">
            <button
              className="page-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              id="pagination-prev-btn"
            >
              &larr; Sebelumnya
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .map((p, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev && p - prev > 1;
                return (
                  <span key={p} style={{ display: 'flex', alignItems: 'center' }}>
                    {showEllipsis && <span style={{ padding: '0 4px' }}>...</span>}
                    <button
                      className={`page-btn ${p === page ? 'active' : ''}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  </span>
                );
              })}

            <button
              className="page-btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              id="pagination-next-btn"
            >
              Selanjutnya &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* DETAIL MODAL (Read) */}
      {viewItem && (
        <div className="modal-overlay" onClick={() => setViewItem(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '640px' }}
            id="view-detail-modal"
          >
            <div className="modal-header">
              <div>
                <span
                  className={`badge ${
                    viewItem.jenis_arsip === 'Surat masuk' ? 'badge-masuk' : 'badge-keluar'
                  }`}
                  style={{ marginBottom: '6px' }}
                >
                  {viewItem.jenis_arsip}
                </span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{viewItem.nomor_surat}</div>
              </div>
              <button
                onClick={() => setViewItem(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    TANGGAL SURAT
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{viewItem.tanggal_surat}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    PIHAK (KEPADA)
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{viewItem.kepada}</div>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  PERIHAL
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
                  {viewItem.perihal}
                </div>
              </div>

              {viewItem.keterangan && (
                <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    KETERANGAN
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginTop: '2px' }}>
                    {viewItem.keterangan}
                  </div>
                </div>
              )}

              {/* GridFS File Info */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--primary-light)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FileText size={22} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                      {viewItem.file_name || 'arsip_dokumen'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Tersimpan di MongoDB GridFS (ID: {viewItem.data.substring(0, 10)}...)
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <a
                    href={`/api/archives/${viewItem.id}/preview`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm"
                    title="Buka pratinjau berkas di tab baru"
                  >
                    <ExternalLink size={14} />
                    Lihat
                  </a>
                  <a
                    href={`/api/archives/${viewItem.id}/download`}
                    className="btn btn-primary btn-sm"
                    download
                  >
                    <Download size={14} />
                    Unduh
                  </a>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '20px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border-subtle)',
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                }}
              >
                <div>Petugas Input: <strong>{viewItem.uploader_name}</strong></div>
                <div>ID Pengguna: <code>{viewItem.user_id}</code></div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setViewItem(null)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPDATE MODAL (Edit) */}
      {editItem && (
        <div className="modal-overlay" onClick={() => setEditItem(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '640px' }}
            id="edit-archive-modal"
          >
            <form onSubmit={handleSaveEdit}>
              <div className="modal-header">
                <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                  Perbarui Data Arsip
                </div>
                <button
                  type="button"
                  onClick={() => setEditItem(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Jenis Arsip</label>
                  <select
                    className="form-select"
                    value={editJenisArsip}
                    onChange={(e) => setEditJenisArsip(e.target.value as JenisArsip)}
                  >
                    <option value="Surat masuk">Surat masuk</option>
                    <option value="Surat keluar">Surat keluar</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Nomor Surat</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      value={editNomorSurat}
                      onChange={(e) => setEditNomorSurat(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tanggal Surat</label>
                    <input
                      type="date"
                      className="form-input"
                      required
                      value={editTanggalSurat}
                      onChange={(e) => setEditTanggalSurat(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Pihak / Asal / Tujuan (Kepada)</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={editKepada}
                    onChange={(e) => setEditKepada(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Perihal</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={editPerihal}
                    onChange={(e) => setEditPerihal(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Keterangan</label>
                  <textarea
                    className="form-textarea"
                    value={editKeterangan}
                    onChange={(e) => setEditKeterangan(e.target.value)}
                  />
                </div>

                {/* Optional Replace File */}
                <div className="form-group">
                  <label className="form-label">
                    Ganti Berkas Dokumen (Opsional)
                  </label>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    File saat ini: <strong>{editItem.file_name || 'arsip_dokumen'}</strong>. Unggah berkas baru jika ingin memperbarui file di GridFS.
                  </div>
                  <input
                    type="file"
                    className="form-input"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setEditFile(e.target.files[0]);
                      }
                    }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditItem(null)}
                  disabled={actionLoading}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteItem && (
        <div className="modal-overlay" onClick={() => setDeleteItem(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '480px' }}
            id="delete-archive-modal"
          >
            <div className="modal-header">
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--danger)' }}>
                Konfirmasi Hapus Arsip
              </div>
              <button
                onClick={() => setDeleteItem(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ color: 'var(--text-main)', lineHeight: 1.5 }}>
                Apakah Anda yakin ingin menghapus arsip dengan nomor surat:
              </p>
              <div
                style={{
                  margin: '14px 0',
                  padding: '12px',
                  backgroundColor: 'var(--danger-light)',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 700,
                  color: 'var(--danger)',
                }}
              >
                {deleteItem.nomor_surat} &bull; {deleteItem.perihal}
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Tindakan ini akan menghapus catatan arsip beserta seluruh berkas binary dokumen yang tersimpan di MongoDB GridFS secara permanen.
              </p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeleteItem(null)}
                disabled={actionLoading}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmDelete}
                disabled={actionLoading}
                id="btn-confirm-delete-archive"
              >
                {actionLoading ? 'Menghapus...' : 'Ya, Hapus Arsip'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ArchivesPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Memuat arsip...</div>}>
      <ArchivesContent />
    </Suspense>
  );
}
