import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base = (props: IconProps) => ({
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...props,
});

export const MonitorIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="2.5" y="4" width="19" height="13" rx="2" />
    <path d="M8.5 20.5h7M12 17v3.5" />
  </svg>
);

export const BoxIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M21 8.2 12 3 3 8.2v7.6L12 21l9-5.2V8.2Z" />
    <path d="m3 8.2 9 5.2 9-5.2M12 13.4V21" />
  </svg>
);

export const PlanIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 3h11l3 3v15H5z" />
    <path d="M8.5 8.5h7M8.5 12.5h7M8.5 16.5h4" />
  </svg>
);

export const HistoryIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" />
    <path d="M3.2 4v4.2h4.2M12 7.5V12l3 1.8" />
  </svg>
);

export const SettingsIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 14.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.11a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.11a1.7 1.7 0 0 0 1.56-1.11 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1-1.56V3a2 2 0 1 1 4 0v.11a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.56 1H21a2 2 0 1 1 0 4h-.11a1.7 1.7 0 0 0-1.49 1.5Z" />
  </svg>
);

export const GridIcon = (p: IconProps) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <rect x="3" y="3" width="7.5" height="7.5" rx="1.6" />
    <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6" />
    <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6" />
    <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6" />
  </svg>
);

export const LogoutIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M14 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2" />
    <path d="M17 15.5 20.5 12 17 8.5M20 12H9.5" />
  </svg>
);

export const FlameIcon = (p: IconProps) => (
  <svg {...base(p)} strokeWidth={1.3}>
    <path d="M12 3s5.5 4.2 5.5 9a5.5 5.5 0 1 1-11 0c0-2.1 1.2-3.9 2.4-5.1.3 1.4 1.1 2.4 2 2.4 1.4 0 1.6-2.4 1.1-6.3Z" />
  </svg>
);

export const BarsIcon = (p: IconProps) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <rect x="3" y="13" width="4" height="8" rx="1.2" />
    <rect x="10" y="8" width="4" height="13" rx="1.2" />
    <rect x="17" y="3" width="4" height="18" rx="1.2" />
  </svg>
);

export const DownloadIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3.5v11M7.5 10.5 12 15l4.5-4.5M4 19h16" />
  </svg>
);

export const UploadIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 20.5v-11M7.5 13.5 12 9l4.5 4.5M4 5h16" />
  </svg>
);

export const EyeIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const EyeOffIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M9.9 5.8A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3.2 4.05M6.4 7.6A17 17 0 0 0 2.5 12S6 18.5 12 18.5c1 0 1.93-.18 2.8-.48" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18" />
  </svg>
);

export const CopyIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="9" y="9" width="12" height="12" rx="2.2" />
    <path d="M5.5 15H4.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5v1" />
  </svg>
);

export const CheckIcon = (p: IconProps) => (
  <svg {...base(p)} strokeWidth={2}>
    <path d="m4.5 12.5 5 5 10-11" />
  </svg>
);

export const ExternalIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M14 4h6v6M20 4l-8.5 8.5" />
    <path d="M18 14v5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 19V8a1.5 1.5 0 0 1 1.5-1.5H10" />
  </svg>
);

export const ShieldIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3 4.5 6v6c0 4.5 3.2 7.8 7.5 9 4.3-1.2 7.5-4.5 7.5-9V6Z" />
    <path d="m9 12 2.2 2.2L15.5 10" />
  </svg>
);

export const ArrowUpRightIcon = (p: IconProps) => (
  <svg {...base(p)} strokeWidth={1.8}>
    <path d="M7 17 17 7M8.5 7H17v8.5" />
  </svg>
);

export const ArrowDownIcon = (p: IconProps) => (
  <svg {...base(p)} strokeWidth={1.8}>
    <path d="M12 5v14M6 13l6 6 6-6" />
  </svg>
);

export const AlertIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5V13M12 16.2v.2" />
  </svg>
);

export const CloseIcon = (p: IconProps) => (
  <svg {...base(p)} strokeWidth={1.8}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const UploadCloudIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 16V8M8.5 11 12 7.5l3.5 3.5" />
    <path d="M5 19h14" />
  </svg>
);

export const MenuIcon = (p: IconProps) => (
  <svg {...base(p)} strokeWidth={1.8}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const CrownIcon = (p: IconProps) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <path d="M3 8.5 6.5 12 12 5l5.5 7L21 8.5 19.2 19H4.8L3 8.5Z" />
  </svg>
);

