"use client";

import { Timestamp } from "firebase/firestore";
import type { SiteSettings } from "@/lib/types/models";

export const SETTINGS_SNAPSHOT_STORAGE_KEY = "maghrabi-settings-v1";

type WireSettings = Omit<SiteSettings, "updatedAt"> & {
  updatedAtMs: number | null;
};

type SettingsSnapshotWire = { v: 1; settings: WireSettings };

function tsToMs(t: SiteSettings["updatedAt"]): number | null {
  if (t == null) return null;
  if (typeof (t as Timestamp).toMillis === "function") {
    return (t as Timestamp).toMillis();
  }
  return null;
}

function msToTs(ms: number | null): SiteSettings["updatedAt"] {
  if (ms == null || !Number.isFinite(ms)) return null;
  return Timestamp.fromMillis(ms);
}

function toWire(s: SiteSettings): WireSettings {
  const { updatedAt, ...rest } = s;
  return { ...rest, updatedAtMs: tsToMs(updatedAt) };
}

function fromWire(w: WireSettings): SiteSettings {
  const { updatedAtMs, ...rest } = w;
  return { ...rest, updatedAt: msToTs(updatedAtMs) };
}

export function readSettingsSnapshot(): SiteSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SETTINGS_SNAPSHOT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SettingsSnapshotWire;
    if (parsed.v !== 1 || !parsed.settings) return null;
    return fromWire(parsed.settings);
  } catch {
    return null;
  }
}

export function writeSettingsSnapshot(settings: SiteSettings): void {
  if (typeof window === "undefined") return;
  try {
    const wire: SettingsSnapshotWire = { v: 1, settings: toWire(settings) };
    window.localStorage.setItem(SETTINGS_SNAPSHOT_STORAGE_KEY, JSON.stringify(wire));
  } catch {
    /* ignore */
  }
}
