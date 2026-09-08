import { ObjectId } from 'mongodb';

export type JenisArsip = 'Surat masuk' | 'Surat keluar';

export const VALID_JENIS_ARSIP: readonly [JenisArsip, JenisArsip] = ['Surat masuk', 'Surat keluar'];

export function isValidJenisArsip(val: unknown): val is JenisArsip {
  return val === 'Surat masuk' || val === 'Surat keluar';
}

export type UserRole = 'admin' | 'user';
export type UserStatus = 'pending' | 'confirmed';

export interface UserDocument {
  _id?: ObjectId;
  username: string;
  password: string;
  nama_lengkap: string;
  role: UserRole;
  status: UserStatus;
  created_at: Date;
  updated_at: Date;
}

export interface UserPublicProfile {
  id: string;
  username: string;
  nama_lengkap: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
}

export interface ArchiveDocument {
  _id?: ObjectId;
  kepada: string;
  perihal: string;
  nomor_surat: string;
  tanggal_surat: string; // YYYY-MM-DD
  jenis_arsip: JenisArsip;
  keterangan?: string; // omitempty
  user_id: string; // Auto-filled from session
  data: ObjectId; // GridFS file ID
  file_name?: string;
  file_size?: number;
  file_type?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ArchiveResponseItem {
  id: string;
  kepada: string;
  perihal: string;
  nomor_surat: string;
  tanggal_surat: string;
  jenis_arsip: JenisArsip;
  keterangan?: string;
  user_id: string;
  data: string; // GridFS file ID as string
  file_name?: string;
  file_size?: number;
  file_type?: string;
  uploader_name?: string;
  created_at: string;
  updated_at: string;
}
