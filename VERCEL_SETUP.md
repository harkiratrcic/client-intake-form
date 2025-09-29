# Vercel Production Environment Setup

## Critical Issue Identified

The "Form Not Found" error on production is caused by **missing or incorrect environment variables on Vercel**.

## Required Environment Variables on Vercel

### 1. DATABASE_URL (Required)
```
postgresql://postgres.[your-project-ref]:[your-password]@aws-0-[region].pooler.supabase.com:6543/postgres
```
- Get this from your Supabase dashboard
- Make sure it's using the **pooler connection** (port 6543) for serverless compatibility

### 2. NEXT_PUBLIC_APP_URL (CRITICAL - Currently Missing)
```
https://your-vercel-deployment.vercel.app
```
**This is the root cause of your issue!**

- Without this, the code defaults to `http://localhost:3000`
- Forms are created with URLs like `http://localhost:3000/f/{token}` (won't work in production)
- Form page tries to fetch from `http://localhost:3000/api/forms/{token}` (404 error)
- Set this to your actual Vercel domain

### 3. JWT_SECRET (Required)
```
your-super-secret-jwt-key-make-it-very-long-and-random-123456789
```
- Use a long random string (at least 32 characters)
- Generate with: `openssl rand -base64 32`

### 4. RESEND_API_KEY (Required for emails)
```
re_your_actual_api_key_here
```
- Get from https://resend.com/api-keys
- Without this, emails won't be sent
- Currently you have a placeholder key that only simulates sending

### 5. EMAIL_FROM (Required)
```
noreply@yourdomain.com
```
- Must be a domain you've verified in Resend
- Or use Resend's test domain

### 6. NODE_ENV (Auto-set by Vercel)
```
production
```
- Vercel sets this automatically
- Don't manually set this

## How to Set Environment Variables on Vercel

### Option 1: Via Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable above
5. Make sure to select "Production", "Preview", and "Development" environments
6. Redeploy your application

### Option 2: Via Vercel CLI
```bash
vercel env add NEXT_PUBLIC_APP_URL production
vercel env add DATABASE_URL production
vercel env add JWT_SECRET production
vercel env add RESEND_API_KEY production
vercel env add EMAIL_FROM production
```

## Critical Code Locations Using These Variables

### Form Creation (app/api/forms/route.ts:82-83)
```typescript
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const formUrl = `${baseUrl}/f/${result.instance.secureToken}`;
```
**Impact**: Without NEXT_PUBLIC_APP_URL, emails contain `http://localhost:3000/f/...` URLs

### Form Viewing (app/f/[token]/page.tsx:26)
```typescript
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const formResponse = await fetch(`${baseUrl}/api/forms/${token}`, {
  cache: 'no-store',
});
```
**Impact**: Without NEXT_PUBLIC_APP_URL, page tries to fetch from localhost, causing "Form Not Found"

### Email Service (lib/services/email-service.ts:39-54)
```typescript
const apiKey = process.env.RESEND_API_KEY;
```
**Impact**: Without valid RESEND_API_KEY, emails aren't actually sent

## Verification Steps After Setting Variables

1. **Set all environment variables in Vercel dashboard**
2. **Redeploy the application** (or trigger a new deployment)
3. **Test health endpoint**: `https://your-domain.vercel.app/api/health`
4. **Test form creation**: Create a form through the dashboard
5. **Test form viewing**: Click the link in the email
6. **Check email**: Verify the email was received with correct URL

## Additional Improvements Needed

### Issue: Server Component Making HTTP Request to Own API
The form page (`app/f/[token]/page.tsx`) makes an HTTP fetch to its own API endpoint. This is inefficient and can cause issues.

**Better approach**: Import Prisma directly in the server component instead of fetching from the API.

### Issue: Email Configuration
If you want real emails to be sent:
1. Sign up at https://resend.com
2. Verify your domain OR use Resend's test domain
3. Get an API key
4. Add it to Vercel environment variables
5. Update EMAIL_FROM to match your verified domain

## Quick Fix Checklist

- [ ] Set NEXT_PUBLIC_APP_URL on Vercel to your production domain
- [ ] Set DATABASE_URL on Vercel (should already be set)
- [ ] Set JWT_SECRET on Vercel (should already be set)
- [ ] Set RESEND_API_KEY on Vercel for real email sending
- [ ] Set EMAIL_FROM on Vercel
- [ ] Redeploy the application
- [ ] Test form creation and viewing
- [ ] Check that emails have correct production URLs