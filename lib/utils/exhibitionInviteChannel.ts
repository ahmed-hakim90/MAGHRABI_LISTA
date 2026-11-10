"use client";

import { useSyncExternalStore } from "react";

/**
 * Lets other catalog chrome (e.g. the home campaign banner) open the
 * exhibition invitation, and know whether one is available, without
 * duplicating the invitation's fetch or state.
 */
const OPEN_EXHIBITION_INVITE_EVENT = "maghrabi-open-exhibition-invite";

let inviteAvailable = false;
const listeners = new Set<() => void>();

export function setExhibitionInviteAvailable(available: boolean) {
  if (inviteAvailable === available) return;
  inviteAvailable = available;
  for (const notify of listeners) notify();
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => listeners.delete(notify);
}

export function useExhibitionInviteAvailable(): boolean {
  return useSyncExternalStore(subscribe, () => inviteAvailable, () => false);
}

export function requestOpenExhibitionInvite() {
  window.dispatchEvent(new Event(OPEN_EXHIBITION_INVITE_EVENT));
}

export function onOpenExhibitionInviteRequest(handler: () => void): () => void {
  window.addEventListener(OPEN_EXHIBITION_INVITE_EVENT, handler);
  return () => window.removeEventListener(OPEN_EXHIBITION_INVITE_EVENT, handler);
}
