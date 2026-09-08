import { NextRequest, NextResponse } from 'next/server';
import { Filter } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';
import { getSessionUserFromRequest, hashPassword } from '@/lib/auth';
import { UserDocument } from '@/lib/models';

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getSessionUserFromRequest(req);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Hanya Administrator yang memiliki akses ke modul ini' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role')?.trim() || 'all';
    const status = searchParams.get('status')?.trim() || 'all';
    const search = searchParams.get('search')?.trim() || '';

    const filter: Filter<UserDocument> = {};

    if (role !== 'all' && (role === 'admin' || role === 'user')) {
      filter.role = role;
    }

    if (status !== 'all' && (status === 'pending' || status === 'confirmed')) {
      filter.status = status;
    }

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      filter.$or = [{ username: searchRegex }, { nama_lengkap: searchRegex }];
    }

    const db = await getDatabase();
    const users = await db
      .collection<UserDocument>('users')
      .find(filter)
      .sort({ created_at: -1 })
      .project({ password: 0 })
      .toArray();

    const formattedUsers = users.map((u) => ({
      id: u._id?.toString(),
      username: u.username,
      nama_lengkap: u.nama_lengkap,
      role: u.role,
      status: u.status,
      created_at: u.created_at ? u.created_at.toISOString() : '',
      updated_at: u.updated_at ? u.updated_at.toISOString() : '',
    }));

    return NextResponse.json({
      users: formattedUsers,
      total: formattedUsers.length,
      pendingCount: users.filter((u) => u.status === 'pending').length,
    });
  } catch (error) {
    console.error('Fetch users error:', error);
    return NextResponse.json({ error: 'Gagal memuat daftar pengguna' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getSessionUserFromRequest(req);
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Hanya Administrator yang dapat menambahkan pengguna' }, { status: 403 });
    }

    const body = await req.json();
    const { username, password, nama_lengkap, role = 'user', status = 'confirmed' } = body;

    if (!username || !password || !nama_lengkap) {
      return NextResponse.json(
        { error: 'Username, password, dan nama lengkap wajib diisi' },
        { status: 400 }
      );
    }

    if (role !== 'admin' && role !== 'user') {
      return NextResponse.json({ error: 'Role harus "admin" atau "user"' }, { status: 400 });
    }

    if (status !== 'pending' && status !== 'confirmed') {
      return NextResponse.json({ error: 'Status harus "pending" atau "confirmed"' }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();
    const db = await getDatabase();
    const usersCol = db.collection<UserDocument>('users');

    const existing = await usersCol.findOne({ username: cleanUsername });
    if (existing) {
      return NextResponse.json({ error: `Username '${cleanUsername}' sudah terdaftar` }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);
    const now = new Date();

    const newUser: UserDocument = {
      username: cleanUsername,
      password: hashedPassword,
      nama_lengkap: nama_lengkap.trim(),
      role,
      status,
      created_at: now,
      updated_at: now,
    };

    const res = await usersCol.insertOne(newUser);

    return NextResponse.json(
      {
        success: true,
        message: `Pengguna '${cleanUsername}' (${role}) berhasil dibuat`,
        userId: res.insertedId.toString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Gagal membuat akun pengguna' }, { status: 500 });
  }
}
