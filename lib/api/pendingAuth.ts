import { storageGet, storageRemove, storageSet } from '@/lib/storage';

const KEY = 'fym.pending_auth';

export type PendingAuth = {
  channel: 'phone' | 'email';
  /** E.164 phone or email */
  target: string;
};

export async function setPendingAuth(p: PendingAuth): Promise<void> {
  await storageSet(KEY, JSON.stringify(p));
}

export async function getPendingAuth(): Promise<PendingAuth | null> {
  const raw = await storageGet(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingAuth;
  } catch {
    return null;
  }
}

export async function clearPendingAuth(): Promise<void> {
  await storageRemove(KEY);
}

/** @deprecated use setPendingAuth — kept for one release */
export async function setPendingPhone(phone: string) {
  await setPendingAuth({ channel: 'phone', target: phone });
}
export async function getPendingPhone() {
  const p = await getPendingAuth();
  return p?.channel === 'phone' ? p.target : null;
}
export async function clearPendingPhone() {
  await clearPendingAuth();
}
