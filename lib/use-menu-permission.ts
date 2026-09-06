'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { ADMIN_EMAIL, ADMIN_UID, getUserProfileByUid, hasMenuPermission, type MenuKey } from './user-access';

export function useMenuPermission(menuKey: MenuKey, action: 'read' | 'write' = 'read'): boolean {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (active) setAllowed(false);
        return;
      }
      if (user.uid === ADMIN_UID || user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        if (active) setAllowed(true);
        return;
      }
      const profile = await getUserProfileByUid(user.uid);
      if (active) setAllowed(hasMenuPermission(profile, menuKey, action));
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [action, menuKey]);

  return allowed;
}
