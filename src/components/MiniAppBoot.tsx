'use client';

import { useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

export function MiniAppBoot() {
  useEffect(() => {
    (async () => {
      try {
        // Only call inside a Farcaster host; no-op on the open web
        if (await sdk.isInMiniApp()) {
          await sdk.actions.ready(); // hides the splash screen
        }
      } catch {
        /* ignore – e.g. running in a normal browser */
      }
    })();
  }, []);

  return null;
}
