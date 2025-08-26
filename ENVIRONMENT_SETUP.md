# Environment Variables Setup

## Critical URL Configuration

### Production Environment Variables

For your DegenStaker Mini App to work correctly in production, you **MUST** set these environment variables with **https://** URLs:

```bash
NEXT_PUBLIC_URL='https://degenstaker-miniapp.vercel.app'
NEXTAUTH_URL='https://degenstaker-miniapp.vercel.app'
```

### Why HTTPS is Required

Farcaster requires all Mini App URLs to be HTTPS:
- ✅ `https://degenstaker-miniapp.vercel.app` - Valid
- ❌ `http://degenstaker-miniapp.vercel.app` - Invalid
- ❌ `degenstaker-miniapp.vercel.app` - Invalid (missing protocol)
- ❌ `http://localhost:3000` - Invalid for production

### Setting Environment Variables

#### Vercel Dashboard
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add/Update these variables:

```
NEXT_PUBLIC_URL = https://degenstaker-miniapp.vercel.app
NEXTAUTH_URL = https://degenstaker-miniapp.vercel.app
```

#### Local Development
For local development, keep in `.env.local`:
```bash
NEXT_PUBLIC_URL='http://localhost:3000'
NEXTAUTH_URL='http://localhost:3000'
```

### URL Usage Throughout App

These environment variables are used by:

**Constants (`src/lib/constants.ts`)**:
- `APP_URL` → Used for all asset URLs
- `APP_ICON_URL` → `${APP_URL}/icon.png`
- `APP_OG_IMAGE_URL` → `${APP_URL}/thumb.png`
- `APP_SPLASH_URL` → `${APP_URL}/splash.png`
- `APP_WEBHOOK_URL` → `${APP_URL}/api/webhook`

**Layout (`src/app/layout.tsx`)**:
- Frame metadata URLs
- Open Graph images
- Splash screen configuration

**Manifest (`public/.well-known/farcaster.json`)**:
- Static file with hardcoded URLs
- Should match your production domain

### Validation Checklist

✅ **Environment Variables Set**:
- [ ] `NEXT_PUBLIC_URL` uses `https://`
- [ ] `NEXTAUTH_URL` uses `https://`
- [ ] URLs match your actual domain

✅ **Static Manifest**:
- [ ] `public/.well-known/farcaster.json` has correct https:// URLs
- [ ] `canonicalDomain` matches your domain (without https://)

✅ **Deployment**:
- [ ] Environment variables set in deployment platform
- [ ] Build completes successfully
- [ ] Manifest accessible at `/.well-known/farcaster.json`

### Troubleshooting

**"Invalid url, Must be an https url" Error**:
1. Check environment variables in deployment platform
2. Verify `.env.local` uses https:// for production
3. Ensure static manifest URLs are https://
4. Redeploy after changing environment variables

**Localhost URLs in Production**:
- This happens when `NEXT_PUBLIC_URL` is not set correctly
- Check your deployment platform's environment variables
- Ensure no `.env.local` is being used in production

### Security Notes

- Never commit real environment variables to git
- Use `.env.example` to document required variables
- Generate secure secrets for production
- Use different values for development vs production