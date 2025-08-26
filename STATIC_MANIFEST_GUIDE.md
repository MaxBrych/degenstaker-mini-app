# Static Farcaster Manifest Guide ✅

## Overview
This guide explains how the DegenStaker Mini App uses a static `farcaster.json` file as the single source of truth for all manifest data.

## Manifest Location
- **File**: `public/.well-known/farcaster.json`
- **URL**: `https://degenstaker-miniapp.vercel.app/.well-known/farcaster.json`
- **Format**: Static JSON file served directly by the web server

## Why Static Manifest?

### Benefits
✅ **Full Control**: Complete ownership of manifest content and timing
✅ **Version Control**: All changes tracked in git alongside code
✅ **No External Dependencies**: No reliance on third-party hosted services
✅ **Immediate Deployment**: Changes go live with your app deployment
✅ **Transparency**: Manifest visible in your repository
✅ **Consistency**: Single source of truth for all app metadata

### vs Hosted Manifests
- **Static**: Deployed with your code, full control, git tracked
- **Hosted**: Managed externally, separate from code deployment

## Current Manifest Structure

### Core Properties
```json
{
  "accountAssociation": {
    "header": "...",
    "payload": "...", 
    "signature": "..."
  },
  "miniapp": {
    "version": "1",
    "name": "Degen Staker",
    "iconUrl": "https://degenstaker-miniapp.vercel.app/icon.png",
    "homeUrl": "https://degenstaker-miniapp.vercel.app",
    // ... additional fields
  }
}
```

### Account Association
- **FID**: 187846 (verified ownership)
- **Domain**: degenstaker-miniapp.vercel.app
- **Type**: custody signature for domain verification

### App Metadata
- **Name**: "Degen Staker"
- **Description**: "Lock your DEGEN into 14, 21, or 28 day queues..."
- **Category**: finance
- **Tags**: ["roi", "staking", "degen", "fifo", "casino"]
- **Splash Color**: "#684591"

## Managing the Manifest

### Manual Updates
1. Edit `public/.well-known/farcaster.json`
2. Commit changes to git
3. Deploy to update live manifest

### Script-Based Updates
Use the provided script to update domains:
```bash
node scripts/update-manifest.js your-new-domain.com
```

### Domain Changes
When changing domains:
1. Update all URLs in the manifest
2. Generate new account association for the new domain
3. Update the signature in `accountAssociation`

## Constants Synchronization

### Constants File
`src/lib/constants.ts` contains all manifest values:
- `APP_NAME`: "Degen Staker"
- `APP_DESCRIPTION`: App description
- `APP_TAGS`: Tag array
- `APP_SPLASH_BACKGROUND_COLOR`: "#684591"
- And more...

### Keeping in Sync
The static manifest and constants should always match:
1. **Source of Truth**: `public/.well-known/farcaster.json`
2. **Code Constants**: Derived from manifest values
3. **Validation**: Ensure consistency across files

## File Structure

```
public/
└── .well-known/
    └── farcaster.json          # THE SOURCE OF TRUTH

src/
├── lib/
│   ├── constants.ts            # App constants (synced with manifest)
│   └── utils.ts               # Manifest utility functions
└── app/
    ├── layout.tsx             # Frame metadata (uses constants)
    └── page.tsx               # Open Graph metadata

scripts/
└── update-manifest.js         # Domain update helper
```

## Deployment Workflow

### Standard Deployment
1. Make changes to `farcaster.json`
2. Update corresponding constants if needed
3. Test locally
4. Commit and push to git
5. Deploy to production
6. Verify manifest is accessible

### Domain Migration
1. Run: `node scripts/update-manifest.js new-domain.com`
2. Generate new account association for new domain
3. Update account association in manifest
4. Deploy to new domain
5. Verify Farcaster can access the manifest

## Validation

### Manual Check
Visit: `https://your-domain/.well-known/farcaster.json`

### Content Validation
Ensure the JSON contains:
- Valid `accountAssociation` for your domain
- Complete `miniapp` object with all required fields
- Correct URLs pointing to your domain
- Valid image URLs (accessible and correct dimensions)

## Troubleshooting

### Common Issues
1. **404 Error**: Check file location and deployment
2. **Invalid JSON**: Validate JSON syntax
3. **Wrong Domain**: Ensure URLs match your deployed domain
4. **Account Association Mismatch**: Domain in payload must match hosting domain

### Debug Steps
1. Check file exists: `public/.well-known/farcaster.json`
2. Validate JSON syntax
3. Verify deployment includes the file
4. Test accessibility from external tools
5. Check Farcaster developer tools for validation

## Best Practices

### Maintenance
- Keep manifest and constants in sync
- Version control all changes
- Test manifest accessibility after deployment
- Use scripts for bulk URL updates
- Validate JSON before committing

### Security
- Protect account association signatures
- Verify domain ownership before association
- Use HTTPS for all manifest URLs
- Regularly verify manifest accessibility

---

**Status**: ✅ Static manifest active
**Location**: `public/.well-known/farcaster.json`
**Source of Truth**: Static JSON file