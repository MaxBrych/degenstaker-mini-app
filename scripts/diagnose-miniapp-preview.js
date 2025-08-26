#!/usr/bin/env node

/**
 * Diagnose why Mini App Preview is not working
 * Based on latest Farcaster Mini App documentation
 */

import https from 'https';

async function fetchManifest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
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

async function diagnosePreview() {
  console.log('🔍 Diagnosing Mini App Preview Issues...\n');
  
  const manifestUrl = 'https://degenstaker-miniapp.vercel.app/.well-known/farcaster.json';
  
  try {
    const manifest = await fetchManifest(manifestUrl);
    console.log('✅ Manifest accessible and valid JSON\n');
    
    // Check 1: Account Association
    console.log('🔐 Checking Account Association...');
    const accountAssociation = manifest.accountAssociation;
    
    if (!accountAssociation) {
      console.log('❌ Missing accountAssociation');
      return;
    }
    
    // Decode header
    const headerDecoded = JSON.parse(Buffer.from(accountAssociation.header, 'base64').toString());
    console.log(`📋 FID: ${headerDecoded.fid}`);
    console.log(`📋 Type: ${headerDecoded.type}`);
    console.log(`📋 Key: ${headerDecoded.key}`);
    
    // Decode payload
    const payloadDecoded = JSON.parse(Buffer.from(accountAssociation.payload, 'base64').toString());
    console.log(`📋 Domain: ${payloadDecoded.domain}`);
    
    if (payloadDecoded.domain !== 'degenstaker-miniapp.vercel.app') {
      console.log('❌ Domain mismatch in account association');
    } else {
      console.log('✅ Domain matches');
    }
    
    if (headerDecoded.type !== 'custody') {
      console.log(`⚠️  Account association type is "${headerDecoded.type}" - should be "custody" for latest spec`);
    } else {
      console.log('✅ Account association type is correct');
    }
    
    // Check 2: Required Mini App Fields
    console.log('\n📱 Checking Mini App Fields...');
    const miniapp = manifest.miniapp;
    
    if (!miniapp) {
      console.log('❌ Missing miniapp object');
      return;
    }
    
    const requiredFields = {
      'version': '1',
      'name': 'string',
      'iconUrl': 'https url',
      'homeUrl': 'https url'
    };
    
    let hasAllRequired = true;
    
    Object.entries(requiredFields).forEach(([field, type]) => {
      if (!miniapp[field]) {
        console.log(`❌ Missing required field: ${field}`);
        hasAllRequired = false;
      } else if (type === 'https url' && !miniapp[field].startsWith('https://')) {
        console.log(`❌ ${field} must be https: ${miniapp[field]}`);
        hasAllRequired = false;
      } else {
        console.log(`✅ ${field}: ${miniapp[field]}`);
      }
    });
    
    // Check 3: Optional but Important Fields
    console.log('\n🎯 Checking Optional Important Fields...');
    const importantOptional = [
      'splashImageUrl',
      'splashBackgroundColor',
      'webhookUrl'
    ];
    
    importantOptional.forEach(field => {
      if (miniapp[field]) {
        console.log(`✅ ${field}: ${miniapp[field]}`);
      } else {
        console.log(`⚠️  Missing ${field} (recommended)`);
      }
    });
    
    // Check 4: Image Accessibility
    console.log('\n🖼️ Checking Image Accessibility...');
    const imageUrls = [
      { name: 'iconUrl', url: miniapp.iconUrl },
      { name: 'splashImageUrl', url: miniapp.splashImageUrl },
      { name: 'imageUrl', url: miniapp.imageUrl }
    ];
    
    for (const { name, url } of imageUrls) {
      if (url) {
        try {
          await new Promise((resolve, reject) => {
            https.get(url, (res) => {
              if (res.statusCode === 200) {
                console.log(`✅ ${name} accessible (${res.statusCode})`);
                resolve();
              } else {
                console.log(`❌ ${name} not accessible (${res.statusCode})`);
                reject();
              }
            }).on('error', reject);
          });
        } catch {
          console.log(`❌ ${name} failed to load: ${url}`);
        }
      }
    }
    
    // Check 5: Common Issues
    console.log('\n🔧 Common Mini App Preview Issues...');
    
    const commonIssues = [
      {
        check: () => headerDecoded.type === 'custody',
        message: 'Account association must use "custody" type for Mini Apps',
        fix: 'Re-sign the account association with custody key'
      },
      {
        check: () => miniapp.iconUrl && miniapp.iconUrl.endsWith('.png'),
        message: 'Icon should be PNG format',
        fix: 'Ensure icon is PNG format'
      },
      {
        check: () => accountAssociation.signature && accountAssociation.signature.length > 50,
        message: 'Account association signature should be present and valid',
        fix: 'Re-generate account association signature'
      }
    ];
    
    commonIssues.forEach(({ check, message, fix }) => {
      if (check()) {
        console.log(`✅ ${message}`);
      } else {
        console.log(`❌ ${message}`);
        console.log(`   Fix: ${fix}`);
      }
    });
    
    // Summary and Next Steps
    console.log('\n📊 Diagnosis Summary:');
    
    if (headerDecoded.type !== 'custody') {
      console.log('🚨 LIKELY ISSUE FOUND:');
      console.log('Your account association uses "auth" type instead of "custody"');
      console.log('\n🔧 To Fix:');
      console.log('1. Go to: https://farcaster.xyz/~/developers/mini-apps/manifest');
      console.log('2. Enter your domain: degenstaker-miniapp.vercel.app');
      console.log('3. Sign with your custody key (not auth key)');
      console.log('4. Copy the new accountAssociation object');
      console.log('5. Update your manifest file');
      console.log('6. Deploy and test again');
    } else if (!hasAllRequired) {
      console.log('🚨 Missing required fields - fix the missing fields above');
    } else {
      console.log('✅ Manifest appears correct');
      console.log('💡 Try:');
      console.log('1. Clear browser cache');
      console.log('2. Wait 5-10 minutes for CDN propagation');
      console.log('3. Test in private/incognito browser');
      console.log('4. Check if account association is properly verified');
    }
    
  } catch (error) {
    console.log(`❌ Error fetching manifest: ${error.message}`);
  }
}

diagnosePreview();