# Hume AI Setup Guide for New Account

## Current Issue
You're getting a 401 authentication error because:
- The API credentials in your `.env.local` are likely from your OLD Hume account
- Grace's config ID (`3910aba0-b518-440a-a4a2-0ad1772aec57`) was created on the OLD account
- You need to update BOTH the credentials AND create a new config on your NEW account

## Step 1: Get New API Credentials

1. Go to https://beta.hume.ai/
2. Sign in to your **NEW** Hume account
3. Navigate to **Settings** → **API Keys**
4. Create a new API key if you haven't already
5. Copy both:
   - **API Key** (starts with something like `smdtH2Rfgo...`)
   - **Secret Key** (starts with something like `u64zY2kl5d...`)

## Step 2: Update Your Environment File

Update your `.env.local` file with the NEW credentials:

```bash
# OLD naming convention (if you have these, update them)
REACT_APP_HUME_API_KEY=your_NEW_api_key_here
REACT_APP_HUME_SECRET_KEY=your_NEW_secret_key_here

# OR if using CLIENT naming convention
REACT_APP_HUME_CLIENT_ID=your_NEW_api_key_here
REACT_APP_HUME_CLIENT_SECRET=your_NEW_secret_key_here
```

## Step 3: Create a New EVI Config for Grace

Since Grace's config doesn't exist on your new account, you have two options:

### Option A: Use Default Config (Quick Test)
Remove the custom config ID from Grace's configuration:
- Edit `/src/services/HumeCoachConfigurations.ts`
- Comment out or remove the `configId` line for Grace
- This will use your account's default EVI config

### Option B: Create New Custom Config (Recommended)
1. Go to your Hume dashboard
2. Navigate to **EVI** → **Configurations**
3. Create a new configuration named "Grace"
4. Copy the new config ID
5. Update Grace's config in `/src/services/HumeCoachConfigurations.ts`

## Step 4: Restart and Test

1. Stop your development server (Ctrl+C)
2. Start it again: `npm start`
3. Try connecting to Grace again

## Verification Commands

Test your new credentials:
```bash
node test-hume-default.js
```

If this works, your credentials are correct and you just need to update Grace's config ID.

## Common Issues

- **Still getting 401**: Double-check you copied the credentials correctly
- **Config not found (E0709)**: The config ID doesn't exist on your account
- **No credits**: New accounts may have limited credits - check your dashboard
