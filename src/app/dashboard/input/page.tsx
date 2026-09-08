'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FilePlus,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Send,
  Inbox,
  Calendar,
  Tag,
  AlignLeft,
  X,
} from 'lucide-react';

export default function ArchiveInputPage() {
  const router = useRouter();

  const [jenisArsip, setJenisArsip] = useState<'Surat masuk' | 'Surat keluar'>('Surat masuk');
  const [nomorSurat, setNomorSurat] = useState('');
  const [tanggalSurat, setTanggalSurat] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [kepada, setKepada] = useState('');
  const [perihal, setPerihal] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedFile) {
      setErrorMsg('Harap pilih berkas dokumen fisik/digital (PDF/Gambar/Dokumen) untuk disimpan ke GridFS');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('jenis_arsip', jenisArsip);
      formData.append('nomor_surat', nomorSurat);
      formData.append('tanggal_surat', tanggalSurat);
      formData.append('kepada', kepada);
      formData.append('perihal', perihal);

      if (keterangan.trim()) {
        formData.append('keterangan', keterangan.trim());
      }

      // File binary stored as GridFS in MongoDB
      formData.append('file', selectedFile);

      const res = await fetch('/api/archives', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Gagal menyimpan dokumen arsip');
        setLoading(false);
        return;
      }

      // Task 4 Constraint: After a successful submit, redirect to the archive list dashboard (Task 5).
      router.push('/dashboard/archives?created=true');
      router.refresh();
    } catch (err) {
      console.error('Submit archive error:', err);
      setErrorMsg('Gagal menghubungi server untuk mengunggah arsip');
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
  };

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
          Perekaman & Input Arsip Baru
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '2px' }}>
          Formulir pencatatan arsip dinas dengan penyimpanan berkas biner langsung ke MongoDB GridFS.
        </p>
      </div>

      {errorMsg && (
        <div className="alert alert-danger" id="archive-input-error-alert">
          <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>{errorMsg}</div>
        </div>
      )}

      <div className="card" style={{ padding: '32px' }}>
        <form onSubmit={handleSubmit} id="archive-input-form">
          {/* Radio Selector for jenis_arsip */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">
              <Tag size={16} />
              Jenis Arsip <span className="required">*</span>
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '14px',
                marginTop: '6px',
              }}
            >
              <button
                type="button"
                id="btn-jenis-surat-masuk"
                onClick={() => setJenisArsip('Surat masuk')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  border:
                    jenisArsip === 'Surat masuk'
                      ? '2px solid var(--masuk-color)'
                      : '1px solid var(--border-color)',
                  backgroundColor:
                    jenisArsip === 'Surat masuk' ? 'var(--masuk-light)' : '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: jenisArsip === 'Surat masuk' ? 'var(--masuk-color)' : '#f1f5f9',
                    color: jenisArsip === 'Surat masuk' ? '#ffffff' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Inbox size={20} />
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      color: jenisArsip === 'Surat masuk' ? '#0369a1' : 'var(--text-main)',
                      fontSize: '0.95rem',
                    }}
                  >
                    Surat Masuk
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Surat diterima dari pihak luar
                  </div>
                </div>
              </button>

              <button
                type="button"
                id="btn-jenis-surat-keluar"
                onClick={() => setJenisArsip('Surat keluar')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  border:
                    jenisArsip === 'Surat keluar'
                      ? '2px solid var(--keluar-color)'
                      : '1px solid var(--border-color)',
                  backgroundColor:
                    jenisArsip === 'Surat keluar' ? 'var(--keluar-light)' : '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: jenisArsip === 'Surat keluar' ? 'var(--keluar-color)' : '#f1f5f9',
                    color: jenisArsip === 'Surat keluar' ? '#ffffff' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Send size={20} />
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      color: jenisArsip === 'Surat keluar' ? '#b45309' : 'var(--text-main)',
                      fontSize: '0.95rem',
                    }}
                  >
                    Surat Keluar
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Surat yang diterbitkan DPD RI Sumbar
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '18px',
            }}
          >
            {/* nomor_surat */}
            <div className="form-group">
              <label className="form-label" htmlFor="nomor_surat">
                Nomor Surat <span className="required">*</span>
              </label>
              <input
                id="nomor_surat"
                name="nomor_surat"
                type="text"
                className="form-input"
                placeholder="Contoh: 005/DPD-SB/III/2026"
                required
                value={nomorSurat}
                onChange={(e) => setNomorSurat(e.target.value)}
              />
            </div>

            {/* tanggal_surat */}
            <div className="form-group">
              <label className="form-label" htmlFor="tanggal_surat">
                Tanggal Surat <span className="required">*</span>
              </label>
              <input
                id="tanggal_surat"
                name="tanggal_surat"
                type="date"
                className="form-input"
                required
                value={tanggalSurat}
                onChange={(e) => setTanggalSurat(e.target.value)}
              />
            </div>
          </div>

          {/* kepada */}
          <div className="form-group">
            <label className="form-label" htmlFor="kepada">
              {jenisArsip === 'Surat masuk' ? 'Pengirim / Asal Surat (Kepada)' : 'Tujuan Surat (Kepada)'}{' '}
              <span className="required">*</span>
            </label>
            <input
              id="kepada"
              name="kepada"
              type="text"
              className="form-input"
              placeholder={
                jenisArsip === 'Surat masuk'
                  ? 'Contoh: Sekretariat Daerah Provinsi Sumatera Barat'
                  : 'Contoh: Pimpinan DPRD Provinsi Sumatera Barat'
              }
              required
              value={kepada}
              onChange={(e) => setKepada(e.target.value)}
            />
          </div>

          {/* perihal */}
          <div className="form-group">
            <label className="form-label" htmlFor="perihal">
              Perihal / Ringkasan Isi Surat <span className="required">*</span>
            </label>
            <input
              id="perihal"
              name="perihal"
              type="text"
              className="form-input"
              placeholder="Contoh: Permohonan Audiensi Aspirasi Daerah Pemilihan Sumatera Barat"
              required
              value={perihal}
              onChange={(e) => setPerihal(e.target.value)}
            />
          </div>

          {/* keterangan (optional / omitempty) */}
          <div className="form-group">
            <label className="form-label" htmlFor="keterangan">
              <AlignLeft size={16} />
              Keterangan Tambahan (Opsional)
            </label>
            <textarea
              id="keterangan"
              name="keterangan"
              className="form-textarea"
              placeholder="Catatan tambahan mengenai berkas, disposisi, atau nomor rak arsip fisik jika ada..."
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
            />
          </div>

          {/* data (GridFS binary file upload) */}
          <div className="form-group" style={{ marginBottom: '32px' }}>
            <label className="form-label">
              <UploadCloud size={16} />
              Unggah Berkas Dokumen (Tersimpan di MongoDB GridFS) <span className="required">*</span>
            </label>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              style={{
                border: isDragging ? '2px dashed var(--primary)' : '2px dashed var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '32px 20px',
                textAlign: 'center',
                backgroundColor: isDragging ? 'var(--primary-light)' : '#f8fafc',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onClick={() => document.getElementById('archive-file-input')?.click()}
            >
              <input
                type="file"
                id="archive-file-input"
                style={{ display: 'none' }}
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              />

              {selectedFile ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--primary-light)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FileText size={24} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                      {selectedFile.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Ukuran: {formatFileSize(selectedFile.size)} &bull; Format: {selectedFile.type || 'Dokumen'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="btn btn-secondary btn-icon"
                    style={{ marginLeft: '12px', padding: '6px' }}
                    title="Hapus file terpilih"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div>
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      backgroundColor: '#e2e8f0',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                    }}
                  >
                    <UploadCloud size={28} />
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1rem' }}>
                    Klik untuk memilih berkas atau seret dokumen ke area ini
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '4px' }}>
                    Format didukung: PDF, Dokumen Word, Excel, JPG, PNG (Maksimal 50 MB)
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '14px',
              paddingTop: '20px',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <Link href="/dashboard/archives" className="btn btn-secondary">
              Batal
            </Link>

            <button
              type="submit"
              id="submit-archive-btn"
              className="btn btn-primary"
              disabled={loading}
              style={{ padding: '12px 28px' }}
            >
              {loading ? 'Mengunggah ke GridFS...' : 'Simpan Dokumen Arsip'}
              <ArrowRight size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
