import type { Role } from './types';

/** Where each role lands after sign-in. The two apps never overlap. */
export const homeFor = (role: Role) => (role === 'admin' ? '/admin' : '/dashboard');