export const LogoMark = (p: IconProps) => (
  <svg viewBox="0 0 48 32" fill="currentColor" width={44} height={30} {...p}>
    <path d="M2 30C2 16 6.5 4 12.5 4c4.2 0 5.6 4.4 5.6 10.2 0 3-.4 6.3-1 9.3 2.4-6.6 5.6-13.8 9.4-13.8 3 0 4 2.9 4 7.2 0 2.5-.3 5.3-.8 7.9 2-5.4 4.6-10.6 7.5-10.6 2.4 0 3.3 2.4 3.3 5.6 0 4-1.2 8.6-2.6 12.2h-4.6c1.3-3.4 2.4-7.6 2.4-10.4 0-1-.1-1.6-.6-1.6-1.6 0-5 8.4-6.4 12h-4.6c1.2-3.8 2.2-8.7 2.2-11.8 0-1.3-.2-2-.8-2-2 0-5.8 9.2-7.4 13.8H13c1.4-4.6 2.6-11 2.6-15 0-2.6-.5-3.9-1.8-3.9-3 0-6.6 10.6-6.6 20.9H2Z" />
  </svg>
);

/* ---------------------------------------------------------- admin nav */

export const LayoutIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3.5" y="3.5" width="7" height="9" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="5" rx="1.5" />
    <rect x="13.5" y="11.5" width="7" height="9" rx="1.5" />
    <rect x="3.5" y="15.5" width="7" height="5" rx="1.5" />
  </svg>
);

export const UsersIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20.5c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
    <path d="M15 4.7a3.5 3.5 0 0 1 0 6.6M17.5 14.8c2.4.6 4 2.7 4 5.7" />
  </svg>
);

export const BagIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="4" y="3.5" width="16" height="17" rx="2.5" />
    <path d="M4 8h16M8.5 11.5a3.5 3.5 0 0 0 7 0" />
  </svg>
);

export const SwapIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M20 8H4.5M8 4.5 4.5 8 8 11.5" />
    <path d="M4 16h15.5M16 12.5l3.5 3.5-3.5 3.5" />
  </svg>
);

export const ImageIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
    <circle cx="9" cy="9" r="1.8" />
    <path d="m20.5 15-5-5-11 10.5" />
  </svg>
);

export const WalletIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M19 7.5V6a2.5 2.5 0 0 0-2.5-2.5h-10A2.5 2.5 0 0 0 4 6v12a2.5 2.5 0 0 0 2.5 2.5h12A1.5 1.5 0 0 0 20 19v-2" />
    <path d="M4 7.5h15a1.5 1.5 0 0 1 1.5 1.5v3" />
    <circle cx="18" cy="14.5" r="2.5" />
  </svg>
);

export const UserIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 21c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5" />
  </svg>
);

export const SearchIcon = (p: IconProps) => (
  <svg {...base(p)} strokeWidth={1.8}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20.5 20.5-4.5-4.5" />
  </svg>
);

export const UserPlusIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="9.5" cy="8" r="4" />
    <path d="M2.5 20.5c0-3.8 3.1-6.5 7-6.5 1.6 0 3 .4 4.2 1.2M18.5 13.5v7M15 17h7" />
  </svg>
);

export const EditIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M11.5 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5.5" />
    <path d="M17.6 3.4a2 2 0 0 1 2.9 2.9L12 14.8 8.5 15.5l.7-3.5Z" />
  </svg>
);

export const ChevronLeftIcon = (p: IconProps) => (
  <svg {...base(p)} strokeWidth={2}>
    <path d="m15 5-7 7 7 7" />
  </svg>
);

export const CartIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M2.5 3.5h2.6l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.2L21 7.5H6" />
    <circle cx="9.5" cy="20" r="1.2" />
    <circle cx="17" cy="20" r="1.2" />
  </svg>
);

export const LayersIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m12 3 9 4.5-9 4.5-9-4.5Z" />
    <path d="m3 12 9 4.5 9-4.5M3 16.5 12 21l9-4.5" />
  </svg>
);

export const ClockIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);

export const ArrowDownLeftIcon = (p: IconProps) => (
  <svg {...base(p)} strokeWidth={1.8}>
    <path d="M17 7 7 17M15.5 17H7V8.5" />
  </svg>
);

export const ArrowRightIcon = (p: IconProps) => (
  <svg {...base(p)} strokeWidth={2}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const ArrowLeftIcon = (p: IconProps) => (
  <svg {...base(p)} strokeWidth={2}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);

export const ChevronRightIcon = (p: IconProps) => (
  <svg {...base(p)} strokeWidth={2}>
    <path d="m9 5 7 7-7 7" />
  </svg>
);

export const HelpIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.3-2.4 3.8M12 17h.01" />
  </svg>
);
