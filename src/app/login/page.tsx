'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, Lock, User, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isPendingAccount, setIsPendingAccount] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsPendingAccount(false);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Login gagal, periksa kembali username dan password Anda');
        if (data.isPending) {
          setIsPendingAccount(true);
        }
        setLoading(false);
        return;
      }

      // Successful login -> Redirect to post-login dashboard (Task 3)
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      console.error('Login error:', err);
      setErrorMsg('Gagal terhubung ke server. Silakan coba lagi.');
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
      <div style={{ width: '100%', maxWidth: '440px' }}>
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
            Kantor DPD RI Prov. Sumbar
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
            Portal Masuk Sistem Informasi Arsip Digital
          </p>
        </div>

        {/* Login Card */}
        <div className="card" style={{ padding: '32px', boxShadow: 'var(--shadow-lg)' }}>
          {errorMsg && (
            <div
              className={`alert ${isPendingAccount ? 'alert-warning' : 'alert-danger'}`}
              id="login-error-alert"
            >
              <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>{isPendingAccount ? 'Akun Belum Dikonfirmasi' : 'Gagal Masuk'}</strong>
                <div style={{ marginTop: '4px' }}>{errorMsg}</div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} id="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="username">
                <User size={16} />
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                className="form-input"
                placeholder="Masukkan username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                <Lock size={16} />
                Kata Sandi
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className="form-input"
                placeholder="Masukkan kata sandi"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              id="login-submit-btn"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', marginTop: '10px' }}
              disabled={loading}
            >
              {loading ? 'Memproses...' : 'Masuk ke Sistem'}
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
            Belum memiliki akun petugas?{' '}
            <Link
              href="/register"
              id="goto-register-link"
              style={{ color: 'var(--primary)', fontWeight: 700 }}
            >
              Daftar di sini
            </Link>
          </div>
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
