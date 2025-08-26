#!/usr/bin/env node

/**
 * Script to validate all URLs in the project are properly formatted with https://
 * Usage: node scripts/validate-urls.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const manifestPath = path.join(__dirname, '../public/.well-known/farcaster.json');
const envPath = path.join(__dirname, '../.env.local');

function validateUrls() {
  console.log('🔍 Validating all URLs in the project...\n');
  
  let hasErrors = false;

  // Check static manifest
  console.log('📋 Checking static manifest...');
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      const miniapp = manifest.miniapp;
      
      const urlFields = [
        'homeUrl',
        'iconUrl', 
        'imageUrl',
        'splashImageUrl',
        'webhookUrl',
        'heroImageUrl',
        'ogImageUrl',
        'castShareUrl'
      ];

      urlFields.forEach(field => {
        if (miniapp[field]) {
          if (!miniapp[field].startsWith('https://')) {
            console.log(`❌ ${field}: ${miniapp[field]} (missing https://)`);
            hasErrors = true;
          } else {
            console.log(`✅ ${field}: ${miniapp[field]}`);
          }
        }
      });

      // Check canonicalDomain (should NOT have https://)
      if (miniapp.canonicalDomain) {
        if (miniapp.canonicalDomain.includes('://')) {
          console.log(`❌ canonicalDomain: ${miniapp.canonicalDomain} (should not include protocol)`);
          hasErrors = true;
        } else {
          console.log(`✅ canonicalDomain: ${miniapp.canonicalDomain}`);
        }
      }
      
    } catch (error) {
      console.log(`❌ Error reading manifest: ${error.message}`);
      hasErrors = true;
    }
  } else {
    console.log('❌ Manifest file not found');
    hasErrors = true;
  }

  // Check environment variables
  console.log('\n🔧 Checking environment variables...');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      if (line.includes('NEXT_PUBLIC_URL=') || line.includes('NEXTAUTH_URL=')) {
        const [key, value] = line.split('=');
        const cleanValue = value?.replace(/['"]/g, '');
        
        if (cleanValue) {
          if (cleanValue.includes('localhost')) {
            console.log(`⚠️  ${key}: ${cleanValue} (localhost - OK for development)`);
          } else if (!cleanValue.startsWith('https://')) {
            console.log(`❌ ${key}: ${cleanValue} (missing https://)`);
            hasErrors = true;
          } else {
            console.log(`✅ ${key}: ${cleanValue}`);
          }
        }
      }
    });
  } else {
    console.log('⚠️  No .env.local file found');
  }

  // Summary
  console.log('\n📊 Validation Summary:');
  if (hasErrors) {
    console.log('❌ Validation failed! Fix the URLs above.');
    console.log('\n🔧 To fix:');
    console.log('1. In Vercel Dashboard → Settings → Environment Variables');
    console.log('2. Set NEXT_PUBLIC_URL = https://degenstaker-miniapp.vercel.app');
    console.log('3. Set NEXTAUTH_URL = https://degenstaker-miniapp.vercel.app');
    console.log('4. Redeploy your application');
    console.log('5. Test Farcaster Embed Tool again');
    console.log('\n⚠️  Critical: Environment variables MUST include https:// protocol!');
    process.exit(1);
  } else {
    console.log('✅ All URLs are properly formatted!');
    console.log('🚀 Ready for deployment');
    console.log('\n🔍 Final check:');
    console.log('- Test manifest: https://degenstaker-miniapp.vercel.app/.well-known/farcaster.json');
    console.log('- Test Farcaster Embed Tool with your domain');
  }
}

validateUrls();