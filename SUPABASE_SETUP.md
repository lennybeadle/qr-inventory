# Supabase Setup Guide

This guide will help you set up Supabase as the database backend for the QR inventory scanner.

## Architecture Overview

This app uses a **server-side only** approach to Supabase:

- **Authentication**: Handled entirely by Clerk
- **Database Access**: Only from Next.js API routes using the Supabase service role key
- **No RLS Policies**: Data isolation is enforced in application code using Clerk's `userId`
- **Security**: Service role key is never exposed to the browser

This approach simplifies the setup (no JWT template configuration needed) and gives you full control over data access patterns.

## Prerequisites

- A Supabase account (free tier is fine)
- Your Clerk credentials already configured
- Basic understanding of SQL (for creating tables)

## Step 1: Create Supabase Project

1. Go to https://supabase.com and sign up/sign in
2. Click **"New Project"**
3. Fill in the details:
   - **Name**: qr-inventory (or your preferred name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Plan**: Free tier is sufficient for getting started
4. Click **"Create new project"**
5. Wait 2-3 minutes for the project to be provisioned

## Step 2: Get API Credentials

1. In your Supabase project dashboard, go to **Settings** (gear icon) → **API**
2. Copy the following values:
   - **Project URL** (under "Project URL")
   - **service_role** key (under "Project API keys")

   ⚠️ **Important**: Copy the `service_role` key, NOT the `anon` key!

3. Add these to your `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

4. **Also add to Vercel** (for production):
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add both variables to all environments (Production, Preview, Development)
   - ⚠️ **Keep `SUPABASE_SERVICE_ROLE_KEY` secret** - it has full database access!

## Step 3: Create Database Tables

1. In Supabase dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Copy and paste the following SQL:

```sql
-- Table 1: codes
-- Stores information about each unique QR code
CREATE TABLE codes (
  id TEXT PRIMARY KEY,  -- Alphanumeric code ID (e.g., "A6F3HW7L")
  system_acronym TEXT NOT NULL DEFAULT 'TMGS',  -- System name
  size TEXT NOT NULL DEFAULT 'unspecified',  -- Size label (S, M, L, etc.)
  year INTEGER NOT NULL,  -- Year code was created
  owner_user_id TEXT NOT NULL,  -- Clerk user ID of the owner
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table 2: scan_events
-- Records every time a code is scanned
CREATE TABLE scan_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id TEXT NOT NULL REFERENCES codes(id) ON DELETE CASCADE,
  scanned_by_user_id TEXT NOT NULL,  -- Clerk user ID
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  raw_payload TEXT NOT NULL  -- Full QR code text
);

-- Create indexes for better performance
CREATE INDEX idx_codes_owner ON codes(owner_user_id);
CREATE INDEX idx_scan_events_code ON scan_events(code_id);
CREATE INDEX idx_scan_events_user ON scan_events(scanned_by_user_id);
CREATE INDEX idx_scan_events_timestamp ON scan_events(scanned_at DESC);

-- Add comments for documentation
COMMENT ON TABLE codes IS 'Stores unique QR code information';
COMMENT ON TABLE scan_events IS 'Records every scan event with timestamp';
COMMENT ON COLUMN codes.id IS 'Alphanumeric code ID extracted from QR payload';
COMMENT ON COLUMN codes.system_acronym IS 'System identifier (default: TMGS)';
COMMENT ON COLUMN codes.size IS 'Size classification (e.g., S, M, L, or unspecified)';
COMMENT ON COLUMN scan_events.raw_payload IS 'Original text from QR scanner';
```

4. Click **"Run"** (or press Cmd/Ctrl + Enter)
5. You should see: **"Success. No rows returned"**

**Note**: We are NOT setting up Row Level Security (RLS) policies because the app uses server-side only access with the service role key. Data isolation is enforced in the API routes using Clerk's `userId`.

## Step 4: Test the Setup

1. Make sure your environment variables are set in `.env.local`:

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

2. Run your development server:

```bash
npm run dev
```

3. Navigate to `http://localhost:3000`
4. Sign in with Clerk
5. Go to QR Scanner page (`/dashboard/qr-scanner`)
6. Scan a test QR code (or enter text like "A6F3HW7L")

7. Check Supabase **Table Editor**:
   - Go to **Table Editor** in Supabase dashboard
   - Click on **codes** table → You should see your code!
   - Click on **scan_events** table → You should see your scan!

## Step 5: Generate Test QR Codes

You can use these free tools to generate test QR codes:

1. **QR Code Generator**: https://www.qr-code-generator.com/
2. **QR Code Monkey**: https://www.qrcode-monkey.com/

### Test Formats

Try creating QR codes with these test values:

1. **Simple code ID**:
   ```
   A6F3HW7L
   ```

2. **URL with code in path**:
   ```
   https://app.example.com/s/B7G4JX9M
   ```

3. **URL with query parameter**:
   ```
   https://app.example.com?code=C8H5KY0N
   ```

All three formats will be correctly parsed by the app!

## Troubleshooting

### Error: "Missing Supabase environment variables"

- Make sure `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
- Restart your dev server after adding env vars
- Check for typos in variable names
- Ensure you're using the `service_role` key, not the `anon` key

### Error: "Database error while creating code"

- Check that tables were created correctly in Supabase
- Verify you're using the `SUPABASE_SERVICE_ROLE_KEY` (not anon key)
- Check Supabase logs: Database → Logs
- Ensure API routes are properly filtering by `userId` from Clerk

### Scans not showing up

1. Check browser console for errors
2. Verify you're signed in with Clerk
3. Check Supabase **Logs** tab for database errors
4. Ensure the API routes are receiving the correct `userId` from Clerk
5. Check that `owner_user_id` and `scanned_by_user_id` are being set correctly

### Authentication errors

- Ensure Clerk is properly configured and you're signed in
- Check that `auth()` from Clerk is returning a valid `userId`
- Verify Clerk environment variables are set correctly

## Database Schema Reference

### `codes` table

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key, code ID (e.g., "A6F3HW7L") |
| `system_acronym` | TEXT | System name (default: "TMGS") |
| `size` | TEXT | Size label (default: "unspecified") |
| `year` | INTEGER | Year code was created |
| `owner_user_id` | TEXT | Clerk user ID of owner |
| `created_at` | TIMESTAMPTZ | When code was first seen |

### `scan_events` table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, auto-generated |
| `code_id` | TEXT | Foreign key to `codes.id` |
| `scanned_by_user_id` | TEXT | Clerk user ID who scanned |
| `scanned_at` | TIMESTAMPTZ | When scan occurred |
| `raw_payload` | TEXT | Original QR text |

## Future Enhancements

Consider adding these features later:

1. **Real-time updates**: Use Supabase subscriptions to see scans in real-time
2. **Code management**: CRUD operations for codes (edit size, system_acronym)
3. **Analytics**: Aggregate scan statistics per code
4. **Sharing**: Allow users to share codes with other users
5. **Bulk operations**: Import/export codes via CSV
6. **Additional fields**: Add custom metadata to codes

## Support

- **Supabase Docs**: https://supabase.com/docs
- **Clerk + Supabase Guide**: https://clerk.com/docs/integrations/databases/supabase
- **GitHub Issues**: https://github.com/lennybeadle/qr-inventory/issues

---

Once you've completed this setup, your QR scanner will be fully functional with persistent storage! 🎉
