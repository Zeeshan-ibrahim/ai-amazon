import type { Role } from '@/lib/types';
import {
  BagIcon,
  BoxIcon,
  CrownIcon,
  GridIcon,
  HistoryIcon,
  ImageIcon,
  LayoutIcon,
  MonitorIcon,
  PlanIcon,
  SettingsIcon,
  ShieldIcon,
  SwapIcon,
  UserIcon,
  UsersIcon,
  WalletIcon,
} from '@/components/ui/Icons';

export const navItems = [
  { href: '/dashboard', label: 'Dashboard', mobileLabel: 'Home', icon: MonitorIcon, mobileIcon: GridIcon },
  { href: '/products', label: 'Products', mobileLabel: 'Products', icon: BoxIcon, mobileIcon: BoxIcon },
  { href: '/plans', label: 'Plans', mobileLabel: 'Plans', icon: PlanIcon, mobileIcon: PlanIcon },
  { href: '/history', label: 'History', mobileLabel: 'History', icon: HistoryIcon, mobileIcon: HistoryIcon },
  { href: '/settings', label: 'Settings', mobileLabel: 'Settings', icon: SettingsIcon, mobileIcon: SettingsIcon },
];

/**
 * Admin panel sections, in sidebar order. `slug` is the URL segment under
 * /admin; `label` is the sidebar text, `title` the page heading. `built`
 * sections have their own `app/admin/<slug>/` page; the rest render the
 * `[section]` placeholder. `only` limits a section to one admin role — the
 * API enforces the same rule (docs/roles.md).
 */
export const adminNavItems: {
  slug: string;
  label: string;
  title: string;
  icon: typeof LayoutIcon;
  built?: true;
  only?: Role;
}[] = [
  { slug: 'analytics', label: 'Analytics', title: 'Analytics', icon: LayoutIcon, built: true },
  { slug: 'members', label: 'Members', title: 'Members', icon: UsersIcon, built: true },
  { slug: 'sub-admins', label: 'Sub-admins', title: 'Sub-admins', icon: CrownIcon, built: true, only: 'super_admin' },
  { slug: 'products', label: 'Products', title: 'Products', icon: BagIcon, built: true },
  { slug: 'plans', label: 'Plans', title: 'Plans', icon: ShieldIcon, built: true },
  { slug: 'plan-requests', label: 'Plan requests', title: 'Plan Requests', icon: SwapIcon, built: true },
  { slug: 'financials', label: 'Financials', title: 'Financials', icon: SwapIcon, built: true },
  { slug: 'balance', label: 'My Balance', title: 'My Balance', icon: WalletIcon, built: true, only: 'sub_admin' },
  { slug: 'banners', label: 'Banners', title: 'Banners', icon: ImageIcon, built: true, only: 'super_admin' },
  { slug: 'wallets', label: 'Wallets', title: 'Wallets & Support', icon: WalletIcon, built: true, only: 'super_admin' },
  { slug: 'account', label: 'My account', title: 'Group Overview', icon: UserIcon, built: true },
];

/** The sections a role may open. */
export const adminNavFor = (role: Role | undefined) =>
  adminNavItems.filter((item) => !item.only || item.only === role);

/** The section a pathname belongs to, e.g. /admin/sub-admins/123 → sub-admins. */
export const adminSectionOf = (pathname: string) =>
  adminNavItems.find((item) => pathname === `/admin/${item.slug}` || pathname.startsWith(`/admin/${item.slug}/`));
