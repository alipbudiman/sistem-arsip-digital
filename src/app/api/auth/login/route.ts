import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { UserDocument } from '@/lib/models';
import { verifyPassword, createSessionToken, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username dan password wajib diisi' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const user = await db.collection<UserDocument>('users').findOne({
      username: username.trim().toLowerCase(),
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Username atau password salah' },
        { status: 401 }
      );
    }

    const isMatch = await verifyPassword(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Username atau password salah' },
        { status: 401 }
      );
    }

    // Constraint: pending accounts CANNOT log in until confirmed by admin
    if (user.status === 'pending') {
      return NextResponse.json(
        {
          error: 'Akun Anda berstatus PENDING. Harap menunggu konfirmasi dan aktivasi oleh Administrator DPD RI Sumbar sebelum dapat masuk.',
          isPending: true,
        },
        { status: 403 }
      );
    }

    const token = await createSessionToken(user);

    const response = NextResponse.json({
      success: true,
      message: 'Login berhasil',
      user: {
        id: user._id!.toString(),
        username: user.username,
        nama_lengkap: user.nama_lengkap,
        role: user.role,
        status: user.status,
      },
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server saat proses login' },
      { status: 500 }
    );
  }
}
