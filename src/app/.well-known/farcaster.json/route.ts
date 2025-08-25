import { NextResponse } from 'next/server';
import {
  APP_URL,
  APP_NAME,
  APP_DESCRIPTION,
  APP_ICON_URL,
  APP_OG_IMAGE_URL,
  APP_BUTTON_TEXT,
  APP_SPLASH_URL,
  APP_SPLASH_BACKGROUND_COLOR,
  APP_WEBHOOK_URL,
  APP_PRIMARY_CATEGORY,
  APP_TAGS,
  APP_ACCOUNT_ASSOCIATION,
} from '~/lib/constants';

export async function GET() {
  const manifest = {
    accountAssociation: APP_ACCOUNT_ASSOCIATION,
    miniapp: {
      version: "1",
      name: APP_NAME,
      iconUrl: APP_ICON_URL,
      homeUrl: APP_URL,
      splashImageUrl: APP_SPLASH_URL,
      splashBackgroundColor: APP_SPLASH_BACKGROUND_COLOR,
      webhookUrl: APP_WEBHOOK_URL,
      subtitle: "High-risk, high-fun staking game",
      description: APP_DESCRIPTION,
      primaryCategory: APP_PRIMARY_CATEGORY,
      heroImageUrl: APP_OG_IMAGE_URL,
      tags: APP_TAGS,
      tagline: "High-risk, high-fun staking",
      ogTitle: APP_NAME,
      ogDescription: "A time-locked staking game on Base. 14–28 days. Multipliers daily. High risk, high fun.",
      ogImageUrl: APP_OG_IMAGE_URL,
      requiredChains: [
        "eip155:8453"
      ]
    }
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  });
}