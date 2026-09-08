'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  UserCheck,
  Clock,
  Trash2,
  Edit,
  Shield,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Lock,
  User,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react';
import { UserPublicProfile, UserRole, UserStatus } from '@/lib/models';

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserPublicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editUser, setEditUser] = useState<UserPublicProfile | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserPublicProfile | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Add form
  const [addUsername, setAddUsername] = useState('');
  const [addNamaLengkap, setAddNamaLengkap] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addRole, setAddRole] = useState<UserRole>('user');
  const [addStatus, setAddStatus] = useState<UserStatus>('confirmed');

  // Edit form
  const [editNamaLengkap, setEditNamaLengkap] = useState('');
  const [editPassword, setEditPassword] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const params = new URLSearchParams();
      if (roleFilter !== 'all') params.set('role', roleFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('search', search);

      const res = await fetch(`/api/users?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('Hanya Administrator yang memiliki hak akses ke modul ini');
        }
        throw new Error('Gagal memuat pengguna');
      }

      const data = await res.json();
      setUsers(data.users || []);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Task 7: Confirm pending Petugas (user) account
  const handleConfirmUser = async (user: UserPublicProfile) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed' }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Gagal mengonfirmasi pengguna');
      }

      setSuccessMsg(`Akun "${user.username}" berhasil dikonfirmasi & diaktifkan! Pengguna kini dapat login.`);
      fetchUsers();
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  // Task 7: Upgrade a user account to admin (or toggle role)
  const handleToggleRole = async (user: UserPublicProfile) => {
    const targetRole: UserRole = user.role === 'admin' ? 'user' : 'admin';
    const confirmMessage =
      targetRole === 'admin'
        ? `Tingkatkan akun "${user.username}" menjadi ADMINISTRATOR?`
        : `Ubah akun "${user.username}" kembali menjadi PETUGAS (User)?`;

    if (!confirm(confirmMessage)) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: targetRole }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Gagal memperbarui peran');
      }

      setSuccessMsg(`Peran akun "${user.username}" berhasil diubah menjadi ${targetRole.toUpperCase()}`);
      fetchUsers();
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  // Create new user (Admin / Petugas)
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: addUsername,
          nama_lengkap: addNamaLengkap,
          password: addPassword,
          role: addRole,
          status: addStatus,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Gagal menambahkan pengguna');
      }

      setSuccessMsg(`Pengguna "${addUsername}" (${addRole}) berhasil ditambahkan`);
      setShowAddModal(false);
      setAddUsername('');
      setAddNamaLengkap('');
      setAddPassword('');
      setAddRole('user');
      setAddStatus('confirmed');
      fetchUsers();
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  // Edit user profile
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setActionLoading(true);
    try {
      const payload: { nama_lengkap: string; password?: string } = {
        nama_lengkap: editNamaLengkap,
      };
      if (editPassword) {
        payload.password = editPassword;
      }

      const res = await fetch(`/api/users/${editUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Gagal memperbarui data pengguna');
      }

      setSuccessMsg(`Data akun "${editUser.username}" berhasil diperbarui`);
      setEditUser(null);
      fetchUsers();
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete user
  const handleDeleteConfirm = async () => {
    if (!deleteUser) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/users/${deleteUser.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Gagal menghapus pengguna');
      }

      setSuccessMsg(`Pengguna "${deleteUser.username}" berhasil dihapus dari sistem`);
      setDeleteUser(null);
      fetchUsers();
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const pendingUsers = users.filter((u) => u.status === 'pending');

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
            Manajemen Pengguna & Otorisasi
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '2px' }}>
            Kelola akun Admin dan Petugas, konfirmasi pendaftaran pending, dan peningkatan hak akses akun.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          id="btn-tambah-pengguna"
          className="btn btn-primary"
        >
          <UserPlus size={18} />
          Tambah Pengguna Baru
        </button>
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

      {/* Pending Confirmation Queue (Task 7 requirement) */}
      {pendingUsers.length > 0 && (
        <div
          className="card"
          style={{
            marginBottom: '28px',
            borderLeft: '4px solid var(--warning)',
            backgroundColor: '#fffbeb',
          }}
          id="pending-users-queue"
        >
          <div className="card-header" style={{ borderBottomColor: '#fef3c7' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={20} color="var(--warning)" />
              <div>
                <div className="card-title" style={{ color: '#92400e', fontSize: '1.1rem' }}>
                  Antrean Konfirmasi Akun Petugas ({pendingUsers.length})
                </div>
                <div className="card-subtitle" style={{ color: '#b45309' }}>
                  Akun di bawah ini baru mendaftar dan belum dapat login sampai Anda mengonfirmasinya.
                </div>
              </div>
            </div>
          </div>

          <div className="table-container" style={{ backgroundColor: '#ffffff' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Nama Lengkap</th>
                  <th>Username</th>
                  <th>Peran Diinginkan</th>
                  <th>Waktu Daftar</th>
                  <th style={{ textAlign: 'center' }}>Aksi Persetujuan</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map((pUser) => (
                  <tr key={pUser.id}>
                    <td style={{ fontWeight: 700 }}>{pUser.nama_lengkap}</td>
                    <td>@{pUser.username}</td>
                    <td>
                      <span className="badge badge-pending">Petugas (Pending)</span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {pUser.created_at ? new Date(pUser.created_at).toLocaleString('id-ID') : '-'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <button
                          onClick={() => handleConfirmUser(pUser)}
                          className="btn btn-sm btn-primary"
                          disabled={actionLoading}
                          id={`btn-confirm-${pUser.id}`}
                          style={{ backgroundColor: 'var(--success)', borderColor: 'var(--success)' }}
                        >
                          <UserCheck size={14} />
                          Konfirmasi / Aktifkan
                        </button>
                        <button
                          onClick={() => setDeleteUser(pUser)}
                          className="btn btn-sm btn-outline-danger"
                          disabled={actionLoading}
                          title="Tolak & Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '18px', marginBottom: '24px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px',
          }}
        >
          <div>
            <label className="form-label">
              <Search size={15} />
              Cari Nama / Username
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Ketik nama atau username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label">Filter Peran (Role)</label>
            <select
              className="form-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">Semua Peran</option>
              <option value="admin">Admin</option>
              <option value="user">Petugas (User)</option>
            </select>
          </div>

          <div>
            <label className="form-label">Filter Status</label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Semua Status</option>
              <option value="confirmed">Confirmed (Aktif)</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Users Table */}
      <div className="table-container" id="users-table-container">
        <div className="table-scroll">
          <table className="table" id="all-users-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>No</th>
                <th>Nama Lengkap</th>
                <th>Username</th>
                <th style={{ width: '130px' }}>Peran</th>
                <th style={{ width: '130px' }}>Status Akun</th>
                <th style={{ width: '150px' }}>Tanggal Dibuat</th>
                <th style={{ width: '220px', textAlign: 'center' }}>Aksi Manajemen</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Memuat daftar pengguna...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                    Tidak ada akun pengguna ditemukan.
                  </td>
                </tr>
              ) : (
                users.map((u, i) => (
                  <tr key={u.id} id={`user-row-${u.id}`}>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td style={{ fontWeight: 700 }}>{u.nama_lengkap}</td>
                    <td>
                      <code>@{u.username}</code>
                    </td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-admin' : 'badge-user'}`}>
                        {u.role === 'admin' ? 'Administrator' : 'Petugas'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.status === 'confirmed' ? 'badge-success' : 'badge-pending'}`}>
                        {u.status === 'confirmed' ? 'Aktif' : 'Pending'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID') : '-'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        {/* If pending, quick confirm button */}
                        {u.status === 'pending' && (
                          <button
                            onClick={() => handleConfirmUser(u)}
                            className="btn btn-sm btn-primary"
                            style={{ backgroundColor: 'var(--success)', padding: '4px 8px', fontSize: '0.72rem' }}
                            title="Konfirmasi & Aktifkan"
                          >
                            <UserCheck size={13} />
                            Aktifkan
                          </button>
                        )}

                        {/* Task 7: Support upgrading a user account to admin / toggling role */}
                        <button
                          onClick={() => handleToggleRole(u)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                          title={
                            u.role === 'admin'
                              ? 'Turunkan ke Petugas'
                              : 'Tingkatkan menjadi Administrator'
                          }
                          id={`btn-toggle-role-${u.id}`}
                        >
                          {u.role === 'admin' ? (
                            <>
                              <ArrowDownCircle size={13} color="#b45309" />
                              Ke Petugas
                            </>
                          ) : (
                            <>
                              <ArrowUpCircle size={13} color="#7e22ce" />
                              Jadikan Admin
                            </>
                          )}
                        </button>

                        {/* Edit profile */}
                        <button
                          onClick={() => {
                            setEditUser(u);
                            setEditNamaLengkap(u.nama_lengkap);
                            setEditPassword('');
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '6px' }}
                          title="Edit Pengguna"
                          id={`btn-edit-user-${u.id}`}
                        >
                          <Edit size={14} color="#d97706" />
                        </button>

                        {/* Delete user */}
                        <button
                          onClick={() => setDeleteUser(u)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '6px' }}
                          title="Hapus Pengguna"
                          id={`btn-delete-user-${u.id}`}
                        >
                          <Trash2 size={14} color="var(--danger)" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD USER */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '520px' }}
            id="add-user-modal"
          >
            <form onSubmit={handleAddSubmit}>
              <div className="modal-header">
                <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>Tambah Pengguna Baru</div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nama Lengkap & Gelar</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="Contoh: Syafruddin, S.Kom"
                    value={addNamaLengkap}
                    onChange={(e) => setAddNamaLengkap(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="Contoh: syafruddin_dpd"
                    value={addUsername}
                    onChange={(e) => setAddUsername(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Kata Sandi</label>
                  <input
                    type="password"
                    className="form-input"
                    required
                    placeholder="Minimal 6 karakter"
                    value={addPassword}
                    onChange={(e) => setAddPassword(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Peran (Role)</label>
                    <select
                      className="form-select"
                      value={addRole}
                      onChange={(e) => setAddRole(e.target.value as UserRole)}
                    >
                      <option value="user">Petugas (User)</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Status Awal</label>
                    <select
                      className="form-select"
                      value={addStatus}
                      onChange={(e) => setAddStatus(e.target.value as UserStatus)}
                    >
                      <option value="confirmed">Confirmed (Langsung Aktif)</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                  disabled={actionLoading}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Menyimpan...' : 'Tambah Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER */}
      {editUser && (
        <div className="modal-overlay" onClick={() => setEditUser(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '500px' }}
            id="edit-user-modal"
          >
            <form onSubmit={handleEditSubmit}>
              <div className="modal-header">
                <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                  Perbarui Akun @{editUser.username}
                </div>
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nama Lengkap</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={editNamaLengkap}
                    onChange={(e) => setEditNamaLengkap(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Kata Sandi Baru (Kosongkan jika tidak ingin mengubah)
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Minimal 6 karakter"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditUser(null)}
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

      {/* MODAL: DELETE USER */}
      {deleteUser && (
        <div className="modal-overlay" onClick={() => setDeleteUser(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '460px' }}
            id="delete-user-modal"
          >
            <div className="modal-header">
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--danger)' }}>
                Hapus Akun Pengguna
              </div>
              <button
                onClick={() => setDeleteUser(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ color: 'var(--text-main)', lineHeight: 1.5 }}>
                Apakah Anda yakin ingin menghapus akun pengguna berikut?
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
                @{deleteUser.username} &bull; {deleteUser.nama_lengkap} ({deleteUser.role})
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Tindakan ini tidak dapat dibatalkan. Pengguna tidak akan dapat mengakses sistem ini lagi.
              </p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeleteUser(null)}
                disabled={actionLoading}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteConfirm}
                disabled={actionLoading}
                id="btn-confirm-delete-user"
              >
                {actionLoading ? 'Menghapus...' : 'Ya, Hapus Akun'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
