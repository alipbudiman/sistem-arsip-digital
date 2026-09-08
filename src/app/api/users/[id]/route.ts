import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';
import { getSessionUserFromRequest, hashPassword } from '@/lib/auth';
import { UserDocument } from '@/lib/models';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const currentUser = await getSessionUserFromRequest(req);
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID Pengguna tidak valid' }, { status: 400 });
    }

    const db = await getDatabase();
    const user = await db.collection<UserDocument>('users').findOne(
      { _id: new ObjectId(id) },
      { projection: { password: 0 } }
    );

    if (!user) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      id: user._id?.toString(),
      username: user.username,
      nama_lengkap: user.nama_lengkap,
      role: user.role,
      status: user.status,
      created_at: user.created_at ? user.created_at.toISOString() : '',
      updated_at: user.updated_at ? user.updated_at.toISOString() : '',
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'Gagal memuat pengguna' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const currentUser = await getSessionUserFromRequest(req);
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Hanya Administrator yang memiliki akses' }, { status: 403 });
    }

    const { id } = await context.params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID Pengguna tidak valid' }, { status: 400 });
    }

    const body = await req.json();
    const db = await getDatabase();
    const usersCol = db.collection<UserDocument>('users');

    const targetUser = await usersCol.findOne({ _id: new ObjectId(id) });
    if (!targetUser) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    const updateFields: Partial<UserDocument> = {
      updated_at: new Date(),
    };

    // Task 7: Confirm pending Petugas (user) accounts
    if (body.status) {
      if (body.status !== 'pending' && body.status !== 'confirmed') {
        return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 });
      }
      updateFields.status = body.status;
    }

    // Task 7: Support upgrading a user account to admin
    if (body.role) {
      if (body.role !== 'admin' && body.role !== 'user') {
        return NextResponse.json({ error: 'Role tidak valid' }, { status: 400 });
      }
      updateFields.role = body.role;
    }

    if (body.nama_lengkap && body.nama_lengkap.trim()) {
      updateFields.nama_lengkap = body.nama_lengkap.trim();
    }

    if (body.password && body.password.length >= 6) {
      updateFields.password = await hashPassword(body.password);
    }

    await usersCol.updateOne({ _id: new ObjectId(id) }, { $set: updateFields });

    return NextResponse.json({
      success: true,
      message: 'Data akun pengguna berhasil diperbarui',
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui pengguna' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const currentUser = await getSessionUserFromRequest(req);
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Hanya Administrator yang memiliki akses' }, { status: 403 });
    }

    const { id } = await context.params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID Pengguna tidak valid' }, { status: 400 });
    }

    if (currentUser.id === id) {
      return NextResponse.json(
        { error: 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const usersCol = db.collection<UserDocument>('users');

    // Check if deleting the last admin
    const targetUser = await usersCol.findOne({ _id: new ObjectId(id) });
    if (targetUser?.role === 'admin') {
      const adminCount = await usersCol.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Tidak dapat menghapus Administrator satu-satunya di sistem' },
          { status: 400 }
        );
      }
    }

    await usersCol.deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({
      success: true,
      message: 'Akun pengguna berhasil dihapus dari sistem',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Gagal menghapus pengguna' }, { status: 500 });
  }
}
