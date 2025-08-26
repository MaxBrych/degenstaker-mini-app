# Critical Vercel Deployment Instructions

## 🚨 URGENT: Environment Variables Must Include https://

### Issue from Screenshots
Your Farcaster manifest is failing because environment variables in Vercel are missing `https://`:

**Current (WRONG):**
```
NEXT_PUBLIC_URL = degenstaker-miniapp.vercel.app
```

**Required (CORRECT):**
```
NEXT_PUBLIC_URL = https://degenstaker-miniapp.vercel.app
```

## ✅ Correct Vercel Environment Variables

Log into your Vercel dashboard and set these **EXACTLY** as shown:

### Environment Variables to Set:

```
NEXT_PUBLIC_URL = https://degenstaker-miniapp.vercel.app
NEXTAUTH_URL = https://degenstaker-miniapp.vercel.app
```

### Steps in Vercel Dashboard:

1. Go to your project in Vercel dashboard
2. Click **Settings** tab
3. Click **Environment Variables** in left sidebar
4. Find `NEXT_PUBLIC_URL` and click **Edit**
5. Change value from `degenstaker-miniapp.vercel.app` to `https://degenstaker-miniapp.vercel.app`
6. Find `NEXTAUTH_URL` and click **Edit** 
7. Change value to `https://degenstaker-miniapp.vercel.app`
8. Click **Save** for both
9. **Redeploy** your application

## 🔍 Why This Fixes the Farcaster Errors

**Before (Broken):**
- Farcaster sees: `degenstaker-miniapp.vercel.app/image.png`
- Error: "Invalid url, Must be an https url"

**After (Fixed):**
- Farcaster sees: `https://degenstaker-miniapp.vercel.app/image.png`
- ✅ Valid URL

## 🚀 Deployment Checklist

- [ ] Update `NEXT_PUBLIC_URL` in Vercel to include `https://`
- [ ] Update `NEXTAUTH_URL` in Vercel to include `https://`
- [ ] Redeploy application
- [ ] Test manifest at: `https://degenstaker-miniapp.vercel.app/.well-known/farcaster.json`
- [ ] Test Farcaster Embed Tool again

## 🛠️ Fallback Protection

I've added automatic `https://` detection in the code, so even if you forget the protocol, it will be added automatically. However, it's best practice to set the environment variables correctly.

## 🔄 After Deployment

1. Wait for deployment to complete
2. Test your manifest URL: `https://degenstaker-miniapp.vercel.app/.well-known/farcaster.json`
3. Use Farcaster Embed Tool to validate: `https://degenstaker-miniapp.vercel.app`
4. All URLs should now show with `https://` prefix

## ⚠️ Common Mistakes to Avoid

❌ `degenstaker-miniapp.vercel.app` (missing protocol)
❌ `http://degenstaker-miniapp.vercel.app` (wrong protocol)
❌ `https//degenstaker-miniapp.vercel.app` (missing colon)
✅ `https://degenstaker-miniapp.vercel.app` (correct)

## 📞 Support

If you still see errors after deployment:
1. Check environment variables are saved correctly
2. Ensure you redeployed after changing variables
3. Clear browser cache and test again
4. Use private/incognito browser window to test