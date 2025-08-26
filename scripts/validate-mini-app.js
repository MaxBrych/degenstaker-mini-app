#!/usr/bin/env node

/**
 * Complete Mini App validation including icon alpha channel check
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function validateMiniApp() {
  console.log('🔍 Complete Mini App Validation...\n');
  
  let hasErrors = false;
  let hasWarnings = false;

  // Check 1: Icon compliance
  console.log('🎯 Checking Mini App Icon...');
  const iconPath = path.join(__dirname, '../public/icon.png');
  
  if (fs.existsSync(iconPath)) {
    const buffer = fs.readFileSync(iconPath);
    
    if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]))) {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      const colorType = buffer.readUInt8(25);
      
      if (width === 1024 && height === 1024) {
        console.log('✅ Icon dimensions: 1024x1024px');
      } else {
        console.log(`❌ Icon dimensions: ${width}x${height}px (must be 1024x1024)`);
        hasErrors = true;
      }
      
      if (colorType === 6 || colorType === 4) {
        console.log('❌ Icon has alpha channel (transparency) - Farcaster requires NO alpha');
        console.log('🔧 Fix: Remove transparency and add solid background');
        hasErrors = true;
      } else {
        console.log('✅ Icon has no alpha channel');
      }
    } else {
      console.log('❌ Icon is not a valid PNG file');
      hasErrors = true;
    }
  } else {
    console.log('❌ Icon file missing at public/icon.png');
    hasErrors = true;
  }

  // Check 2: Required images
  console.log('\n📸 Checking Required Images...');
  const requiredImages = [
    { file: 'image.png', purpose: 'Embed image (3:2 ratio)' },
    { file: 'splash.png', purpose: 'Splash screen (square)' },
    { file: 'thumb.png', purpose: 'OG/social sharing (1200x630)' }
  ];
  
  requiredImages.forEach(({ file, purpose }) => {
    if (fs.existsSync(path.join(__dirname, '../public', file))) {
      console.log(`✅ ${file} - ${purpose}`);
    } else {
      console.log(`❌ Missing ${file} - ${purpose}`);
      hasErrors = true;
    }
  });

  // Check 3: Manifest structure
  console.log('\n📋 Checking Manifest...');
  const manifestPath = path.join(__dirname, '../public/.well-known/farcaster.json');
  
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      
      if (manifest.miniapp && manifest.accountAssociation) {
        console.log('✅ Manifest structure is correct');
        
        const iconUrl = manifest.miniapp.iconUrl;
        if (iconUrl && iconUrl.startsWith('https://')) {
          console.log(`✅ Icon URL: ${iconUrl}`);
        } else {
          console.log(`❌ Invalid icon URL: ${iconUrl}`);
          hasErrors = true;
        }
      } else {
        console.log('❌ Manifest missing required sections');
        hasErrors = true;
      }
    } catch (error) {
      console.log(`❌ Manifest JSON error: ${error.message}`);
      hasErrors = true;
    }
  } else {
    console.log('❌ Manifest file missing');
    hasErrors = true;
  }

  // Check 4: Environment variables
  console.log('\n🔧 Checking Environment Setup...');
  const envPath = path.join(__dirname, '../.env.local');
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const nextPublicUrl = envContent.match(/NEXT_PUBLIC_URL=['"]([^'"]+)['"]/);
    
    if (nextPublicUrl) {
      const url = nextPublicUrl[1];
      if (url.startsWith('https://')) {
        console.log(`✅ NEXT_PUBLIC_URL: ${url}`);
      } else {
        console.log(`❌ NEXT_PUBLIC_URL missing https://: ${url}`);
        hasErrors = true;
      }
    }
  } else {
    console.log('⚠️  Using Vercel environment variables (ensure NEXT_PUBLIC_URL has https://)');
    hasWarnings = true;
  }

  // Summary
  console.log('\n📊 Validation Summary:');
  
  if (hasErrors) {
    console.log('❌ Validation failed! Critical issues found.');
    console.log('\n🚨 Priority Fix:');
    console.log('1. Fix icon alpha channel (remove transparency)');
    console.log('2. Ensure NEXT_PUBLIC_URL has https:// in Vercel');
    console.log('3. Redeploy and test');
    
    console.log('\n📖 See ICON_FIX_GUIDE.md for detailed instructions');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('⚠️  Validation passed with warnings');
    console.log('🚀 Should work, but double-check Vercel environment variables');
  } else {
    console.log('✅ All validations passed!');
    console.log('🎉 Your Mini App should work perfectly with Farcaster');
  }
  
  console.log('\n🔗 Test URLs:');
  console.log('- Icon: https://degenstaker-miniapp.vercel.app/icon.png');
  console.log('- Manifest: https://degenstaker-miniapp.vercel.app/.well-known/farcaster.json');
  console.log('- Embed Tool: Test with https://degenstaker-miniapp.vercel.app');
}

validateMiniApp();