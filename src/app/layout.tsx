import type { Metadata } from 'next';

import { getSession } from '~/auth';
import '~/app/globals.css';
import { Providers } from '~/app/providers';
import { APP_NAME, APP_DESCRIPTION } from '~/lib/constants';
import { Geist, Geist_Mono } from 'next/font/google';

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });

// --- ADD: app URL + embed config (3:2 image) ---
const APP_URL = 'https://degenstaker-miniapp.vercel.app';
const EMBED = {
  version: '1',
  imageUrl: `${APP_URL}/embed-1200x800.png`, // <-- make this 1200x800 (3:2)
  button: {
    title: 'Stake DEGEN',
    action: {
      type: 'launch_frame',
      name: 'Degen Staker',
      url: APP_URL,
      splashImageUrl: `${APP_URL}/splash.png`,
      splashBackgroundColor: '#684591'
    }
  }
} as const;

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  // Optional but nice: OG tags keep Warpcast link previews pretty outside Mini App embeds
  openGraph: {
    title: APP_NAME,
    description: APP_DESCRIPTION,
    url: APP_URL,
    images: [`${APP_URL}/thumb.png`], // 1200x630 is fine here
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        {/* Required for Mini App embed in casts */}
        <meta name="fc:miniapp" content={JSON.stringify(EMBED)} />
        {/* Optional back-compat for older clients */}
        <meta name="fc:frame" content={JSON.stringify(EMBED)} />
      </head>
      <body className="font-sans">
        <Providers session={session}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
