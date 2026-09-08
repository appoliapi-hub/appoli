import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export type MenuKey =
  | 'appoli'
  | 'profil-petani'
  | 'analisa-usaha'
  | 'inspeksi-ics'
  | 'data-lahan';

export type MenuPermission = { read: boolean; write: boolean };
export type MenuPermissions = Partial<Record<MenuKey, MenuPermission>>;

export type UserAccessProfile = {
  id: string;
  name: string;
  email: string;
  username?: string;
  uid?: string;
  role: 'admin' | 'user';
  accessibleMenus: MenuKey[];
  menuPermissions?: MenuPermissions;
};

export const ADMIN_EMAIL = process.env.NEXT_PUBLIC_APPOLI_ADMIN_EMAIL?.trim().toLowerCase() || '';
export const ADMIN_USERNAME = process.env.NEXT_PUBLIC_APPOLI_ADMIN_USERNAME?.trim().toLowerCase() || '';
export const ADMIN_UID = process.env.NEXT_PUBLIC_APPOLI_ADMIN_UID?.trim() || '';

export const MENU_CONFIG = [
  { key: 'appoli', label: 'DASHBOARD APPOLI', href: '/dashboard/appoli' },
  { key: 'profil-petani', label: 'PROFIL PETANI', href: '/dashboard/appoli/profil-petani' },
  { key: 'analisa-usaha', label: 'ANALISA USAHA', href: '/dashboard/appoli/analisa-usaha' },
  { key: 'inspeksi-ics', label: 'INSPEKSI ICS', href: '/dashboard/appoli/inspeksi-ics' },
  { key: 'data-lahan', label: 'DATA & LAHAN', href: '/dashboard/appoli/data-lahan' },
] as const;

const getDefaultAccessibleMenus = (role: 'admin' | 'user'): MenuKey[] => {
  if (role === 'admin') {
    return MENU_CONFIG.map((menu) => menu.key);
  }

  return ['appoli', 'profil-petani', 'analisa-usaha', 'inspeksi-ics', 'data-lahan'];
};

export const APPOLI_MENU_KEYS: MenuKey[] = ['appoli', 'profil-petani', 'analisa-usaha', 'inspeksi-ics', 'data-lahan'];

export function getMenuPermissions(profile: Pick<UserAccessProfile, 'role' | 'accessibleMenus' | 'menuPermissions'>): MenuPermissions {
  const permissions: MenuPermissions = {};
  MENU_CONFIG.forEach((menu) => {
    const saved = profile.menuPermissions?.[menu.key];
    permissions[menu.key] = saved
      ? { read: saved.read, write: saved.write || profile.accessibleMenus.includes(menu.key) }
      : { read: profile.role === 'admin' || profile.accessibleMenus.includes(menu.key), write: profile.role === 'admin' || profile.accessibleMenus.includes(menu.key) };
  });
  return permissions;
}

export function hasMenuPermission(profile: UserAccessProfile | null | undefined, menuKey: MenuKey, action: 'read' | 'write'): boolean {
  if (!profile) return false;
  if (profile.role === 'admin') return true;
  return Boolean(getMenuPermissions(profile)[menuKey]?.[action]);
}

export async function getUsersFromFirestore(): Promise<UserAccessProfile[]> {
  const snapshot = await getDocs(collection(db, 'users'));
  return snapshot.docs
    .filter((userDoc) => !userDoc.data().deletedAt)
    .map((userDoc) => {
      const data = userDoc.data() as Partial<UserAccessProfile>;
      const role = data.role === 'admin' ? 'admin' : 'user';
      return {
        id: data.id ?? userDoc.id,
        name: data.name ?? data.username ?? 'User',
        email: data.email ?? '',
        username: data.username ?? data.name,
        uid: data.uid ?? userDoc.id,
        role,
        accessibleMenus: Array.isArray(data.accessibleMenus)
          ? data.accessibleMenus as MenuKey[]
          : getDefaultAccessibleMenus(role),
        menuPermissions: data.menuPermissions as MenuPermissions | undefined,
      };
    });
}

export function getUserProfileByEmail(email?: string | null): UserAccessProfile | undefined {
  void email;
  return undefined;
}

export function normalizeRole(email?: string | null, uid?: string | null): 'admin' | 'user' {
  const normalized = email?.trim().toLowerCase();

  if (normalized === ADMIN_EMAIL.toLowerCase() || uid === ADMIN_UID) {
    return 'admin';
  }

  return 'user';
}

