'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FolderArchive,
  Inbox,
  Send,
  FilePlus,
  ArrowRight,
  TrendingUp,
  Clock,
  ShieldAlert,
  Calendar,
  Eye,
} from 'lucide-react';

interface StatsData {
  totalArchives: number;
  totalSuratMasuk: number;
  totalSuratKeluar: number;
  pendingUsers: number;
}

interface RecentArchive {
  id: string;
  nomor_surat: string;
  tanggal_surat: string;
  jenis_arsip: 'Surat masuk' | 'Surat keluar';
  kepada: string;
  perihal: string;
  created_at: string;
}

export default function DashboardOverviewPage() {
  const [stats, setStats] = useState<StatsData>({
    totalArchives: 0,
    totalSuratMasuk: 0,
    totalSuratKeluar: 0,
    pendingUsers: 0,
  });
  const [recent, setRecent] = useState<RecentArchive[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/dashboard/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setRecent(data.recent || []);
        }
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  const total = stats.totalArchives || 0;
  const masukPct = total > 0 ? Math.round((stats.totalSuratMasuk / total) * 100) : 0;
  const keluarPct = total > 0 ? Math.round((stats.totalSuratKeluar / total) * 100) : 0;

  return (
    <div>
      {/* Page Heading */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Ringkasan Dashboard Arsip
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '2px' }}>
            Pemantauan statistik arsip dinas Kantor DPD RI Provinsi Sumatera Barat
          </p>
        </div>

        <Link
          href="/dashboard/input"
          id="btn-quick-input"
          className="btn btn-primary"
          style={{ padding: '10px 20px' }}
        >
          <FilePlus size={18} />
          Input Arsip Baru
        </Link>
      </div>

      {/* Admin Alert if pending users exist */}
      {stats.pendingUsers > 0 && (
        <div
          className="alert alert-warning"
          style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          id="pending-users-alert"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShieldAlert size={22} style={{ flexShrink: 0 }} />
            <div>
              <strong>Perhatian Administrator:</strong> Terdapat{' '}
              <strong>{stats.pendingUsers} akun petugas baru</strong> yang masih berstatus PENDING dan menunggu persetujuan Anda.
            </div>
          </div>
          <Link
            href="/dashboard/users"
            className="btn btn-sm btn-accent"
            style={{ flexShrink: 0, textDecoration: 'none' }}
          >
            Tinjau Pendaftaran &rarr;
          </Link>
        </div>
      )}

      {/* Required Task 3 KPI Cards: Total Archives, Surat Masuk, Surat Keluar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          marginBottom: '28px',
        }}
        id="dashboard-stats-grid"
      >
        {/* KPI 1: Total archives stored */}
        <div
          className="card"
          id="kpi-total-archives"
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderLeft: '4px solid var(--primary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                1. Total Arsip Tersimpan
              </div>
              <div
                style={{
                  fontSize: '2.4rem',
                  fontWeight: 800,
                  color: 'var(--text-main)',
                  lineHeight: 1.2,
                  marginTop: '8px',
                }}
              >
                {loading ? '...' : stats.totalArchives.toLocaleString('id-ID')}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Semua dokumen binary di MongoDB GridFS
              </div>
            </div>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FolderArchive size={28} />
            </div>
          </div>
        </div>

        {/* KPI 2: Total "Surat masuk" archives */}
        <div
          className="card"
          id="kpi-surat-masuk"
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderLeft: '4px solid var(--masuk-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                2. Total Surat Masuk
              </div>
              <div
                style={{
                  fontSize: '2.4rem',
                  fontWeight: 800,
                  color: '#0369a1',
                  lineHeight: 1.2,
                  marginTop: '8px',
                }}
              >
                {loading ? '...' : stats.totalSuratMasuk.toLocaleString('id-ID')}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {masukPct}% dari keseluruhan arsip
              </div>
            </div>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                backgroundColor: 'var(--masuk-light)',
                color: 'var(--masuk-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Inbox size={28} />
            </div>
          </div>
        </div>

        {/* KPI 3: Total "Surat keluar" archives */}
        <div
          className="card"
          id="kpi-surat-keluar"
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderLeft: '4px solid var(--keluar-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                3. Total Surat Keluar
              </div>
              <div
                style={{
                  fontSize: '2.4rem',
                  fontWeight: 800,
                  color: '#b45309',
                  lineHeight: 1.2,
                  marginTop: '8px',
                }}
              >
                {loading ? '...' : stats.totalSuratKeluar.toLocaleString('id-ID')}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {keluarPct}% dari keseluruhan arsip
              </div>
            </div>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                backgroundColor: 'var(--keluar-light)',
                color: 'var(--keluar-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Send size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* Distribution Progress Bar */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <div className="card-header" style={{ marginBottom: '14px', paddingBottom: '12px' }}>
          <div>
            <div className="card-title" style={{ fontSize: '1.05rem' }}>
              Proporsi Komposisi Arsip Digital
            </div>
            <div className="card-subtitle">Perbandingan volume Surat Masuk dan Surat Keluar</div>
          </div>
        </div>

        {/* Multi-segment progress bar */}
        <div
          style={{
            height: '14px',
            borderRadius: '999px',
            backgroundColor: '#e2e8f0',
            overflow: 'hidden',
            display: 'flex',
            marginBottom: '14px',
          }}
        >
          <div
            style={{
              width: `${masukPct}%`,
              backgroundColor: 'var(--masuk-color)',
              transition: 'width 0.5s ease',
            }}
            title={`Surat Masuk: ${masukPct}%`}
          />
          <div
            style={{
              width: `${keluarPct}%`,
              backgroundColor: 'var(--keluar-color)',
              transition: 'width 0.5s ease',
            }}
            title={`Surat Keluar: ${keluarPct}%`}
          />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '3px',
                backgroundColor: 'var(--masuk-color)',
                display: 'inline-block',
              }}
            />
            <span>
              Surat Masuk: <strong>{stats.totalSuratMasuk}</strong> ({masukPct}%)
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '3px',
                backgroundColor: 'var(--keluar-color)',
                display: 'inline-block',
              }}
            />
            <span>
              Surat Keluar: <strong>{stats.totalSuratKeluar}</strong> ({keluarPct}%)
            </span>
          </div>
        </div>
      </div>

      {/* Recent Archives Section */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title" style={{ fontSize: '1.15rem' }}>
              Arsip Terbaru Yang Ditambahkan
            </div>
            <div className="card-subtitle">5 berkas surat dinas terakhir yang disimpan di sistem</div>
          </div>
          <Link
            href="/dashboard/archives"
            id="view-all-archives-link"
            className="btn btn-secondary btn-sm"
          >
            Lihat Semua Arsip &rarr;
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Memuat arsip terbaru...
          </div>
        ) : recent.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <FolderArchive size={42} style={{ color: '#cbd5e1', marginBottom: '12px' }} />
            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>Belum ada arsip tersimpan</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px', marginBottom: '16px' }}>
              Mulai mencatat dan mengunggah dokumen surat pertama Anda.
            </p>
            <Link href="/dashboard/input" className="btn btn-primary btn-sm">
              <FilePlus size={16} />
              Input Arsip Sekarang
            </Link>
          </div>
        ) : (
          <div className="table-container">
            <table className="table" id="recent-archives-table">
              <thead>
                <tr>
                  <th>Jenis</th>
                  <th>Nomor Surat</th>
                  <th>Tanggal</th>
                  <th>Kepada</th>
                  <th>Perihal</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span
                        className={`badge ${
                          item.jenis_arsip === 'Surat masuk' ? 'badge-masuk' : 'badge-keluar'
                        }`}
                      >
                        {item.jenis_arsip}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{item.nomor_surat}</td>
                    <td>{item.tanggal_surat}</td>
                    <td>{item.kepada}</td>
                    <td
                      style={{
                        maxWidth: '260px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={item.perihal}
                    >
                      {item.perihal}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        href="/dashboard/archives"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      >
                        <Eye size={13} />
                        Buka di Daftar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
