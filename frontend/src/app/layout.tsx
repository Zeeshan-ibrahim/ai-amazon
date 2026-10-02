import type { Metadata, Viewport } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MallHub',
  description:
    'Amazon arbitrage trading dashboard — orders, partnership plans and ledger.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0A0A0A',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={outfit.variable}>
      {/*
        Browser extensions (password managers, Grammarly, dark-mode tools)
        inject attributes onto <body> before React hydrates, which React
        reports as an attribute mismatch. suppressHydrationWarning only
        applies one level deep, so real mismatches inside the app still warn.
      */}
      <body className="font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
