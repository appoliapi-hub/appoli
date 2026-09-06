import { NextResponse } from 'next/server';
import { getAdminServices } from '../../../../../lib/firebase-admin';
import { APPOLI_MENU_KEYS, type MenuKey, type MenuPermissions } from '../../../../../lib/user-access';

type UserPayload = {
  email?: string;
  password?: string;
  name?: string;
  username?: string;
  role?: 'admin' | 'user';
  accessibleMenus?: MenuKey[];
  disabled?: boolean;
};

function getBearerToken(request: Request): string {
  const authorization = request.headers.get('authorization') || '';
  return authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
}

function defaultPermissions(role: 'admin' | 'user', menus: MenuKey[]): MenuPermissions {
  return Object.fromEntries(APPOLI_MENU_KEYS.map((menu) => [menu, {
    read: role === 'admin' || menus.includes(menu),
    write: role === 'admin',
  }])) as MenuPermissions;
}

function normalizeMenus(value: unknown): MenuKey[] {
  if (!Array.isArray(value)) return [...APPOLI_MENU_KEYS];
  return value.filter((menu): menu is MenuKey => APPOLI_MENU_KEYS.includes(menu as MenuKey));
}

async function requireAdmin(request: Request) {
  const { adminAuth, adminDb } = getAdminServices();
  const token = getBearerToken(request);
  if (!token) throw new Error('AUTH_REQUIRED');

  const decoded = await adminAuth.verifyIdToken(token);
  const profile = await adminDb.collection('users').doc(decoded.uid).get();
  const configuredEmail = process.env.NEXT_PUBLIC_APPOLI_ADMIN_EMAIL?.trim().toLowerCase();
  const configuredUid = process.env.NEXT_PUBLIC_APPOLI_ADMIN_UID?.trim();
  const isAdmin = decoded.uid === configuredUid
    || decoded.email?.toLowerCase() === configuredEmail
    || profile.data()?.role === 'admin';

  if (!isAdmin) throw new Error('FORBIDDEN');
  return { adminAuth, adminDb };
}

async function listAllUsers(adminAuth: ReturnType<typeof getAdminServices>['adminAuth']) {
  const users = [];
  let pageToken: string | undefined;
  do {
    const result = await adminAuth.listUsers(1000, pageToken);
    users.push(...result.users);
    pageToken = result.pageToken;
  } while (pageToken);
  return users;
}

export async function GET(request: Request) {
  try {
    const { adminAuth, adminDb } = await requireAdmin(request);
    const authUsers = await listAllUsers(adminAuth);
    const profiles = await Promise.all(authUsers.map(async (authUser) => {
      const snapshot = await adminDb.collection('users').doc(authUser.uid).get();
      const data = snapshot.data() || {};
      const role = data.role === 'admin' ? 'admin' : 'user';
      const accessibleMenus = normalizeMenus(data.accessibleMenus);
      return {
        uid: authUser.uid,
        email: authUser.email || '',
        name: data.name || authUser.displayName || authUser.email?.split('@')[0] || 'User',
        username: data.username || authUser.email?.split('@')[0] || '',
        role,
        accessibleMenus,
        disabled: authUser.disabled,
        emailVerified: authUser.emailVerified,
        createdAt: authUser.metadata.creationTime || null,
        lastSignInAt: authUser.metadata.lastSignInTime || null,
      };
    }));
    return NextResponse.json({ users: profiles.sort((a, b) => a.email.localeCompare(b.email)) });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const status = message === 'AUTH_REQUIRED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: status === 500 ? 'Gagal memuat daftar user.' : 'Akses admin diperlukan.' }, { status });
  }
}

export async function POST(request: Request) {
  let createdUid = '';
  try {
    const { adminAuth, adminDb } = await requireAdmin(request);
    const body = await request.json() as UserPayload;
    const email = body.email?.trim().toLowerCase() || '';
    const password = body.password || '';
    const name = body.name?.trim() || email.split('@')[0];
    const username = body.username?.trim().toLowerCase() || email.split('@')[0];
    const role = body.role === 'admin' ? 'admin' : 'user';
    const accessibleMenus = normalizeMenus(body.accessibleMenus);

    if (!email || !email.includes('@')) return NextResponse.json({ error: 'Email tidak valid.' }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: 'Password minimal 6 karakter.' }, { status: 400 });
    const duplicate = await adminDb.collection('users').where('username', '==', username).limit(1).get();
    if (!duplicate.empty) return NextResponse.json({ error: 'Username sudah digunakan.' }, { status: 409 });

    const authUser = await adminAuth.createUser({ email, password, displayName: name, disabled: Boolean(body.disabled) });
    createdUid = authUser.uid;
    await adminDb.collection('users').doc(createdUid).set({
      id: createdUid,
      uid: createdUid,
      email,
      name,
      username,
      role,
      accessibleMenus,
      menuPermissions: defaultPermissions(role, accessibleMenus),
      updatedAt: new Date().toISOString(),
    });
    return NextResponse.json({ success: true, uid: createdUid }, { status: 201 });
  } catch (error) {
    if (createdUid) {
      try { await getAdminServices().adminAuth.deleteUser(createdUid); } catch { /* Best-effort rollback. */ }
    }
    const message = error instanceof Error ? error.message : '';
    const status = message === 'AUTH_REQUIRED' ? 401 : message === 'FORBIDDEN' ? 403 : message.includes('email-already-exists') ? 409 : 500;
    return NextResponse.json({ error: status === 500 ? 'Gagal membuat user.' : status === 409 ? 'Email sudah digunakan.' : 'Akses admin diperlukan.' }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    const { adminAuth, adminDb } = await requireAdmin(request);
    const body = await request.json() as UserPayload & { uid?: string };
    const uid = body.uid?.trim() || '';
    if (!uid) return NextResponse.json({ error: 'UID user wajib diisi.' }, { status: 400 });

    const current = await adminAuth.getUser(uid);
    const name = body.name?.trim() || current.displayName || current.email?.split('@')[0] || 'User';
    await adminAuth.updateUser(uid, {
      displayName: name,
      disabled: typeof body.disabled === 'boolean' ? body.disabled : current.disabled,
    });

    const existing = (await adminDb.collection('users').doc(uid).get()).data() || {};
    const role = body.role === 'admin' || body.role === 'user'
      ? body.role
      : existing.role === 'admin' ? 'admin' : 'user';
    const accessibleMenus = normalizeMenus(body.accessibleMenus ?? existing.accessibleMenus);
    await adminDb.collection('users').doc(uid).set({
      id: uid,
      uid,
      email: current.email || existing.email || '',
      name,
      username: body.username?.trim().toLowerCase() || existing.username || current.email?.split('@')[0] || '',
      role,
      accessibleMenus,
      menuPermissions: defaultPermissions(role, accessibleMenus),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const status = message === 'AUTH_REQUIRED' ? 401 : message === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: status === 500 ? 'Gagal memperbarui user.' : 'Akses admin diperlukan.' }, { status });
  }
}