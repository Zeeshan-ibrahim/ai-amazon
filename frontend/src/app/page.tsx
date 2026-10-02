import type { Metadata } from 'next';
import {
  Audience,
  CallToAction,
  Faqs,
  Footer,
  Hero,
  HowItWorks,
  Intro,
  PlatformPreview,
  Security,
  WhyMallHub,
} from '@/components/landing/sections';

export const metadata: Metadata = {
  title: 'MallHub — Structured trade workflow demo',
  description:
    'Final-year academic project: a product trading workflow dashboard with simulated data.',
};

export default function Home() {
  return (
    <main className="overflow-x-hidden bg-cream">
      <Hero />
      <Intro />
      <PlatformPreview />
      <WhyMallHub />
      <HowItWorks />
      <Security />
      <Audience />
      <CallToAction />
      <Faqs />
      <Footer />
    </main>
  );
}
