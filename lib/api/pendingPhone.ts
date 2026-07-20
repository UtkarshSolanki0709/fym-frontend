import { storageGet, storageRemove, storageSet } from '@/lib/storage';

const KEY = 'fym.pending_phone';

/** Avoid putting E.164 `+` in route params — URL parsers turn `+` into space. */
export async function setPendingPhone(phone: string): Promise<void> {
  await storageSet(KEY, phone);
}

export async function getPendingPhone(): Promise<string | null> {
  return storageGet(KEY);
}

export async function clearPendingPhone(): Promise<void> {
  await storageRemove(KEY);
}
