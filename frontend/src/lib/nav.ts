import {
  BoxIcon,
  GridIcon,
  HistoryIcon,
  MonitorIcon,
  PlanIcon,
  SettingsIcon,
} from '@/components/ui/Icons';

export const navItems = [
  { href: '/dashboard', label: 'Dashboard', mobileLabel: 'Home', icon: MonitorIcon, mobileIcon: GridIcon },
  { href: '/products', label: 'Products', mobileLabel: 'Products', icon: BoxIcon, mobileIcon: BoxIcon },
  { href: '/plans', label: 'Plans', mobileLabel: 'Plans', icon: PlanIcon, mobileIcon: PlanIcon },
  { href: '/history', label: 'History', mobileLabel: 'History', icon: HistoryIcon, mobileIcon: HistoryIcon },
  { href: '/settings', label: 'Settings', mobileLabel: 'Settings', icon: SettingsIcon, mobileIcon: SettingsIcon },
];
