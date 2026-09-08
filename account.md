# Akun Master & Informasi Sistem — Kantor DPD RI Provinsi Sumatera Barat

Dokumen ini berisi informasi kredensial akun master administrator dan konfigurasi akses sistem untuk **Sistem Informasi Manajemen Arsip Digital Kantor DPD RI Perwakilan Provinsi Sumatera Barat**.

---

## 🔑 Kredensial Akun Master Administrator

| Parameter | Keterangan |
| :--- | :--- |
| **URL Portal Login** | [http://localhost:3000/login](http://localhost:3000/login) |
| **Username** | `admin` |
| **Password** | `AdminPassword123!` |
| **Nama Lengkap** | Administrator Utama Kantor DPD RI Sumbar |
| **Role (Peran)** | `admin` (Hak akses penuh: CRUD arsip, laporan, konfirmasi akun baru, upgrade role) |
| **Status Akun** | `confirmed` (Aktif) |

> [!NOTE]
> Akun di atas telah di-seed dan terverifikasi langsung pada basis data **MongoDB Atlas**. Anda dapat langsung masuk melalui tautan login di atas.

---

## 🌐 Konfigurasi Basis Data (MongoDB Atlas)

- **Cluster**: `cluster0.v57ssra.mongodb.net`
- **Database**: `dpd_arsip_db`
- **Penyimpanan Berkas Binary**: MongoDB GridFS (`fs.files` & `fs.chunks`)
- **Connection URI**:
  ```
  mongodb+srv://alifbudiman_db_user:Ek6ElbNc6PWttEkO@cluster0.v57ssra.mongodb.net/dpd_arsip_db?retryWrites=true&w=majority
  ```

---

## 🛠️ Script Bootstrap / Reset Akun Admin

Jika sewaktu-waktu ingin mengatur ulang (reset) atau menginjeksi akun master admin baru secara langsung ke basis data MongoDB Atlas:

```bash
# Jalankan script seed bawaan
python seed_admin.py

# Atau tentukan kredensial khusus:
python seed_admin.py --username admin --password "PasswordBaruAnda!" --nama "Nama Administrator"
```

---

## 👥 Alur Otorisasi & Akun Petugas Baru

1. Petugas mendaftar secara mandiri melalui `/register`.
2. Akun baru secara otomatis berstatus **PENDING** dan diblokir dari login sampai disetujui.
3. Master Administrator masuk ke menu **Manajemen Pengguna** (`/dashboard/users`), meninjau pendaftaran, dan menekan tombol **"Konfirmasi / Aktifkan"**.
4. Administrator juga dapat meningkatkan akun petugas menjadi **Administrator** menggunakan tombol **"Jadikan Admin"**.
