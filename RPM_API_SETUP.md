# Ready Player Me API Setup Guide

## Current Status
✅ **RPM Developer Account**: Configured  
✅ **Subdomain**: xr-cupid.readyplayer.me  
✅ **App ID**: 68389f8fa2bcefc234512570  
✅ **API Permissions**: Auth, Assets, Avatars, Users  
❌ **API Key**: Needs to be added to environment variables  

## API Key Setup

### Step 1: Get Your API Key
1. Go to your RPM Studio dashboard: https://studio.readyplayer.me
2. Navigate to **API Keys** section (you were just there!)
3. Copy your API key

### Step 2: Add to Environment Variables
Create or update your `.env.local` file in the project root:

```bash
# Ready Player Me Configuration
REACT_APP_RPM_API_KEY=your_api_key_here
REACT_APP_RPM_APP_ID=68389f8fa2bcefc234512570
REACT_APP_RPM_SUBDOMAIN=xr-cupid
```

### Step 3: Restart Development Server
```bash
npm start
```

## What This Enables

### Real RPM Avatar Generation
- **Dynamic Avatar Creation**: Each NPC gets a unique RPM avatar
- **Diverse Appearances**: Different skin tones, hair styles, clothing
- **3D Models**: Real .glb files for 3D rendering
- **Profile Images**: Matching .png images for 2D display

### API Features Used
- **Assets API**: Generate diverse avatar appearances
- **Avatars API**: Create and manage avatar instances
- **Auth API**: Secure API authentication
- **Users API**: Track avatar creation and usage

## Fallback System
If the API key is missing or API calls fail:
- System gracefully falls back to colorful geometric avatars
- No errors or broken functionality
- Still provides diverse, engaging characters

## Testing the Integration
1. Add your API key to `.env.local`
2. Restart the development server
3. Generate new profiles in the dating simulation
4. You should see real RPM avatars instead of geometric ones

## API Limits
- **Free Tier**: 1,000 avatars per month
- **Rate Limits**: Apply per your RPM plan
- **Usage Tracking**: Monitor in RPM Studio dashboard

## Troubleshooting
- Check browser console for API errors
- Verify API key is correct and active
- Ensure all environment variables are set
- Restart server after adding environment variables
