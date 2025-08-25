#!/usr/bin/env node

/**
 * Script to update the Vercel redirect for Farcaster hosted manifest
 * Usage: node scripts/update-manifest.js <manifestId>
 * Example: node scripts/update-manifest.js 0198e1f6-d8ab-8af4-70c2-2b037e040895
 */

const fs = require('fs');
const path = require('path');

const vercelConfigPath = path.join(__dirname, '../vercel.json');

function updateManifestRedirect(manifestId) {
  if (!manifestId) {
    console.error('Error: Please provide a manifest ID');
    console.log('Usage: node scripts/update-manifest.js <manifestId>');
    console.log('Example: node scripts/update-manifest.js 0198e1f6-d8ab-8af4-70c2-2b037e040895');
    process.exit(1);
  }
  
  try {
    // Read current vercel.json or create new one
    let vercelConfig = {};
    if (fs.existsSync(vercelConfigPath)) {
      vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
    }
    
    // Ensure redirects array exists
    if (!vercelConfig.redirects) {
      vercelConfig.redirects = [];
    }
    
    // Remove existing farcaster.json redirect if it exists
    vercelConfig.redirects = vercelConfig.redirects.filter(
      redirect => redirect.source !== '/.well-known/farcaster.json'
    );
    
    // Add new redirect
    const hostedManifestUrl = `https://api.farcaster.xyz/miniapps/hosted-manifest/${manifestId}`;
    vercelConfig.redirects.push({
      source: '/.well-known/farcaster.json',
      destination: hostedManifestUrl,
      permanent: false
    });
    
    // Write updated vercel.json
    fs.writeFileSync(vercelConfigPath, JSON.stringify(vercelConfig, null, 2));
    
    console.log(`✅ Vercel redirect updated successfully!`);
    console.log(`📍 Config location: ${vercelConfigPath}`);
    console.log(`🔗 Manifest ID: ${manifestId}`);
    console.log(`🌐 Hosted manifest URL: ${hostedManifestUrl}`);
    console.log('\n🚀 Deploy to Vercel to activate the redirect!');
    
  } catch (error) {
    console.error('Error updating Vercel config:', error.message);
    process.exit(1);
  }
}

// Get manifest ID from command line arguments
const manifestId = process.argv[2];
updateManifestRedirect(manifestId);