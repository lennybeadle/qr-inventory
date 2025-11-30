# Vercel Deployment Guide

## Quick Deploy

The app is now ready to deploy to Vercel without any additional configuration.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/lennybeadle/qr-inventory)

## Required Environment Variables

After deploying, add these in Vercel Dashboard → Settings → Environment Variables:

### 1. Clerk Authentication (Required)

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# URLs (use your Vercel domain)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/auth/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

**To get Clerk keys:**
1. Go to https://clerk.com
2. Create a new application
3. Copy the publishable and secret keys
4. Add them to Vercel environment variables

### 2. Sentry (Optional - for error tracking)

If you want error tracking, add:

```bash
NEXT_PUBLIC_SENTRY_DSN=https://****@****.ingest.sentry.io/****
NEXT_PUBLIC_SENTRY_ORG=your-org
NEXT_PUBLIC_SENTRY_PROJECT=your-project
SENTRY_AUTH_TOKEN=sntrys_****
```

**To disable Sentry** (default if DSN not provided):
```bash
NEXT_PUBLIC_SENTRY_DISABLED=true
```

## Deployment Steps

### Option 1: Deploy from Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your repository: `lennybeadle/qr-inventory`
3. Configure environment variables (see above)
4. Click "Deploy"

### Option 2: Deploy with Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Add environment variables
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
vercel env add CLERK_SECRET_KEY
# ... add other vars

# Deploy to production
vercel --prod
```

## Post-Deployment

### 1. Update Clerk Settings

In your Clerk dashboard:
1. Add your Vercel domain to allowed domains
2. Update redirect URLs to match your production domain

Example:
```
https://your-app.vercel.app/auth/sign-in
https://your-app.vercel.app/auth/sign-up
```

### 2. Test QR Scanner

1. Navigate to your deployed URL
2. Sign in
3. Go to `/dashboard/qr-scanner`
4. Allow camera permissions
5. Test scanning a QR code

**Note:** Camera access requires HTTPS, which Vercel provides automatically.

## Troubleshooting

### Build Errors

If you see build errors in Vercel:

1. Check the build logs in Vercel dashboard
2. Verify all environment variables are set
3. Try rebuilding: Deployments → ... → Redeploy

### Runtime Errors

If you see "Internal Server Error":

1. Check Vercel logs: Deployments → Your deployment → Function Logs
2. Verify Clerk keys are correct
3. Make sure all required env vars are set

### Camera Not Working

1. Ensure you're using HTTPS (Vercel does this automatically)
2. Check browser console for errors
3. Try a different browser
4. Verify camera permissions

### Clerk Authentication Issues

1. Verify Clerk environment variables are set correctly
2. Check that your domain is added in Clerk dashboard
3. Ensure redirect URLs match your deployment URL

## Environment Variables Reference

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key | `pk_test_...` |
| `CLERK_SECRET_KEY` | Clerk secret key | `sk_test_...` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Sign in page path | `/auth/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Sign up page path | `/auth/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Post-signin redirect | `/dashboard` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Post-signup redirect | `/dashboard` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN for error tracking | None (disabled) |
| `NEXT_PUBLIC_SENTRY_ORG` | Sentry organization | None |
| `NEXT_PUBLIC_SENTRY_PROJECT` | Sentry project name | None |
| `SENTRY_AUTH_TOKEN` | Sentry auth token | None |
| `NEXT_PUBLIC_SENTRY_DISABLED` | Disable Sentry | `true` if no DSN |

## Performance

Vercel automatically:
- ✅ Enables edge caching
- ✅ Optimizes images
- ✅ Compresses assets
- ✅ Provides global CDN
- ✅ Enables automatic HTTPS

## Cost

For this application:
- **Free Tier**: Sufficient for development and small projects
- **Pro Tier**: Recommended for production with high traffic

Vercel Free Tier includes:
- Unlimited deployments
- HTTPS/SSL certificates
- 100GB bandwidth/month
- Automatic preview deployments

## Monitoring

### Vercel Analytics

Enable in Vercel Dashboard → Analytics → Enable

### Vercel Logs

View real-time logs:
1. Vercel Dashboard → Your project
2. Deployments → Select deployment
3. Function Logs

### Sentry (Optional)

If configured, Sentry will track:
- Runtime errors
- Performance issues
- User sessions (with replay)

## Custom Domain

To add a custom domain:

1. Vercel Dashboard → Your project → Settings → Domains
2. Add your domain
3. Update DNS records as instructed
4. Update Clerk settings with new domain

## CI/CD

Vercel automatically:
- Deploys on every push to `main`
- Creates preview deployments for PRs
- Runs build checks

### GitHub Integration

Already set up! Every push triggers:
1. Build
2. TypeScript check
3. Deploy (if successful)

## Security

Vercel provides:
- ✅ Automatic HTTPS
- ✅ DDoS protection
- ✅ Edge protection
- ✅ Environment variable encryption

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Clerk Docs**: https://clerk.com/docs
- **GitHub Issues**: https://github.com/lennybeadle/qr-inventory/issues

---

**Quick Start Checklist:**
- [ ] Deploy to Vercel
- [ ] Add Clerk environment variables
- [ ] Update Clerk dashboard with production URL
- [ ] Test authentication
- [ ] Test QR scanner
- [ ] (Optional) Configure Sentry
- [ ] (Optional) Add custom domain
