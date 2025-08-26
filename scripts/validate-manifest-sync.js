#!/usr/bin/env node

/**
 * Script to validate that all project files are synced with the hosted Farcaster manifest
 * Usage: node scripts/validate-manifest-sync.js
 */

import https from 'https';

const MANIFEST_ID = '0198e1f6-d8ab-8af4-70c2-2b037e040895';
const MANIFEST_URL = `https://api.farcaster.xyz/miniapps/hosted-manifest/${MANIFEST_ID}`;

async function fetchHostedManifest() {
  return new Promise((resolve, reject) => {
    https.get(MANIFEST_URL, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function validateSync() {
  console.log('🔍 Fetching hosted manifest from Farcaster...');
  
  try {
    const hostedManifest = await fetchHostedManifest();
    const frame = hostedManifest.frame;
    
    console.log('✅ Hosted manifest fetched successfully');
    console.log('\n📋 Hosted Manifest Values:');
    console.log(`Name: "${frame.name}"`);
    console.log(`Description: "${frame.description}"`);
    console.log(`Subtitle: "${frame.subtitle}"`);
    console.log(`Tagline: "${frame.tagline}"`);
    console.log(`Button Title: "${frame.buttonTitle}"`);
    console.log(`Splash Background: "${frame.splashBackgroundColor}"`);
    console.log(`Tags: [${frame.tags.map(t => `"${t}"`).join(', ')}]`);
    console.log(`OG Description: "${frame.ogDescription}"`);
    
    console.log('\n📝 Constants to verify in your code:');
    console.log(`APP_NAME: '${frame.name}'`);
    console.log(`APP_DESCRIPTION: '${frame.description}'`);
    console.log(`APP_SUBTITLE: '${frame.subtitle}'`);
    console.log(`APP_TAGLINE: '${frame.tagline}'`);
    console.log(`APP_BUTTON_TEXT: '${frame.buttonTitle}'`);
    console.log(`APP_SPLASH_BACKGROUND_COLOR: '${frame.splashBackgroundColor}'`);
    console.log(`APP_TAGS: [${frame.tags.map(t => `'${t}'`).join(', ')}]`);
    console.log(`APP_OG_DESCRIPTION: '${frame.ogDescription}'`);
    
    console.log('\n🎯 Key URLs to verify:');
    console.log(`Home URL: ${frame.homeUrl}`);
    console.log(`Icon URL: ${frame.iconUrl}`);
    console.log(`Splash URL: ${frame.splashImageUrl}`);
    console.log(`Webhook URL: ${frame.webhookUrl}`);
    console.log(`Hero Image URL: ${frame.heroImageUrl}`);
    console.log(`OG Image URL: ${frame.ogImageUrl}`);
    
    console.log('\n✅ Validation complete! Ensure all values in src/lib/constants.ts match the above.');
    
  } catch (error) {
    console.error('❌ Error fetching hosted manifest:', error.message);
    process.exit(1);
  }
}

validateSync();