export function isAdminUser(email?: string | null, uid?: string | null): boolean {
  if (!email && !uid) return false;

  const normalizedEmail = email?.trim().toLowerCase();
  if (normalizedEmail === ADMIN_EMAIL.toLowerCase()) return true;
  if (uid && uid === ADMIN_UID) return true;

  const profile = getUserProfileByEmail(email);
  if (profile?.uid && profile.uid === uid) return true;

  return profile?.role === 'admin';
}

export function getVisibleMenuKeys(email?: string | null, uid?: string | null): MenuKey[] {
  if (isAdminUser(email, uid)) {
    return MENU_CONFIG.map((menu) => menu.key);
  }

  const profile = getUserProfileByEmail(email);
  return profile?.accessibleMenus ?? getDefaultAccessibleMenus('user');
}

export async function syncUserProfileToFirestore(firebaseUser: { uid: string; email?: string | null; displayName?: string | null; }) {
  const role = normalizeRole(firebaseUser.email, firebaseUser.uid);
  const profile: UserAccessProfile = {
    id: firebaseUser.uid,
    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || ADMIN_USERNAME,
    email: firebaseUser.email || '',
    username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || ADMIN_USERNAME,
    uid: firebaseUser.uid,
    role,
    accessibleMenus: getDefaultAccessibleMenus(role),
    menuPermissions: Object.fromEntries(MENU_CONFIG.map((menu) => [menu.key, { read: role === 'admin' || getDefaultAccessibleMenus(role).includes(menu.key), write: role === 'admin' || getDefaultAccessibleMenus(role).includes(menu.key) }])) as MenuPermissions,
  };

  if (!firebaseUser.uid) return profile;

  const ref = doc(db, 'users', firebaseUser.uid);
  const existingProfile = await getDoc(ref);
  if (existingProfile.exists()) {
    const data = existingProfile.data() as Partial<UserAccessProfile>;
    return {
      ...profile,
      id: data.id ?? firebaseUser.uid,
      name: data.name ?? data.username ?? profile.name,
      username: data.username ?? data.name ?? profile.username,
      role: data.role === 'admin' ? 'admin' : 'user',
      accessibleMenus: Array.isArray(data.accessibleMenus)
        ? data.accessibleMenus as MenuKey[]
        : profile.accessibleMenus,
      menuPermissions: data.menuPermissions as MenuPermissions | undefined,
    };
  }

  await setDoc(ref, {
    uid: firebaseUser.uid,
    name: profile.name,
    email: profile.email,
    username: profile.username,
    role: profile.role,
    accessibleMenus: profile.accessibleMenus,
    updatedAt: new Date().toISOString(),
  }, { merge: true });

  return profile;
}

export async function getUserProfileByUid(uid?: string | null): Promise<UserAccessProfile | null> {
  if (!uid) return null;

  const ref = doc(db, 'users', uid);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data() as Partial<UserAccessProfile>;
  return {
    id: data.id ?? uid,
    name: data.name ?? data.username ?? 'User',
    email: data.email ?? '',
    username: data.username ?? data.name,
    uid: data.uid ?? uid,
    role: (data.role === 'admin' ? 'admin' : 'user'),
    accessibleMenus: Array.isArray(data.accessibleMenus) ? data.accessibleMenus as MenuKey[] : getDefaultAccessibleMenus('user'),
    menuPermissions: data.menuPermissions as MenuPermissions | undefined,
  };
}

export async function updateUserProfileInFirestore(profile: UserAccessProfile): Promise<UserAccessProfile> {
  if (!profile.uid) {
    return profile;
  }

  const ref = doc(db, 'users', profile.uid);
  await setDoc(ref, {
    uid: profile.uid,
    name: profile.name,
    email: profile.email,
    username: profile.username,
    role: profile.role,
    accessibleMenus: profile.accessibleMenus,
    menuPermissions: profile.menuPermissions,
    updatedAt: new Date().toISOString(),
  }, { merge: true });

  return profile;
}

export async function deleteUserProfileFromFirestore(uid: string): Promise<void> {
  if (!uid) return;

  const ref = doc(db, 'users', uid);
  await setDoc(ref, {
    deletedAt: new Date().toISOString(),
  }, { merge: true });
}
