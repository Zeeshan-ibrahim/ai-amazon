import { ADMIN_ROLES, type Role } from './types';

/** Where each role lands after sign-in. The two apps never overlap. */
export const homeFor = (role: Role) => (ADMIN_ROLES.includes(role) ? '/admin' : '/dashboard');
