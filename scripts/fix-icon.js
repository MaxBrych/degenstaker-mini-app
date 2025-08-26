#!/usr/bin/env node

/**
 * Script to check and fix the Mini App icon for Farcaster compliance
 * Farcaster requires: 1024x1024px PNG with NO alpha channel
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function checkIcon() {
  console.log('🔍 Checking Mini App icon for Farcaster compliance...\n');
  
  const iconPath = path.join(__dirname, '../public/icon.png');
  
  if (!fs.existsSync(iconPath)) {
    console.log('❌ Icon file not found at public/icon.png');
    return;
  }
  
  // Check file size
  const stats = fs.statSync(iconPath);
  console.log(`📁 Icon file size: ${(stats.size / 1024).toFixed(1)} KB`);
  
  // Read PNG header to check dimensions
  const buffer = fs.readFileSync(iconPath);
  
  // PNG signature check
  const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  if (!buffer.subarray(0, 8).equals(pngSignature)) {
    console.log('❌ File is not a valid PNG');
    return;
  }
  
  // Read IHDR chunk for dimensions and color type
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  const colorType = buffer.readUInt8(25);
  
  console.log(`📐 Dimensions: ${width}x${height}px`);
  console.log(`🎨 Color type: ${colorType}`);
  
  // Check Farcaster requirements
  let hasErrors = false;
  
  if (width !== 1024 || height !== 1024) {
    console.log('❌ Icon must be exactly 1024x1024px');
    hasErrors = true;
  } else {
    console.log('✅ Dimensions are correct (1024x1024px)');
  }
  
  // Color type check:
  // 0 = Grayscale
  // 2 = RGB (what we want)
  // 3 = Indexed color
  // 4 = Grayscale + alpha
  // 6 = RGB + alpha (this is problematic for Farcaster)
  
  if (colorType === 6 || colorType === 4) {
    console.log('❌ Icon has alpha channel (transparency) - Farcaster requires NO alpha');
    console.log('🔧 The icon needs to be converted to RGB without transparency');
    hasErrors = true;
  } else if (colorType === 2) {
    console.log('✅ Icon is RGB without alpha channel');
  } else if (colorType === 0) {
    console.log('✅ Icon is grayscale (acceptable)');
  } else {
    console.log(`⚠️  Icon color type ${colorType} may not be optimal`);
  }
  
  console.log('\n📋 Farcaster Icon Requirements:');
  console.log('✅ Format: PNG');
  console.log('✅ Size: 1024x1024px');
  console.log('✅ Color: RGB or Grayscale (NO alpha channel)');
  console.log('✅ Accessibility: Public HTTPS URL');
  
  if (hasErrors) {
    console.log('\n🛠️  How to fix:');
    console.log('1. Open your icon in an image editor (Photoshop, GIMP, etc.)');
    console.log('2. Remove transparency/alpha channel');
    console.log('3. If transparent areas exist, fill with a solid background color');
    console.log('4. Export as PNG without transparency');
    console.log('5. Ensure dimensions remain 1024x1024px');
    console.log('\n🎨 Quick fix options:');
    console.log('- Add a solid background color (e.g., white, purple theme color)');
    console.log('- Use "Flatten Image" or "Remove Alpha Channel" in your editor');
    console.log('- Save as RGB PNG (not RGBA)');
  } else {
    console.log('\n✅ Icon appears to meet Farcaster requirements!');
    console.log('🔗 Accessible at: https://degenstaker-miniapp.vercel.app/icon.png');
    console.log('\n💡 If icon still not showing:');
    console.log('1. Clear browser cache');
    console.log('2. Wait a few minutes for CDN propagation');
    console.log('3. Test in private/incognito browser');
    console.log('4. Check Farcaster embed tool again');
  }
}

checkIcon();