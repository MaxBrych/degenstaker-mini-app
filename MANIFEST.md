# Farcaster Mini App Manifest Documentation

## Overview
This document explains the Farcaster manifest configuration for the DegenStaker Mini App. The app now uses **Farcaster Hosted Manifests** for easier management and automatic validation.

## Hosted Manifest Configuration
- **Manifest ID**: `0198e1f6-d8ab-8af4-70c2-2b037e040895`
- **Hosted URL**: `https://api.farcaster.xyz/miniapps/hosted-manifest/0198e1f6-d8ab-8af4-70c2-2b037e040895`
- **Domain**: `degenstaker-miniapp.vercel.app`
- **Redirect**: Configured via `vercel.json`

## Manifest Structure

### Account Association (Required for Verification)
```json
{
  "header": "eyJmaWQiOjE4Nzg0NiwidHlwZSI6ImF1dGgiLCJrZXkiOiIweDVCZDRjNzM1OEU5MzJGOWE4OTgyZDBkRUE3RjNjMEJmMzJhOGZlZjcifQ",
  "payload": "eyJkb21haW4iOiJjb21tb24tZXllcy1zb3J0LmxvY2EubHQifQ",
  "signature": "HqAMj/6KhYKLf/8QvmlvvwpvB1trY2KphaiOk+CoAGNpkQlTxsZxno2aXXXbd2AIBy5f1o+sWzRa7EfKyighfBs="
}
```
- **Purpose**: Cryptographically verifies ownership by FID 187846
- **Domain**: `common-eyes-sort.loca.lt` (must match hosting domain)
- **Benefits**: Enables verified status and Developer Rewards eligibility

### Required Fields ✅

| Field | Value | Constraints | Status |
|-------|-------|-------------|---------|
| `version` | "1" | Must be '1' | ✅ |
| `name` | "DegenStaker" | Max 32 characters | ✅ (11 chars) |
| `homeUrl` | Domain URL | Max 1024 characters | ✅ |
| `iconUrl` | Icon image URL | 1024x1024px PNG, no alpha | ✅ |

### Optional Enhancement Fields ✅

| Field | Value | Purpose | Constraints |
|-------|-------|---------|-------------|
| `subtitle` | "High-risk, high-fun staking game" | Short description | Max 30 chars ✅ (29 chars) |
| `description` | Full promotional message | App store listing | Max 170 chars ✅ (95 chars) |
| `primaryCategory` | "finance" | App categorization | Valid category ✅ |
| `tags` | ["roi", "staking", "degen", "casino", "fifo"] | Search/filtering | Max 5 tags, 20 chars each ✅ |
| `heroImageUrl` | Promotional image | Marketing display | 1200x630px (1.91:1) ✅ |
| `tagline` | "High-risk, high-fun staking" | Marketing tagline | Max 30 chars ✅ (26 chars) |
| `ogTitle` | "DegenStaker" | Open Graph title | Max 30 chars ✅ |
| `ogDescription` | SEO description | Open Graph desc | Max 100 chars ✅ (77 chars) |
| `ogImageUrl` | Social sharing image | Open Graph image | 1200x630px PNG ✅ |

### Technical Configuration

#### Blockchain Requirements
- **requiredChains**: `["eip155:8453"]` (Base network)
- **Purpose**: Ensures Base network support for $DEGEN staking

#### SDK Capabilities
- **actions.signIn**: User authentication
- **wallet.getEthereumProvider**: Web3 provider access
- **wallet.requestAccount**: Account connection
- **wallet.requestPermissions**: Permission management

#### App Settings
- **splashImageUrl**: Loading screen image (200x200px)
- **splashBackgroundColor**: "#7D65C0" (purple theme)
- **webhookUrl**: Event notifications endpoint
- **noindex**: false (included in search results)
- **canonicalDomain**: Primary domain identifier

## Validation Checklist ✅

### Required Compliance
- [x] Manifest version is "1"
- [x] App name under 32 characters
- [x] Valid homeUrl format
- [x] Icon URL points to valid resource
- [x] Account association properly signed

### Optional Enhancements
- [x] Subtitle under 30 characters
- [x] Description under 170 characters
- [x] Valid primaryCategory
- [x] Tags array with max 5 items
- [x] All tag lengths under 20 characters
- [x] Open Graph fields properly configured
- [x] Required chains specified
- [x] Required capabilities listed

### Technical Requirements
- [x] Webhook URL configured for notifications
- [x] Splash screen configuration
- [x] Base network (eip155:8453) support
- [x] Proper domain canonicalization

## Hosted Manifest Benefits

1. **No Codebase Management**: Manifest managed through Farcaster Developer Tools
2. **Automatic Validation**: Built-in error checking and validation
3. **Easy Updates**: Update manifest without redeploying your app
4. **Domain Migration**: Simplified domain changes
5. **Version Control**: Centralized manifest versioning

## Deployment Configuration

### Vercel Redirect Setup
The `vercel.json` file configures a 307 redirect:
```json
{
  "redirects": [
    {
      "source": "/.well-known/farcaster.json",
      "destination": "https://api.farcaster.xyz/miniapps/hosted-manifest/0198e1f6-d8ab-8af4-70c2-2b037e040895",
      "permanent": false
    }
  ]
}
```

### Deployment Notes
1. **Vercel Deploy**: The redirect will be active after deployment
2. **Webhook Endpoint**: Confirm `/api/webhook` is properly implemented
3. **Image Assets**: Ensure all assets are accessible at your Vercel domain
4. **Chain Support**: Base network integration is required for $DEGEN token operations

## Discovery & Publishing

This manifest enables:
- **Farcaster Client Discovery**: Apps can find and launch your Mini App
- **App Store Listing**: Eligible for Farcaster app stores
- **Verified Status**: Shows verified checkmark with developer attribution
- **Developer Rewards**: Eligible for Warpcast weekly rewards program
- **Social Sharing**: Proper Open Graph metadata for sharing

## Validation Tools

To validate your manifest:
1. Check accessibility at `https://your-domain/.well-known/farcaster.json`
2. Verify JSON syntax and structure
3. Confirm all image URLs are accessible
4. Test webhook endpoint functionality
5. Validate account association signature