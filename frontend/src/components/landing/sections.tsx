import Link from 'next/link';
import { LogoMark } from '@/components/ui/Icons';
import { Faq } from './Faq';
import { DotField, DottedBlob, HalftonePanel, OrbitGlobe } from './visuals';

const NAV = [
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#why', label: 'Why MallHub' },
  { href: '#security', label: 'Security' },
  { href: '#faqs', label: 'FAQs' },
];

function Arrow() {
  return <span aria-hidden>→</span>;
}

function Eyebrow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <p className={`font-mono text-[11px] tracking-tight text-ink/70 ${className}`}>{children}</p>;
}

const lightButton =
  'inline-flex items-center gap-1.5 rounded-[10px] bg-white px-5 py-2.5 text-[13px] font-medium text-ink transition hover:bg-white/85';

/* --------------------------------------------------------------- hero */

export function Hero() {
  return (
    <div className="p-2 sm:p-3">
      <section className="relative isolate overflow-hidden rounded-[18px] bg-[#030303] text-white">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(90%_80%_at_0%_100%,#123B29_0%,#0A1D14_45%,#030303_80%)]" />
        <OrbitGlobe className="absolute -right-24 top-16 -z-10 w-[640px] max-w-none opacity-80 sm:-right-10 lg:right-0 lg:top-6 lg:w-[720px]" />

      

        <header className="flex items-center justify-between gap-4 px-4 pt-4 sm:px-6">
          <nav className="flex items-center gap-6 rounded-[12px] border border-white/10 bg-white/[0.04] px-4 py-2.5 backdrop-blur">
            <LogoMark className="h-6 w-9" />
            <ul className="hidden items-center gap-6 text-[12px] text-white/70 md:flex">
              {NAV.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="transition hover:text-white">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-4 text-[13px]">
            <Link href="/login" className="text-white/85 hover:text-white">
              Log In
            </Link>
            <Link href="/signup" className={lightButton}>
              Get Started <Arrow />
            </Link>
          </div>
        </header>

        <div className="px-5 pb-16 pt-28 sm:px-8 sm:pb-24 sm:pt-36 lg:pt-40">
          <h1 className="max-w-[640px] text-[38px] font-normal leading-[1.08] tracking-tight sm:text-[52px]">
            <span className="text-white/60">Explore Product Markets Through</span>{' '}
            A Structured Trade Workflow.
          </h1>
          <p className="mt-6 max-w-[460px] text-[13px] leading-relaxed text-white/80 sm:text-sm">
            Browse a product catalog, compare marketplace prices and walk through purchase, listing
            and settlement in one dashboard. Built as an academic demo with simulated data.
          </p>
          <Link href="/signup" className={`${lightButton} mt-8 px-7 py-3.5`}>
            Get Started <Arrow />
          </Link>
        </div>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------- intro */

const INTRO_CARDS = [
  {
    title: 'Secure Asset Infrastructure',
    body: 'Designed with layered security and controlled operational processes to help protect accounts, transactions, and deposited assets.',
  },
  {
    title: 'Global Market Opportunities',
    body: 'Access a structured environment for discovering and participating in opportunities across high-demand retail and digital markets.',
  },
  {
    title: 'Streamlined Execution',
    body: 'Move through funding, opportunity selection, trade processing, and settlement through a single operational workflow.',
  },
  {
    title: 'Transparent Tracking',
    body: 'Keep track of balances, active activity, transactions, and settlement information from one centralized dashboard.',
  },
];

export function Intro() {
  return (
    <section className="relative mx-auto max-w-[1850px] px-5 py-16 sm:px-8 sm:py-24">
      <DotField className="pointer-events-none absolute inset-0 -z-10" />
      <h2 className="max-w-[580px] text-[32px] font-normal leading-[1.1] tracking-tight sm:text-[42px]">
        A smarter way to manage every stage of the trade cycle.
      </h2>
      <p className="mt-6 max-w-[580px] text-[13px] leading-relaxed text-ink/80 sm:text-sm">
        MallHub brings the operational side of digital trade into one structured platform, giving
        users visibility over their activity from funding through to settlement.
      </p>

      <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {INTRO_CARDS.map((card, i) => (
          <article key={card.title} className="rounded-[14px] bg-[#EFEFEC]/90 p-5">
            <p className="font-mono text-[10px] text-subtle">0{i + 1}</p>
            <h3 className="mt-4 text-[15px] font-medium leading-snug">{card.title}</h3>
            <p className="mt-3 text-[12px] leading-relaxed text-muted">{card.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- dashboard */

const SAMPLE_STATS = [
  { label: 'Available balance', value: '$248,430.00' },
  { label: 'Active orders', value: '12' },
  { label: 'In settlement', value: '4', accent: true },
  { label: 'Completed', value: '86' },
];

const SAMPLE_ROWS = [
  { name: 'Retail restock cycle — EU', market: 'Retail', amount: '$42,000', status: 'Active' },
  { name: 'Cross-market demand spread', market: 'Digital', amount: '$18,500', status: 'Settling' },
  { name: 'Seasonal availability gap — APAC', market: 'Retail', amount: '$65,200', status: 'Complete' },
];

const PLATFORM_FEATURES = [
  { title: 'Account Overview', body: 'Monitor your balance, active orders and recent account activity at a glance.' },
  { title: 'Order Tracking', body: 'Review assigned product orders and their details before purchasing.' },
  { title: 'Trade Activity', body: 'Keep a clear record of active and completed trade operations.' },
  { title: 'Settlement Tracking', body: 'Follow each transaction from execution through completion.' },
];

export function PlatformPreview() {
  return (
    <section className="mx-auto max-w-[1850px] px-5 pb-16 sm:px-8 sm:pb-24">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <h2 className="text-[32px] font-normal leading-[1.1] tracking-tight sm:text-[42px]">
          One platform.
          <br />
          Complete visibility.
        </h2>
        <Link
          href="/signup"
          className="inline-flex w-fit items-center gap-1.5 rounded-[10px] border border-line bg-white px-5 py-2.5 text-[13px] font-medium hover:bg-cream"
        >
          Explore the Platform <Arrow />
        </Link>
      </div>
      <p className="mt-6 max-w-[580px] text-[13px] leading-relaxed text-ink/80 sm:text-sm">
        Instead of tracking activity across disconnected tools, MallHub brings your account, orders,
        transactions and settlements together in one workspace.
      </p>

      <div className="mt-12 rounded-[18px] bg-[#0B0C0C] p-2 shadow-[0_30px_80px_-30px_rgba(46,122,88,0.55)]">
        <div className="overflow-x-auto rounded-[12px] border border-white/5 text-white">
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
            <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-white/50">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
              Dashboard / Overview
            </p>
            <span className="rounded-pill border border-white/15 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-white/60">
              Sample data
            </span>
          </div>

          <div className="grid grid-cols-2 gap-6 border-b border-white/5 px-5 py-6 lg:grid-cols-4">
            {SAMPLE_STATS.map((stat) => (
              <div key={stat.label}>
                <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">{stat.label}</p>
                <p className={`tabular mt-2 text-xl sm:text-2xl ${stat.accent ? 'text-brand-300' : ''}`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <table className="w-full min-w-[560px] text-left text-[12px]">
            <thead className="text-[10px] uppercase tracking-[0.14em] text-white/35">
              <tr>
                <th className="px-5 py-3 font-normal">Order</th>
                <th className="px-5 py-3 font-normal">Market</th>
                <th className="px-5 py-3 font-normal">Allocated</th>
                <th className="px-5 py-3 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_ROWS.map((row) => (
                <tr key={row.name} className="border-t border-white/5">
                  <td className="px-5 py-4 text-white/90">{row.name}</td>
                  <td className="px-5 py-4 text-white/50">{row.market}</td>
                  <td className="tabular px-5 py-4 text-white/50">{row.amount}</td>
                  <td
                    className={`px-5 py-4 text-[10px] uppercase tracking-[0.1em] ${
                      row.status === 'Active' ? 'text-brand-300' : 'text-white/50'
                    }`}
                  >
                    {row.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-14 grid gap-8 px-1 sm:grid-cols-2 lg:grid-cols-4">
        {PLATFORM_FEATURES.map((f) => (
          <div key={f.title} className="border-t border-line pt-6">
            <h3 className="text-[15px] font-medium">{f.title}</h3>
            <p className="mt-3 text-[12px] leading-relaxed text-muted">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- why */

const WHY = [
  {
    title: 'Clear Ownership',
    body: 'Every member, plan and product belongs to the admin who created it, so each team only sees and manages its own records.',
  },
  {
    title: 'Structured Order Flow',
    body: 'Orders move through purchase, sell and completed queues, with balance checks before each step.',
  },
  {
    title: 'Complete Ledger',
    body: 'Each purchase, sale, adjustment and settlement is recorded as a transaction you can review at any time.',
  },
  {
    title: 'Admin Oversight',
    body: 'Deposits, withdrawals and plan requests go through an approval queue, and every admin action is written to an audit log.',
  },
];

export function WhyMallHub() {
  return (
    <section id="why" className="mx-auto grid max-w-[1850px] scroll-mt-6 gap-12 px-5 pb-16 sm:px-8 sm:pb-24 lg:grid-cols-2">
      <div>
        <Eyebrow>Why MallHub</Eyebrow>
        <h2 className="mt-8 text-[32px] font-normal leading-[1.15] tracking-tight sm:text-[44px]">
          Designed Around The Way Digital Trade Actually Works
        </h2>
        <p className="mt-10 max-w-[440px] text-[13px] leading-relaxed text-ink/80 sm:text-sm">
          Whether you are managing a single order or many trade activities, MallHub gives you the
          tools to stay informed at every stage.
        </p>
      </div>
      <div className="divide-y divide-line">
        {WHY.map((item) => (
          <div key={item.title} className="py-6 first:pt-0">
            <h3 className="text-lg font-normal">{item.title}</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-ink/75">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------- how it works */

const STEPS = [
  { title: 'Fund Your Demo Balance', body: 'Submit a simulated deposit request, which an administrator reviews and approves.' },
  { title: 'Purchase Product Lots', body: 'Pick an assigned product order and purchase it from your available balance.' },
  { title: 'List And Sell', body: 'Move purchased items to the sell queue and complete the sale.' },
  {
    title: 'Settlement To Your Ledger',
    body: 'The settled amount and its sample margin are recorded back to your ledger balance.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-6 px-2 pb-16 sm:px-3 sm:pb-24">
      <div className="relative isolate mx-auto max-w-[1850px] overflow-hidden rounded-[18px] bg-black px-5 py-8 text-white sm:px-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_70%_at_85%_10%,#1F5B40_0%,#0C2B1E_40%,transparent_75%)] opacity-80" />
        <div className="flex items-center gap-4">
          <p className="font-mono text-[11px] text-white/70">How it works</p>
          <span className="h-px flex-1 bg-white/10" />
        </div>
        <h2 className="mt-14 max-w-[460px] text-[32px] font-normal leading-[1.1] tracking-tight sm:text-[42px]">
          How The MallHub Workflow Works
        </h2>

        <div className="mt-12 grid items-center gap-10 lg:grid-cols-[1fr_2fr]">
          <DottedBlob className="mx-auto w-56 sm:w-64" />
          <ol className="space-y-2 border-t border-white/10 pt-2">
            {STEPS.map((step, i) => (
              <li key={step.title} className="group rounded-[6px] border-b border-white/10 px-1 py-5 transition hover:bg-white/[0.04] sm:px-4">
                <div className="flex gap-6">
                  <span className="font-mono text-[11px] text-white/40">0{i + 1}</span>
                  <div>
                    <h3 className="text-[14px]">{step.title}</h3>
                    <p className="mt-3 max-w-[460px] text-[12px] leading-relaxed text-white/70">{step.body}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- security */

const SECURITY = [
  { title: 'Layered Protection', body: 'Session cookies, hashed passwords and role checks on every API route protect account access.' },
  { title: 'Controlled Transactions', body: 'Deposit and withdrawal requests require admin approval before any balance changes.' },
  { title: 'Secure Infrastructure', body: 'The server validates ownership on every request, never trusting the role or owner sent by the client.' },
  { title: 'Transparent Activity', body: 'Review account activity and transaction history so you always know where things stand.' },
];

export function Security() {
  return (
    <section id="security" className="mx-auto grid max-w-[1850px] scroll-mt-6 gap-10 px-5 pb-16 sm:px-8 sm:pb-24 lg:grid-cols-2">
      <div>
        <Eyebrow>Security at every step</Eyebrow>
        <h2 className="mt-6 text-[32px] font-normal leading-[1.2] tracking-tight sm:text-[44px]">
          Your account deserves infrastructure built for trust.
        </h2>
        <p className="mt-6 max-w-[340px] text-[13px] leading-relaxed text-muted">
          Security is built into the way MallHub manages accounts, transactions and operational
          activity.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {SECURITY.map((item) => (
          <article key={item.title} className="rounded-[12px] border border-line bg-[#EFEFEC] p-5">
            <h3 className="text-[14px] font-medium">{item.title}</h3>
            <p className="mt-3 text-[12px] leading-relaxed text-muted">{item.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ audience */

export function Audience() {
  return (
    <section className="mx-auto grid max-w-[1850px] gap-10 px-5 pb-16 sm:px-8 sm:pb-24 lg:grid-cols-[2fr_3fr]">
      <div className="flex flex-col">
        <div className="flex items-center gap-4">
          <Eyebrow>Who is MallHub for?</Eyebrow>
          <span className="h-px flex-1 bg-line" />
        </div>
        <p className="mt-8 max-w-[380px] text-[13px] leading-relaxed text-ink/85">
          MallHub is designed for users who value structured workflows, centralized information and
          greater visibility into their digital trade activity.
        </p>
        <h2 className="mt-12 text-[32px] font-normal leading-[1.1] tracking-tight sm:text-[40px] lg:mt-auto">
          Built For Digital Trade Participants
        </h2>
        <Link
          href="/signup"
          className="mt-8 inline-flex w-fit items-center gap-2 rounded-[10px] bg-ink px-6 py-3 font-mono text-[12px] text-white hover:bg-ink/85"
        >
          Get Started <Arrow />
        </Link>
      </div>

      <div className="flex min-h-[400px] gap-2">
        {['For Individual Participants', 'For Active Traders'].map((label, i) => (
          <div key={label} className="hidden w-[70px] flex-col items-center justify-between rounded-[14px] bg-[#EFEFEC] py-3 sm:flex">
            <span className="rounded-pill border border-line px-2.5 py-1 font-mono text-[10px] text-subtle">
              00{i + 1}
            </span>
            <span className="rotate-180 text-[15px] [writing-mode:vertical-rl]">{label}</span>
          </div>
        ))}
        <article className="flex flex-1 flex-col rounded-[14px] border border-line bg-cream p-5">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-xl font-medium">For Global Operators</h3>
            <span className="rounded-pill border border-line px-2.5 py-1 font-mono text-[10px] text-subtle">003</span>
          </div>
          <p className="mt-4 max-w-[340px] text-[12px] leading-relaxed text-ink/80">
            Keep international market activity organized within a centralized operational
            environment.
          </p>
          <HalftonePanel className="mt-8 min-h-[200px] flex-1 rounded-[12px]" />
        </article>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- cta */

export function CallToAction() {
  return (
    <section className="px-5 pb-16 sm:px-8 sm:pb-24">
      <div className="relative isolate mx-auto max-w-[980px] overflow-hidden rounded-[18px] bg-black px-6 py-16 text-center text-white sm:py-20">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(50%_60%_at_50%_45%,#14402D_0%,#0A1D14_45%,transparent_80%)]" />
        <h2 className="mx-auto max-w-[560px] text-[32px] font-normal leading-[1.1] tracking-tight sm:text-[44px]">
          Bring your digital trade operations into one place.
        </h2>
        <p className="mx-auto mt-5 max-w-[540px] text-[13px] leading-relaxed text-white/60">
          Explore orders, manage your account and track your activity through a structured platform
          built for modern digital trade.
        </p>
        <Link href="/signup" className={`${lightButton} mt-8 px-8 py-3`}>
          Get Started <Arrow />
        </Link>
        <p className="mt-6 text-[12px] text-white/50">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-white underline">
            Log In
          </Link>
        </p>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- faqs */

export function Faqs() {
  return (
    <section id="faqs" className="mx-auto grid max-w-[1850px] scroll-mt-6 gap-10 px-5 pb-20 sm:px-8 sm:pb-28 lg:grid-cols-2">
      <div>
        <p className="text-[11px] text-ink/70">FAQs</p>
        <h2 className="mt-6 text-[32px] font-normal leading-[1.2] tracking-tight sm:text-[40px]">
          Frequently Asked
          <br />
          Questions
        </h2>
        <LogoMark className="mt-8 hidden h-32 w-48 text-[#E9E7E0] lg:block" />
      </div>
      <Faq />
    </section>
  );
}

/* -------------------------------------------------------------- footer */

const FOOTER = [
  { title: 'Platform', links: NAV.slice(0, 3) },
  { title: 'Company', links: [{ href: '#faqs', label: 'FAQs' }, { href: '/login', label: 'Log In' }] },
  { title: 'Account', links: [{ href: '/signup', label: 'Create account' }, { href: '/login', label: 'Sign in' }] },
];

export function Footer() {
  return (
    <footer className="relative isolate overflow-hidden bg-black text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(50%_60%_at_45%_110%,#1F5B40_0%,#0C2B1E_40%,transparent_80%)]" />
      <div className="mx-auto grid max-w-[1850px] gap-10 border-x border-white/5 px-5 py-12 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
        <div className="flex items-start gap-3">
          <LogoMark className="h-7 w-10" />
          <p className="text-lg leading-tight">MallHub</p>
        </div>
        {FOOTER.map((col) => (
          <div key={col.title}>
            <p className="text-lg">{col.title}</p>
            <ul className="mt-6 space-y-3 text-[12px] text-white/75">
              {col.links.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="hover:text-white">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto flex max-w-[1850px] flex-col gap-2 border-x border-t border-white/5 px-5 py-6 text-[11px] text-white/55 sm:flex-row sm:justify-between sm:px-8">
        <p>© {new Date().getFullYear()} MallHub. Final-year academic project.</p>
        <p>Simulated demo. No real funds are accepted or paid out.</p>
      </div>
    </footer>
  );
}
