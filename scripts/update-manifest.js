#!/usr/bin/env node

/**
 * Script to update the Farcaster manifest with the correct domain
 * Usage: node scripts/update-manifest.js <domain>
 * Example: node scripts/update-manifest.js degenstaker.app
 */

const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, '../public/.well-known/farcaster.json');

function updateManifest(domain) {
  if (!domain) {
    console.error('Error: Please provide a domain');
    console.log('Usage: node scripts/update-manifest.js <domain>');
    console.log('Example: node scripts/update-manifest.js degenstaker.app');
    process.exit(1);
  }

  // Remove protocol if provided
  domain = domain.replace(/^https?:\/\//, '');
  
  try {
    // Read current manifest
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Update all URLs with new domain
    const httpsUrl = `https://${domain}`;
    
    manifest.miniapp.homeUrl = httpsUrl;
    manifest.miniapp.iconUrl = `${httpsUrl}/icon.png`;
    manifest.miniapp.splashImageUrl = `${httpsUrl}/splash.png`;
    manifest.miniapp.webhookUrl = `${httpsUrl}/api/webhook`;
    manifest.miniapp.heroImageUrl = `${httpsUrl}/thumb.png`;
    manifest.miniapp.ogImageUrl = `${httpsUrl}/thumb.png`;
    manifest.miniapp.canonicalDomain = domain;
    
    // Write updated manifest
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    
    console.log(`✅ Manifest updated successfully for domain: ${domain}`);
    console.log(`📍 Manifest location: ${manifestPath}`);
    console.log(`🌐 Accessible at: ${httpsUrl}/.well-known/farcaster.json`);
    
    // Warn about account association
    console.log('\n⚠️  IMPORTANT: Remember to update the account association if the domain changes!');
    console.log('   Visit: https://farcaster.xyz/~/developers/mini-apps/manifest');
    
  } catch (error) {
    console.error('Error updating manifest:', error.message);
    process.exit(1);
  }
}

// Get domain from command line arguments
const domain = process.argv[2];
updateManifest(domain);