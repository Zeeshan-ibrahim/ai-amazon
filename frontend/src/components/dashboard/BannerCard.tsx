import { ImageIcon } from '@/components/ui/Icons';
import type { Banner } from '@/lib/types';

/** Support account's Telegram username, without the @. Unset → banners aren't links. */
const TELEGRAM_SUPPORT = process.env.NEXT_PUBLIC_TELEGRAM_SUPPORT?.replace(/^@/, '');

/** Opens the support chat with the banner's note typed into the message box. */
const supportLink = (banner: Banner) =>
  TELEGRAM_SUPPORT
    ? `https://t.me/${TELEGRAM_SUPPORT}${banner.supportNote ? `?text=${encodeURIComponent(banner.supportNote)}` : ''}`
    : null;

export function BannerCard({ banner }: { banner: Banner }) {
  const href = supportLink(banner);
  const body = (
    <>
      <div className="aspect-[16/9] bg-black/[0.03]">
        {banner.image ? (
          // Plain <img>: admins paste banner images from any host.
          <img
            src={banner.image}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-black/15">
            <ImageIcon className="h-12 w-12" />
          </div>
        )}
      </div>
      <div className="p-5">
        <p className="font-medium text-ink">{banner.title}</p>
        {banner.description && (
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{banner.description}</p>
        )}
      </div>
    </>
  );

  const className = 'block overflow-hidden rounded-card border border-line bg-white shadow-card';
  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${className} transition-shadow hover:shadow-lg`}
    >
      {body}
    </a>
  ) : (
    <article className={className}>{body}</article>
  );
}
