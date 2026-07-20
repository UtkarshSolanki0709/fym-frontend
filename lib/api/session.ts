import { storageGet, storageRemove, storageSet } from '@/lib/storage';

const KEYS = {
  access: 'fym.access_token',
  refresh: 'fym.refresh_token',
  userId: 'fym.user_id',
} as const;

export async function getAccessToken(): Promise<string | null> {
  return storageGet(KEYS.access);
}

export async function getRefreshToken(): Promise<string | null> {
  return storageGet(KEYS.refresh);
}

export async function saveSession(session: {
  access_token: string;
  refresh_token: string;
  user?: { id?: string } | null;
}): Promise<void> {
  await storageSet(KEYS.access, session.access_token);
  await storageSet(KEYS.refresh, session.refresh_token);
  await storageSet(KEYS.userId, session.user?.id ?? '');
}

export async function clearSession(): Promise<void> {
  await storageRemove(KEYS.access);
  await storageRemove(KEYS.refresh);
  await storageRemove(KEYS.userId);
}

export async function hasSession(): Promise<boolean> {
  const t = await getAccessToken();
  return Boolean(t);
}
