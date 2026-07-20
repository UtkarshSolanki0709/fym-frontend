import { clearSession, getAccessToken, getRefreshToken, saveSession } from './session';

const BASE =
  process.env.EXPO_PUBLIC_RAILWAYS_URL?.replace(/\/$/, '') ||
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ||
  'https://fym-backend-production-f4a0.up.railway.app';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

type Opts = {
  method?: string;
  body?: unknown;
  auth?: boolean;
  /** skip auto-refresh on 401 */
  raw?: boolean;
};

async function request<T>(path: string, opts: Opts = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';

  if (opts.auth !== false) {
    const token = await getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const url = `${BASE}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: opts.method ?? (opts.body !== undefined ? 'POST' : 'GET'),
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch (e) {
    // Network / CORS — request may still have hit server (e.g. OTP SMS sent)
    const hint =
      e instanceof Error ? e.message : 'Network request failed';
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      `${hint}. Check API URL + CORS (${BASE}). If SMS arrived, server OK — browser may be blocking the response.`,
    );
  }

  if (res.status === 401 && opts.auth !== false && !opts.raw) {
    const refreshed = await tryRefresh();
    if (refreshed) return request<T>(path, { ...opts, raw: true });
    await clearSession();
  }

  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    throw new ApiError(
      res.status,
      (data as { code?: string })?.code ?? 'HTTP_ERROR',
      (data as { error?: string })?.error || res.statusText || `HTTP ${res.status}`,
      (data as { details?: unknown })?.details,
    );
  }
  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function tryRefresh(): Promise<boolean> {
  const refresh_token = await getRefreshToken();
  if (!refresh_token) return false;
  try {
    const data = await request<{
      session: { access_token: string; refresh_token: string } | null;
      user?: { id?: string } | null;
    }>('/auth/refresh', {
      method: 'POST',
      body: { refresh_token },
      auth: false,
      raw: true,
    });
    if (!data.session?.access_token) return false;
    await saveSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: data.user,
    });
    return true;
  } catch {
    return false;
  }
}

// ── Auth ──────────────────────────────────────────────
export async function sendOtp(phone: string) {
  return request<{ success: boolean; phone?: string }>('/auth/otp/send', {
    method: 'POST',
    body: { phone },
    auth: false,
  });
}

export async function verifyOtp(phone: string, token: string) {
  const data = await request<{
    session: {
      access_token: string;
      refresh_token: string;
    } | null;
    user: { id: string } | null;
  }>('/auth/otp/verify', {
    method: 'POST',
    body: { phone, token: String(token).replace(/\D/g, '') },
    auth: false,
  });
  if (data.session) {
    await saveSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: data.user,
    });
  }
  return data;
}

export async function signIn(email: string, password: string) {
  const data = await request<{
    session: { access_token: string; refresh_token: string } | null;
    user: { id: string } | null;
  }>('/auth/signin', {
    method: 'POST',
    body: { email, password },
    auth: false,
  });
  if (data.session) {
    await saveSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: data.user,
    });
  }
  return data;
}

export async function signUp(email: string, password: string) {
  const data = await request<{
    session: { access_token: string; refresh_token: string } | null;
    user: { id: string } | null;
  }>('/auth/signup', {
    method: 'POST',
    body: { email, password },
    auth: false,
  });
  if (data.session) {
    await saveSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: data.user,
    });
  }
  return data;
}

// ── Discovery / Swipe ─────────────────────────────────
export type ApiDiscoveryProfile = {
  id: string;
  display_name: string | null;
  age: number | null;
  bio: string | null;
  photos: { id?: string; url: string }[] | null;
  interests: string[] | null;
  prompts: { question: string; answer: string }[] | null;
  is_verified: boolean | null;
  trust_score: number | null;
  distance_km: number | null;
  match_score: number;
  vibe: string | null;
};

export async function fetchDiscovery() {
  return request<{ profiles: ApiDiscoveryProfile[]; remaining_today: number | null }>(
    '/discovery',
  );
}

export async function swipeLike(target_id: string) {
  return request<{ ok: boolean; matched: boolean; roomId?: string }>('/swipe/like', {
    method: 'POST',
    body: { target_id },
  });
}

export async function swipeSuperlike(target_id: string) {
  return request<{ ok: boolean; matched: boolean; roomId?: string }>('/swipe/superlike', {
    method: 'POST',
    body: { target_id },
  });
}

export async function swipePassBatch(
  items: { target_id: string; tags: string[]; review_text?: string }[],
) {
  return request<{ ok: boolean; batch_id: string; count: number }>('/swipe/pass/batch', {
    method: 'POST',
    body: { items },
  });
}

// ── Profile / onboarding ──────────────────────────────
export async function getProfileMe() {
  return request<Record<string, unknown>>('/profile/me');
}

export async function updateProfileMe(body: Record<string, unknown>) {
  return request<Record<string, unknown>>('/profile/me', { method: 'PUT', body });
}

export async function updateInterests(interests: string[]) {
  return request('/profile/interests', { method: 'POST', body: { interests } });
}

export async function updatePrompts(prompts: { question: string; answer: string }[]) {
  return request('/profile/prompts', { method: 'POST', body: { prompts } });
}

export async function updateQuiz(
  answers: { question_id: string; value: number }[],
) {
  return request('/profile/personality-quiz', { method: 'POST', body: { answers } });
}

export async function setOnboardingStep(step: string) {
  return request('/onboarding/step', { method: 'PUT', body: { step } });
}

export async function getOnboardingStatus() {
  return request<{
    onboarding_step: string;
    is_verified: boolean;
    has_name: boolean;
    has_photos: boolean;
    has_interests: boolean;
  }>('/onboarding/status');
}

export async function uploadPhoto(base64: string) {
  return request<{ id: string; url: string }>('/profile/photos', {
    method: 'POST',
    body: { photo: base64 },
  });
}

export async function verifyLiveness(frames: string[]) {
  return request<{ verified: boolean }>('/onboarding/liveness', {
    method: 'POST',
    body: { frames },
  });
}

export { BASE as API_BASE };
