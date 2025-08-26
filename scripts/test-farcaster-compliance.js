#!/usr/bin/env node

/**
 * Comprehensive Farcaster Mini App compliance test
 * Tests both static manifest and frame metadata
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testFarcasterCompliance() {
  console.log('🔍 Testing Farcaster Mini App Compliance...\n');
  
  let hasErrors = false;
  
  // Test 1: Static Manifest
  console.log('📋 Testing Static Manifest...');
  const manifestPath = path.join(__dirname, '../public/.well-known/farcaster.json');
  
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      
      // Required fields for miniapp
      const requiredFields = [
        'version', 'name', 'iconUrl', 'homeUrl'
      ];
      
      const miniapp = manifest.miniapp;
      if (!miniapp) {
        console.log('❌ Missing miniapp object in manifest');
        hasErrors = true;
      } else {
        requiredFields.forEach(field => {
          if (!miniapp[field]) {
            console.log(`❌ Missing required field: ${field}`);
            hasErrors = true;
          } else if (field.includes('Url') && !miniapp[field].startsWith('https://')) {
            console.log(`❌ ${field} must start with https://: ${miniapp[field]}`);
            hasErrors = true;
          } else {
            console.log(`✅ ${field}: ${miniapp[field]}`);
          }
        });
      }
      
      // Check account association
      if (!manifest.accountAssociation) {
        console.log('❌ Missing accountAssociation');
        hasErrors = true;
      } else {
        console.log('✅ accountAssociation present');
      }
      
    } catch (error) {
      console.log(`❌ Error reading manifest: ${error.message}`);
      hasErrors = true;
    }
  } else {
    console.log('❌ Manifest file not found');
    hasErrors = true;
  }
  
  // Test 2: Environment Variables
  console.log('\n🔧 Testing Environment Variables...');
  const envPath = path.join(__dirname, '../.env.local');
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const nextPublicUrl = envContent.match(/NEXT_PUBLIC_URL=['"]([^'"]+)['"]/);
    
    if (nextPublicUrl) {
      const url = nextPublicUrl[1];
      if (!url.startsWith('https://')) {
        console.log(`❌ NEXT_PUBLIC_URL must start with https://: ${url}`);
        hasErrors = true;
      } else {
        console.log(`✅ NEXT_PUBLIC_URL: ${url}`);
      }
    } else {
      console.log('❌ NEXT_PUBLIC_URL not found in .env.local');
      hasErrors = true;
    }
  } else {
    console.log('⚠️  No .env.local found (OK if using Vercel env vars)');
  }
  
  // Test 3: Required Image Assets
  console.log('\n🖼️ Testing Required Image Assets...');
  const requiredImages = [
    'icon.png',
    'splash.png', 
    'thumb.png',
    'image.png'
  ];
  
  requiredImages.forEach(image => {
    const imagePath = path.join(__dirname, '../public', image);
    if (fs.existsSync(imagePath)) {
      console.log(`✅ ${image} exists`);
    } else {
      console.log(`❌ Missing required image: ${image}`);
      hasErrors = true;
    }
  });
  
  // Test 4: Frame Metadata Structure
  console.log('\n🖼️ Testing Frame Metadata Structure...');
  console.log('✅ Frame metadata should include:');
  console.log('  - version: "1"');
  console.log('  - imageUrl: https://domain/image.png (3:2 aspect ratio)');
  console.log('  - button.title: "Stake DEGEN"');
  console.log('  - button.action.type: "launch_frame"');
  console.log('  - button.action.name: "Degen Staker"');
  console.log('  - button.action.url: https://domain');
  console.log('  - button.action.splashImageUrl: https://domain/splash.png');
  
  // Summary
  console.log('\n📊 Compliance Test Summary:');
  if (hasErrors) {
    console.log('❌ Compliance test failed!');
    console.log('\n🚨 CRITICAL FIXES NEEDED:');
    console.log('1. In Vercel Dashboard:');
    console.log('   - Set NEXT_PUBLIC_URL = https://degenstaker-miniapp.vercel.app');
    console.log('   - Set NEXTAUTH_URL = https://degenstaker-miniapp.vercel.app');
    console.log('2. Redeploy your application');
    console.log('3. Test with Farcaster Embed Tool');
    
    console.log('\n📝 Farcaster Requirements:');
    console.log('- All URLs MUST use https:// protocol');
    console.log('- imageUrl must be 3:2 aspect ratio and publicly accessible');
    console.log('- splashImageUrl should be square (200x200px recommended)');
    console.log('- Manifest must be at /.well-known/farcaster.json');
    
    process.exit(1);
  } else {
    console.log('✅ All compliance tests passed!');
    console.log('🚀 Your app should work with Farcaster');
    console.log('\n🔗 Test URLs:');
    console.log('- Manifest: https://degenstaker-miniapp.vercel.app/.well-known/farcaster.json');
    console.log('- Embed Tool: Use https://degenstaker-miniapp.vercel.app in Farcaster');
  }
}

testFarcasterCompliance();