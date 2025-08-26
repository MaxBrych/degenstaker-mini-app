import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Manifest } from '@farcaster/miniapp-core/src/manifest';
import {
  APP_BUTTON_TEXT,
  APP_DESCRIPTION,
  APP_ICON_URL,
  APP_NAME,
  APP_OG_IMAGE_URL,
  APP_PRIMARY_CATEGORY,
  APP_SPLASH_BACKGROUND_COLOR,
  APP_SPLASH_URL,
  APP_TAGS,
  APP_URL,
  APP_WEBHOOK_URL,
  APP_ACCOUNT_ASSOCIATION,
  APP_TAGLINE,
  APP_SUBTITLE,
  APP_OG_DESCRIPTION,
  APP_CAST_SHARE_URL,
} from './constants';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getMiniAppEmbedMetadata(ogImageUrl?: string) {
  return {
    version: 'next',
    imageUrl: ogImageUrl ?? `${APP_URL}/image.png`,
    ogTitle: APP_NAME,
    ogDescription: APP_OG_DESCRIPTION,
    ogImageUrl: ogImageUrl ?? APP_OG_IMAGE_URL,
    button: {
      title: APP_BUTTON_TEXT,
      action: {
        type: 'launch_frame',
        name: APP_NAME,
        url: APP_URL,
        splashImageUrl: APP_SPLASH_URL,
        iconUrl: APP_ICON_URL,
        splashBackgroundColor: APP_SPLASH_BACKGROUND_COLOR,
        description: APP_DESCRIPTION,
        primaryCategory: APP_PRIMARY_CATEGORY,
        tags: APP_TAGS,
        subtitle: APP_SUBTITLE,
        tagline: APP_TAGLINE,
        castShareUrl: APP_CAST_SHARE_URL,
        heroImageUrl: APP_OG_IMAGE_URL,
      },
    },
  };
}

export async function getFarcasterDomainManifest(): Promise<Manifest> {
  return {
    accountAssociation: APP_ACCOUNT_ASSOCIATION,
    frame: {
      version: '1',
      name: APP_NAME,
      homeUrl: APP_URL,
      iconUrl: APP_ICON_URL,
      imageUrl: `${APP_URL}/image.png`,
      buttonTitle: APP_BUTTON_TEXT,
      splashImageUrl: APP_SPLASH_URL,
      splashBackgroundColor: APP_SPLASH_BACKGROUND_COLOR,
      webhookUrl: APP_WEBHOOK_URL,
      subtitle: APP_SUBTITLE,
      description: APP_DESCRIPTION,
      primaryCategory: APP_PRIMARY_CATEGORY,
      tags: APP_TAGS,
      tagline: APP_TAGLINE,
      ogTitle: APP_NAME,
      ogDescription: APP_OG_DESCRIPTION,
      ogImageUrl: APP_OG_IMAGE_URL,
      heroImageUrl: APP_OG_IMAGE_URL,
      castShareUrl: APP_CAST_SHARE_URL,
    },
  };
}
