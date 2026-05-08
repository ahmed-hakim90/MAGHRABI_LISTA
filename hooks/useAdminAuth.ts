"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { useCallback, useEffect, useState } from "react";
import { getClientAuth } from "@/lib/firebase/client";
import { signOutAdmin } from "@/lib/firebase/auth";

export type AdminAuthState = {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
};

export function useAdminAuth(): AdminAuthState & {
  refresh: () => void;
  signOut: () => Promise<void>;
} {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkUser = useCallback(async (u: User | null) => {
    if (!u) {
      setUser(null);
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    setUser(u);
    let ok = false;
    try {
      // Force-refresh once so a freshly-set custom claim is picked up without re-login.
      const tokenResult = await u.getIdTokenResult(true);
      ok = tokenResult.claims.admin === true;
    } catch {
      ok = false;
    }
    if (!ok) {
      await signOutAdmin();
      setUser(null);
      setIsAdmin(false);
    } else {
      setIsAdmin(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const auth = getClientAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setLoading(true);
      void checkUser(u);
    });
    return () => unsub();
  }, [checkUser]);

  return {
    user,
    isAdmin,
    loading,
    refresh: () => {
      const u = getClientAuth().currentUser;
      setLoading(true);
      void checkUser(u);
    },
    signOut: signOutAdmin,
  };
}
