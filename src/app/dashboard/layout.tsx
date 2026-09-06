'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  LayoutDashboard, 
  LineChart, 
  Bell, 
  Search, 
  Menu, 
  X,
  Calculator,
  ClipboardCheck,
  Map,
  Shield,
  UsersRound
} from 'lucide-react';
import { ReactNode } from 'react';
import { auth } from '../../../lib/firebase';
import { hasMenuPermission, MENU_CONFIG, getUserProfileByUid, getVisibleMenuKeys, isAdminUser, type MenuKey, type UserAccessProfile } from '../../../lib/user-access';
import logoAppoli from '../../../public/images/logo-appoli.png';
import AiAssistant from './ai-assistant';

const routeMenuKeys: Array<[string, MenuKey]> = [
  ['/dashboard/appoli/profil-petani', 'profil-petani'],
  ['/dashboard/appoli/analisa-usaha', 'analisa-usaha'],
  ['/dashboard/appoli/inspeksi-ics', 'inspeksi-ics'],
  ['/dashboard/appoli/data-lahan', 'data-lahan'],
  ['/dashboard/appoli', 'appoli'],
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userUid, setUserUid] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserAccessProfile | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  // Move useMemo before conditional return to ensure it's always called
  const visibleMenus = useMemo(
    () => userProfile
      ? MENU_CONFIG.filter((menu) => hasMenuPermission(userProfile, menu.key, 'read')).map((menu) => menu.key)
      : getVisibleMenuKeys(userEmail, userUid),
    [userEmail, userProfile, userUid]
  );

  const currentMenuKey = routeMenuKeys.find(([path]) => pathname === path)?.[1];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthReady(true);

      if (!user) {
        setUserEmail(null);
        setUserUid(null);
        setUserProfile(null);
        router.replace('/login');
        return;
      }

      const nextEmail = user.email || null;
      const nextUid = user.uid || null;
      setUserEmail(nextEmail);
      setUserUid(nextUid);

      try {
        const firestoreProfile = await getUserProfileByUid(nextUid);
        const resolvedProfile = firestoreProfile ?? {
          id: nextUid ?? 'guest',
          name: user.displayName || nextEmail?.split('@')[0] || 'Pengguna',
          email: nextEmail || '',
          username: user.displayName || nextEmail?.split('@')[0] || 'Pengguna',
          uid: nextUid ?? undefined,
          role: isAdminUser(nextEmail, nextUid) ? 'admin' : 'user',
          accessibleMenus: getVisibleMenuKeys(nextEmail, nextUid),
        };

        setUserProfile(resolvedProfile);

        const isAllowed = resolvedProfile.role === 'admin';
        const hasPageAccess = !currentMenuKey || hasMenuPermission(resolvedProfile, currentMenuKey, 'read');
        if ((pathname === '/dashboard/admin/users' && !isAllowed) || !hasPageAccess) {
          router.replace('/dashboard');
        }
      } catch {
        setUserProfile({
          id: nextUid ?? 'guest',
          name: user.displayName || nextEmail?.split('@')[0] || 'Pengguna',
          email: nextEmail || '',
          username: user.displayName || nextEmail?.split('@')[0] || 'Pengguna',
          uid: nextUid ?? undefined,
          role: isAdminUser(nextEmail, nextUid) ? 'admin' : 'user',
          accessibleMenus: getVisibleMenuKeys(nextEmail, nextUid),
        });
      }
    });

    return () => unsubscribe();
  }, [currentMenuKey, pathname, router]);

  if (!authReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-600">
          <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Memuat dashboard...</span>
        </div>
      </div>
    );
  }
  const isActive = (path: string) => pathname === path;

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMenu = () => setIsMobileMenuOpen(false);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const menuMap = {
    dashboard: { icon: LayoutDashboard, label: 'DASHBOARD', href: '/dashboard' },
    baseline: { icon: Search, label: 'BASELINE', href: '/dashboard/baseline' },
    saggd: { icon: LineChart, label: 'SAGGD', href: '/dashboard/saggd' },
    appoli: { icon: LayoutDashboard, label: 'DASHBOARD APPOLI', href: '/dashboard/appoli' },
    'analisa-usaha': { icon: Calculator, label: 'ANALISA USAHA', href: '/dashboard/appoli/analisa-usaha' },
    'inspeksi-ics': { icon: ClipboardCheck, label: 'INSPEKSI ICS', href: '/dashboard/appoli/inspeksi-ics' },
    'data-lahan': { icon: Map, label: 'DATA & LAHAN', href: '/dashboard/appoli/data-lahan' },
    'kinerja-enumerator': { icon: UsersRound, label: 'KINERJA ENUMERATOR', href: '/dashboard/kinerja-enumerator' },
    'admin-users': { icon: Shield, label: 'MANAJEMEN USER', href: '/dashboard/admin/users' },
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden print:block print:h-auto print:overflow-visible">
      
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={closeMenu}
        />
      )}

      {/* Area pemicu untuk membuka sidebar kembali di desktop. */}
      <div
        className="fixed inset-y-0 left-0 z-40 hidden w-3 lg:block"
        onMouseEnter={() => setIsDesktopSidebarOpen(true)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        onMouseEnter={() => setIsDesktopSidebarOpen(true)}
        onMouseLeave={() => setIsDesktopSidebarOpen(false)}
        className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200/60 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)]
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isDesktopSidebarOpen ? 'lg:translate-x-0' : 'lg:-translate-x-full'}
      print:hidden`}>
        <div className="h-20 lg:h-24 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-3">
            <Image src={logoAppoli} alt="Logo Appoli" preload className="h-12 w-auto object-contain" />
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">SIM-<span className="text-emerald-600">API</span></h1>
              <p className="text-[10px] font-medium text-slate-500">Aliansi Petani Indondesia</p>
            </div>
          </div>
          <button onClick={closeMenu} className="lg:hidden p-2 text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-5 py-6 space-y-2 overflow-y-auto">
          <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Menu Utama</p>

          {MENU_CONFIG.filter((menu) => visibleMenus.includes(menu.key)).map((menu) => {
            const Icon = menuMap[menu.key].icon;
            const targetPath = menuMap[menu.key].href;

            return (
              <Link
                key={menu.key}
                href={targetPath}
                onClick={closeMenu}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive(targetPath) ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
              >
                <Icon className={`w-5 h-5 ${isActive(targetPath) ? 'text-emerald-600' : 'text-slate-400'}`} />
                {menu.label}
              </Link>
            );
          })}
          {userProfile?.role === 'admin' && (
            <Link
              href="/dashboard/admin/users"
              onClick={closeMenu}
              className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold transition-all duration-200 ${pathname === '/dashboard/admin/users' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
            >
              <Shield className={`h-5 w-5 ${pathname === '/dashboard/admin/users' ? 'text-emerald-600' : 'text-slate-400'}`} />
              MANAJEMEN USER
            </Link>
          )}
        </nav>

        {/* User Profile */}
        <div className="p-5 border-t border-slate-100 shrink-0">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition cursor-pointer">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-bold shadow-sm">
              AD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{userProfile?.name ?? 'Pengguna'}</p>
              <p className="text-xs text-slate-500 truncate">{userEmail ?? 'Belum login'}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="ml-auto rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600 transition hover:border-rose-200 hover:text-rose-600"
            >
              Keluar
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 lg:h-24 bg-white/80 lg:bg-slate-50/80 backdrop-blur-md border-b lg:border-none border-slate-200 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-10 print:hidden">
          <div className="flex items-center gap-4">
            <button onClick={toggleMenu} className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg">
              <Menu className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={() => setIsDesktopSidebarOpen((open) => !open)}
              className="hidden lg:inline-flex p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              aria-label={isDesktopSidebarOpen ? 'Sembunyikan sidebar' : 'Tampilkan sidebar'}
              title={isDesktopSidebarOpen ? 'Sembunyikan sidebar' : 'Tampilkan sidebar'}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-xl lg:text-2xl font-bold text-slate-800 tracking-tight hidden sm:block">Overview</h2>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2.5 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-10 print:overflow-visible print:p-0">
          {children}
        </main>
      </div>

      <AiAssistant />

    </div>
  );
}
