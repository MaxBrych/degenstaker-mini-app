// app/layout.tsx
import type { Metadata } from 'next';

import { getSession } from '~/auth';
import '~/app/globals.css';
import { Providers } from '~/app/providers';
import { APP_NAME, APP_DESCRIPTION } from '~/lib/constants';
import { Geist, Geist_Mono } from 'next/font/google';
import { MiniAppBoot } from '~/components/MiniAppBoot';

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });

const APP_URL = 'https://degenstaker-miniapp.vercel.app';

/**
 * Mini App embed metadata (what the cast preview reads)
 * NOTE:
 * - imageUrl MUST be 3:2 (e.g., 1200x800) and public
 * - splashImageUrl should be a square PNG (~200x200)
 */
const frameMetadata = {
  version: '1', 
  imageUrl: `${APP_URL}/image.png`,
  button: {
    title: 'Stake DEGEN',
    action: {
      type: 'launch_frame',
      name: 'Degen Staker',
      url: APP_URL,
      splashImageUrl: `${APP_URL}/splash.png`,
      splashBackgroundColor: '#684591',
    },
  },
} as const;

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  openGraph: {
    title: APP_NAME,
    description: APP_DESCRIPTION,
    url: APP_URL,
    images: [`${APP_URL}/thumb.png`], // 1200x630 for OG link previews
  },
  // ← This is the important part: Next will render these as <meta name="fc:*" .../>
  other: {
    'fc:miniapp': JSON.stringify(frameMetadata),
    'fc:frame': JSON.stringify(frameMetadata), // optional back-compat
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans">
        <MiniAppBoot />
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
