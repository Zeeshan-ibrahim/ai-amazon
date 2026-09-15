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

/**
 * Thin fetch wrapper. Unwraps the `{ success, data }` envelope the API uses
 * and throws `ApiError` on any non-2xx response.
 */
export async function request<T>(
  path: string,
  { body, headers, ...init }: RequestOptions = {}
): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  });

  const json = await response.json().catch(() => null);

  if (!response.ok || json?.success === false) {
    throw new ApiError(
      json?.message ?? 'Something went wrong. Please try again.',
      response.status,
      json?.data
    );
  }

  return (json?.data ?? json) as T;
}

export const api = {
  login: (body: { email: string; password: string }) =>
    request<{ token: string }>('/auth/login', { method: 'POST', body }),
  signup: (body: { email: string; password: string; firstName?: string }) =>
    request<{ token: string }>('/auth/signup', { method: 'POST', body }),
  forgotPassword: (body: { email: string }) =>
    request<{ message: string }>('/auth/forgot-password', { method: 'POST', body }),

  me: () => request('/me'),
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

  plans: () => request('/plans'),
  activatePlan: (id: string) =>
    request(`/plans/${id}/activate`, { method: 'POST' }),

  transactions: (limit?: number) =>
    request(`/transactions${limit ? `?limit=${limit}` : ''}`),
  depositAssets: () => request('/deposit-assets'),
  createDeposit: (body: Record<string, unknown>) =>
    request('/deposits', { method: 'POST', body }),
  createWithdrawal: (body: Record<string, unknown>) =>
    request('/withdrawals', { method: 'POST', body }),

  languages: () => request('/languages'),
};
