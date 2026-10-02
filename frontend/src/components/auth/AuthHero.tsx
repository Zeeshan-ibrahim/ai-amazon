import { Logo } from '@/components/layout/Logo';

/**
 * Dark "orbit" panel. Rendered as a full-height column on desktop and as a
 * rounded banner above the form on mobile.
 */
export function AuthHero() {
  return (
    <div className="relative isolate flex flex-col overflow-hidden bg-[#040404] lg:min-h-screen">
      {/* green glow rising from the bottom */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(120%_85%_at_50%_120%,#1E7A52_0%,#0C3A27_35%,#050A07_68%,#030303_100%)]" />

      {/* orbital rings */}
      <svg
        viewBox="0 0 600 600"
        aria-hidden
        className="absolute left-1/2 top-1/2 -z-10 h-[150%] w-[150%] -translate-x-1/2 -translate-y-1/2 opacity-70"
      >
        <defs>
          <radialGradient id="globe" cx="50%" cy="45%" r="50%">
            <stop offset="45%" stopColor="#0A0A0A" />
            <stop offset="78%" stopColor="#B9C6BE" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#0A0A0A" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="300" cy="290" r="128" fill="url(#globe)" />
        <circle
          cx="300"
          cy="290"
          r="126"
          fill="none"
          stroke="#DCE6E0"
          strokeOpacity="0.28"
          strokeDasharray="1 5"
          strokeWidth="1.4"
        />
        <ellipse
          cx="300"
          cy="292"
          rx="238"
          ry="96"
          fill="none"
          stroke="#E7EFE9"
          strokeOpacity="0.26"
          strokeWidth="1"
          transform="rotate(-22 300 292)"
        />
        <ellipse
          cx="300"
          cy="292"
          rx="212"
          ry="128"
          fill="none"
          stroke="#E7EFE9"
          strokeOpacity="0.16"
          strokeWidth="1"
          transform="rotate(14 300 292)"
        />
        <ellipse
          cx="300"
          cy="292"
          rx="256"
          ry="70"
          fill="none"
          stroke="#E7EFE9"
          strokeOpacity="0.12"
          strokeWidth="1"
          transform="rotate(-38 300 292)"
        />
      </svg>

      <div className="flex flex-col items-center px-6 pb-10 pt-10 lg:hidden">
        <Logo markClassName="text-white h-8 w-12" className="flex-col gap-2 text-white" />
      </div>

      <div className="hidden lg:block lg:flex-1" />

      <div className="hidden px-10 pb-10 text-[13px] leading-relaxed text-white/45 lg:block">
        <p>© 2026 MallHub</p>
        <p>All rights reserved.</p>
      </div>
    </div>
  );
}
