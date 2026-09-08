import Link from 'next/link';
import {
  FileText,
  ShieldCheck,
  Search,
  Download,
  Database,
  Users,
  ArrowRight,
  Inbox,
  Send,
  Building2,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <header
        style={{
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: '#ffffff',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '72px',
          }}
        >
          {/* Institution Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                backgroundColor: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 10px var(--primary-glow)',
              }}
            >
              <Building2 size={24} />
            </div>
            <div>
              <div
                style={{
                  fontSize: '1rem',
                  fontWeight: 800,
                  color: 'var(--primary)',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.2,
                }}
              >
                KANTOR DPD RI
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--accent)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                Provinsi Sumatera Barat
              </div>
            </div>
          </div>

          {/* Top-Right Action / Login Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link
              href="/login"
              id="top-nav-login-btn"
              className="btn btn-primary"
              style={{
                padding: '9px 22px',
                fontSize: '0.9rem',
                borderRadius: 'var(--radius-md)',
              }}
            >
              Masuk / Login
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        style={{
          background: 'linear-gradient(135deg, #06281e 0%, #064e3b 55%, #047857 100%)',
          color: '#ffffff',
          padding: '80px 0 90px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle decorative background glow */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            right: '-10%',
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(217, 119, 6, 0.25) 0%, rgba(217, 119, 6, 0) 70%)',
            pointerEvents: 'none',
          }}
        />

        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ maxWidth: '820px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(8px)',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#fde68a',
                marginBottom: '24px',
                border: '1px solid rgba(253, 230, 138, 0.3)',
              }}
            >
              <ShieldCheck size={16} />
              Sistem Tata Kelola Administrasi Persuratan Terpadu
            </div>

            <h1
              style={{
                fontSize: '2.75rem',
                fontWeight: 800,
                lineHeight: 1.18,
                letterSpacing: '-0.02em',
                marginBottom: '20px',
              }}
            >
              Sistem Informasi Pengelolaan Arsip Digital Resmi
            </h1>

            <p
              style={{
                fontSize: '1.15rem',
                lineHeight: 1.65,
                color: '#d1fae5',
                marginBottom: '36px',
                maxWidth: '740px',
              }}
            >
              Platform digital terpadu untuk pencatatan, pengarsipan, penyimpanan berkas biner aman
              (MongoDB GridFS), penelusuran akurat, serta rekapitulasi data surat masuk dan surat keluar
              pada Kantor Dewan Perwakilan Daerah Republik Indonesia (DPD RI) Perwakilan Provinsi Sumatera Barat.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
              <Link
                href="/login"
                id="hero-login-btn"
                className="btn"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: '#ffffff',
                  padding: '12px 28px',
                  fontSize: '1rem',
                  boxShadow: '0 6px 16px rgba(217, 119, 6, 0.35)',
                }}
              >
                Masuk ke Portal Arsip
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/register"
                id="hero-register-btn"
                className="btn"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  padding: '12px 24px',
                  fontSize: '1rem',
                  backdropFilter: 'blur(4px)',
                }}
              >
                Registrasi Petugas Baru
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights & Features Grid */}
      <section style={{ padding: '70px 0', flex: 1, backgroundColor: '#f8fafc' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 50px' }}>
            <h2
              style={{
                fontSize: '1.85rem',
                fontWeight: 800,
                color: 'var(--text-main)',
                marginBottom: '12px',
              }}
            >
              Layanan & Kapabilitas Sistem
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
              Dirancang untuk menjaga keandalan tata naskah dinas, kerahasiaan arsip, dan kecepatan akses dokumen negara.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
            }}
          >
            {/* Card 1 */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--masuk-light)',
                  color: 'var(--masuk-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Inbox size={24} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Tata Kelola Surat Masuk</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Pencatatan sistematis untuk seluruh surat masuk dari kementerian, lembaga pemerintah daerah, dan masyarakat dengan pencatatan nomor, tanggal, dan perihal lengkap.
              </p>
            </div>

            {/* Card 2 */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--keluar-light)',
                  color: 'var(--keluar-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Send size={24} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Tata Kelola Surat Keluar</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Perekaman surat dinas yang diterbitkan oleh Kantor DPD RI Provinsi Sumatera Barat, lengkap dengan tujuan (kepada) dan status pengarsipan digital.
              </p>
            </div>

            {/* Card 3 */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Database size={24} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Penyimpanan GridFS Terpadu</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Berkas biner dokumen (PDF, hasil scan, lampiran) disimpan utuh di kluster MongoDB GridFS tanpa batas ukuran berkas yang membebani server web.
              </p>
            </div>

            {/* Card 4 */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '10px',
                  backgroundColor: '#f3e8ff',
                  color: '#7e22ce',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Search size={24} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Penelusuran Cepat (Debounce)</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Mesin pencarian responsif dengan fitur debounce otomatis berdasarkan nomor surat, perihal, pihak penerima/pengirim, tanggal, maupun periode tahunan.
              </p>
            </div>

            {/* Card 5 */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--success-light)',
                  color: 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Download size={24} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Rekapitulasi & Ekspor Dokumen</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Laporan periodik bulanan dan tahunan yang dapat diunduh langsung ke format Microsoft Excel (.xlsx) dan PDF resmi ber-kop instansi.
              </p>
            </div>

            {/* Card 6 */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--warning-light)',
                  color: '#c2410c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Users size={24} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Kontrol Akses Terverifikasi</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Hierarki peran ganda: Administrator dan Petugas. Akun petugas baru melalui mekanisme persetujuan (pending approval) sebelum memperoleh hak akses.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-color)',
          backgroundColor: '#ffffff',
          padding: '30px 0',
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div>
            <strong>Kantor DPD RI Provinsi Sumatera Barat</strong>
            <div>Sistem Informasi Manajemen Arsip Digital &copy; 2026. Hak Cipta Dilindungi.</div>
          </div>
          <div>
            <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
              Masuk ke Sistem &rarr;
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
