import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { UserDocument } from '@/lib/models';
import { hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, nama_lengkap } = body;

    if (!username || !password || !nama_lengkap) {
      return NextResponse.json(
        { error: 'Username, nama lengkap, dan password wajib diisi' },
        { status: 400 }
      );
    }

    if (username.trim().length < 3) {
      return NextResponse.json(
        { error: 'Username minimal 3 karakter' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password minimal 6 karakter' },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();
    const db = await getDatabase();
    const usersCol = db.collection<UserDocument>('users');

    const existingUser = await usersCol.findOne({ username: cleanUsername });
    if (existingUser) {
      return NextResponse.json(
        { error: `Username '${cleanUsername}' sudah terdaftar` },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const now = new Date();

    // Constraint: On registration, the new account is created with a "pending" status and cannot log in yet.
    const newUser: UserDocument = {
      username: cleanUsername,
      password: hashedPassword,
      nama_lengkap: nama_lengkap.trim(),
      role: 'user', // Default role is user/petugas
      status: 'pending', // Pending master admin approval
      created_at: now,
      updated_at: now,
    };

    const result = await usersCol.insertOne(newUser);

    return NextResponse.json(
      {
        success: true,
        message:
          'Pendaftaran berhasil! Akun Anda saat ini berstatus PENDING dan harus dikonfirmasi oleh Administrator Kantor DPD RI Sumbar sebelum dapat digunakan untuk login.',
        userId: result.insertedId.toString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server saat pendaftaran akun' },
      { status: 500 }
    );
  }
}
