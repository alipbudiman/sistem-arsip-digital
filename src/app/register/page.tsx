'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building2, Lock, User, CheckCircle2, AlertCircle, ArrowRight, UserPlus, Clock } from 'lucide-react';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [namaLengkap, setNamaLengkap] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState<{ message: string; username: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok!');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Kata sandi minimal 6 karakter!');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          nama_lengkap: namaLengkap,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Pendaftaran gagal');
        setLoading(false);
        return;
      }

      setSuccessData({
        message: data.message,
        username,
      });
      setLoading(false);
    } catch (err) {
      console.error('Register error:', err);
      setErrorMsg('Gagal terhubung ke server');
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backgroundColor: '#f1f5f9',
        backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '480px' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              boxShadow: '0 8px 20px var(--primary-glow)',
              marginBottom: '16px',
            }}
          >
            <Building2 size={32} />
          </Link>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Registrasi Akun Petugas Baru
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
            Kantor DPD RI Perwakilan Provinsi Sumatera Barat
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '32px', boxShadow: 'var(--shadow-lg)' }}>
          {successData ? (
            <div style={{ textAlign: 'center', padding: '10px 0' }} id="register-success-box">
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--warning-light)',
                  color: 'var(--warning)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 18px',
                }}
              >
                <Clock size={34} />
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
                Pendaftaran Berhasil!
              </h2>
              <div className="badge badge-pending" style={{ fontSize: '0.85rem', padding: '6px 14px', marginBottom: '16px' }}>
                Status: PENDING (Menunggu Konfirmasi)
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '24px' }}>
                Akun dengan username <strong style={{ color: 'var(--text-main)' }}>{successData.username}</strong> telah terdaftar. Sesuai kebijakan keamanan, akun baru tidak dapat langsung login sampai <strong>Administrator Utama</strong> mengonfirmasi status aktivasi Anda.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Link
                  href="/login"
                  id="success-goto-login-btn"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px' }}
                >
                  Kembali ke Halaman Login
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="alert alert-danger" id="register-error-alert">
                  <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>{errorMsg}</div>
                </div>
              )}

              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--warning-light)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #fed7aa',
                  fontSize: '0.8rem',
                  color: '#9a3412',
                  marginBottom: '20px',
                  display: 'flex',
                  gap: '8px',
                }}
              >
                <Clock size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Informasi Persetujuan:</strong> Akun baru akan berstatus <em>Pending</em> dan memerlukan konfirmasi dari Administrator sebelum dapat masuk.
                </div>
              </div>

              <form onSubmit={handleSubmit} id="register-form">
                <div className="form-group">
                  <label className="form-label" htmlFor="nama_lengkap">
                    <User size={16} />
                    Nama Lengkap & Gelar <span className="required">*</span>
                  </label>
                  <input
                    id="nama_lengkap"
                    name="nama_lengkap"
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Rahmat Hidayat, S.IP"
                    required
                    value={namaLengkap}
                    onChange={(e) => setNamaLengkap(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="username">
                    <UserPlus size={16} />
                    Username Akun <span className="required">*</span>
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    className="form-input"
                    placeholder="Contoh: rahmat_dpd"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="password">
                    <Lock size={16} />
                    Kata Sandi <span className="required">*</span>
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    className="form-input"
                    placeholder="Minimal 6 karakter"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="confirmPassword">
                    <Lock size={16} />
                    Ulangi Kata Sandi <span className="required">*</span>
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    className="form-input"
                    placeholder="Ulangi kata sandi di atas"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>

                <button
                  type="submit"
                  id="register-submit-btn"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px', marginTop: '10px' }}
                  disabled={loading}
                >
                  {loading ? 'Mendaftarkan...' : 'Daftar Akun Baru'}
                  <ArrowRight size={18} />
                </button>
              </form>

              <div
                style={{
                  marginTop: '24px',
                  paddingTop: '20px',
                  borderTop: '1px solid var(--border-subtle)',
                  textAlign: 'center',
                  fontSize: '0.875rem',
                  color: 'var(--text-muted)',
                }}
              >
                Sudah memiliki akun?{' '}
                <Link
                  href="/login"
                  id="goto-login-link"
                  style={{ color: 'var(--primary)', fontWeight: 700 }}
                >
                  Masuk ke sini
                </Link>
              </div>
            </>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link href="/" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            &larr; Kembali ke Beranda Utama
          </Link>
        </div>
      </div>
    </div>
  );
}
