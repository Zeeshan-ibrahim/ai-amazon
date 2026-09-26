import type {
  AuditEntry,
  CatalogProduct,
  FinancialRequest,
  LedgerEntry,
  Member,
  MemberInput,
  Paged,
  Transaction,
  User,
  Wallet,
} from './types';

/** `{ a: 1, b: undefined }` → `?a=1` */
const qs = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : '';
};

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown };

const GENERIC_ERROR = 'Something went wrong. Please try again.';
const OFFLINE_ERROR = "We couldn't connect. Check your internet connection and try again.";
const SERVER_ERROR = 'Something went wrong on our side. Please try again in a moment.';

/**
 * The text to show a person for a caught error. Only the API's own 4xx
 * messages are written for users; network failures, server errors and bugs
 * in our code get friendly copy instead, and the real error is logged for
 * developers.
 */
export function userMessage(error: unknown, fallback = GENERIC_ERROR): string {
  if (error instanceof ApiError) {
    if (error.status === 0) return OFFLINE_ERROR;
    if (error.status < 500) return error.message;
    console.error(error);
    return SERVER_ERROR;
  }
  console.error(error);
  return fallback;
}

/**
 * Thin fetch wrapper. Unwraps the `{ success, data }` envelope the API uses
 * and throws `ApiError` on any non-2xx response.
 */
export async function request<T>(
  path: string,
  { body, headers, ...init }: RequestOptions = {}
): Promise<T> {
  // FormData sets its own multipart Content-Type (with the boundary).
  const isForm = body instanceof FormData;
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: isForm ? headers : { 'Content-Type': 'application/json', ...headers },
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
      cache: 'no-store',
      credentials: 'include',
    });
  } catch (cause) {
    // fetch only rejects when the request never got a response (offline, DNS, CORS).
    console.error(cause);
    throw new ApiError(OFFLINE_ERROR, 0);
  }

  const json = await response.json().catch(() => null);

  // Expired or missing session anywhere in the app → back to sign-in.
  if (
    response.status === 401 &&
    !path.startsWith('/auth/') &&
    typeof window !== 'undefined' &&
    window.location.pathname !== '/login'
  ) {
    window.location.assign('/login');
  }

  if (!response.ok || json?.success === false) {
    throw new ApiError(
      json?.message ?? GENERIC_ERROR,
      response.status,
      json?.data
    );
  }

  return (json?.data ?? json) as T;
}

export const api = {
  login: (body: { email: string; password: string }) =>
    request<{ user: User }>('/auth/login', { method: 'POST', body }),
  signup: (body: { email: string; password: string; firstName?: string }) =>
    request<{ user: User }>('/auth/signup', { method: 'POST', body }),
  logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),
  forgotPassword: (body: { email: string }) =>
    request<{ message: string }>('/auth/forgot-password', { method: 'POST', body }),

  me: () => request<User>('/me'),
  updateProfile: (body: Record<string, unknown>) =>
    request('/me', { method: 'PATCH', body }),
  updatePassword: (body: Record<string, unknown>) =>
    request('/me/password', { method: 'PUT', body }),
  updateLanguage: (language: string) =>
    request('/me/language', { method: 'PUT', body: { language } }),

  dashboard: () => request('/dashboard'),
  liveDeposits: () => request('/deposits/live'),

  products: () => request('/products'),
  purchaseProduct: (id: string) =>
    request(`/products/${id}/purchase`, { method: 'POST' }),
  sellProduct: (id: string) =>
    request(`/products/${id}/sell`, { method: 'POST' }),

  plans: () => request('/plans'),
  activatePlan: (id: string) =>
    request(`/plans/${id}/activate`, { method: 'POST' }),

  transactions: (limit?: number) =>
    request(`/transactions${limit ? `?limit=${limit}` : ''}`),
  wallets: () => request<Wallet[]>('/wallets'),
  /** Multipart: `amount`, `walletId`, `receipt` (image file). */
  createDeposit: (form: FormData) =>
    request<Transaction>('/deposits', { method: 'POST', body: form }),
  createWithdrawal: (body: Record<string, unknown>) =>
    request('/withdrawals', { method: 'POST', body }),

  languages: () => request('/languages'),

  admin: {
    members: (params: { q?: string; offset?: number }) =>
      request<Paged<Member>>(`/admin/members${qs(params)}`),
    createMember: (body: MemberInput) =>
      request<Member>('/admin/members', { method: 'POST', body }),
    member: (id: string) => request<Member>(`/admin/members/${id}`),
    updateMember: (id: string, body: MemberInput) =>
      request<{ member: Member; changed: string[] }>(`/admin/members/${id}`, {
        method: 'PATCH',
        body,
      }),

    transactions: (id: string) =>
      request<LedgerEntry[]>(`/admin/members/${id}/transactions`),
    adjustBalance: (
      id: string,
      body: { direction: 'credit' | 'debit'; amount: number; note?: string }
    ) => request<LedgerEntry>(`/admin/members/${id}/adjustments`, { method: 'POST', body }),
    reviewTransaction: (transactionId: string, decision: 'approve' | 'reject') =>
      request<LedgerEntry>(`/admin/transactions/${transactionId}/${decision}`, {
        method: 'POST',
        body: {},
      }),

    catalog: (
      id: string,
      params: { q?: string; min?: number; max?: number; offset?: number }
    ) => request<Paged<CatalogProduct>>(`/admin/members/${id}/catalog${qs(params)}`),
    assignOrder: (id: string, productId: string) =>
      request<{ id: string }>(`/admin/members/${id}/orders`, {
        method: 'POST',
        body: { productId },
      }),

    audits: (id: string) => request<AuditEntry[]>(`/admin/members/${id}/audits`),

    requests: (params: {
      type: 'deposit' | 'withdrawal';
      scope: 'active' | 'history';
      offset?: number;
    }) =>
      request<Paged<FinancialRequest> & { pending: Record<'deposit' | 'withdrawal', number> }>(
        `/admin/transactions${qs(params)}`
      ),
    /** Direct image URL — the session cookie authorizes it. */
    receiptUrl: (transactionId: string) => `${BASE_URL}/admin/transactions/${transactionId}/receipt`,
  },
};
