"use client";

import { useCallback } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export function useAdminApiToken() {
  const { user } = useAdminAuth();

  const getToken = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    return user.getIdToken();
  }, [user]);

  return { getToken };
}
