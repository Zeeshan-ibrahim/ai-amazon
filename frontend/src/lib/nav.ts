import {
  BagIcon,
  BoxIcon,
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
 * `[section]` placeholder.
 */
export const adminNavItems = [
  { slug: 'analytics', label: 'Analytics', title: 'Analytics', icon: LayoutIcon },
  { slug: 'members', label: 'Members', title: 'Members', icon: UsersIcon, built: true },
  { slug: 'products', label: 'Products', title: 'Products', icon: BagIcon, built: true },
  { slug: 'plans', label: 'Plans', title: 'Plans', icon: ShieldIcon, built: true },
  { slug: 'plan-requests', label: 'Plan Req', title: 'Plan Requests', icon: SwapIcon, built: true },
  { slug: 'financials', label: 'Financials', title: 'Financials', icon: SwapIcon, built: true },
  { slug: 'banners', label: 'Banners', title: 'Banners', icon: ImageIcon },
  { slug: 'wallets', label: 'Wallets', title: 'Wallets', icon: WalletIcon },
  { slug: 'account', label: 'My Acc', title: 'My Account', icon: UserIcon },
];
