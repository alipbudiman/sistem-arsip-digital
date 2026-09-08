import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from './mongodb';
import { UserDocument, UserPublicProfile } from './models';

const JWT_SECRET = process.env.JWT_SECRET || 'dpd_ri_sumbar_arsip_digital_secret_key_2026_super_secure';
const secretKey = new TextEncoder().encode(JWT_SECRET);
export const AUTH_COOKIE_NAME = 'dpd_arsip_session';

export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainText, salt);
}

export async function verifyPassword(plainText: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plainText, hashed);
}

export async function createSessionToken(user: UserDocument): Promise<string> {
  const token = await new SignJWT({
    sub: user._id?.toString(),
    username: user.username,
    nama_lengkap: user.nama_lengkap,
    role: user.role,
    status: user.status,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);

  return token;
}

export async function verifySessionToken(token: string): Promise<{
  sub: string;
  username: string;
  nama_lengkap: string;
  role: 'admin' | 'user';
  status: 'pending' | 'confirmed';
} | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return {
      sub: payload.sub as string,
      username: payload.username as string,
      nama_lengkap: payload.nama_lengkap as string,
      role: payload.role as 'admin' | 'user',
      status: payload.status as 'pending' | 'confirmed',
    };
  } catch {
    return null;
  }
}

export async function getSessionUserFromCookie(): Promise<UserPublicProfile | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifySessionToken(token);
    if (!payload || !payload.sub) return null;

    const db = await getDatabase();
    const user = await db.collection<UserDocument>('users').findOne({
      _id: new ObjectId(payload.sub),
    });

    if (!user) return null;

    return {
      id: user._id!.toString(),
      username: user.username,
      nama_lengkap: user.nama_lengkap,
      role: user.role,
      status: user.status,
      created_at: user.created_at ? user.created_at.toISOString() : '',
    };
  } catch {
    return null;
  }
}

export async function getSessionUserFromRequest(req: NextRequest): Promise<UserPublicProfile | null> {
  try {
    const cookieHeader = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    const authHeader = req.headers.get('authorization')?.replace('Bearer ', '');
    const token = cookieHeader || authHeader;
    if (!token) return null;

    const payload = await verifySessionToken(token);
    if (!payload || !payload.sub) return null;

    const db = await getDatabase();
    const user = await db.collection<UserDocument>('users').findOne({
      _id: new ObjectId(payload.sub),
    });

    if (!user) return null;

    return {
      id: user._id!.toString(),
      username: user.username,
      nama_lengkap: user.nama_lengkap,
      role: user.role,
      status: user.status,
      created_at: user.created_at ? user.created_at.toISOString() : '',
    };
  } catch {
    return null;
  }
}
