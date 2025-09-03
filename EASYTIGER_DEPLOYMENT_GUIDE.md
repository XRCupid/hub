# EasyTiger Professional WebRTC Demo Setup Guide

## 1. Create New Firebase Project

### Firebase Console Setup
1. Go to https://console.firebase.google.com
2. Create new project: "easytiger-demo" or "easytiger-webrtc"
3. Enable:
   - Realtime Database
   - Authentication (if using login)
   - Hosting (optional backup)

### Security Rules (Realtime Database)
```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": true,
        ".write": true,
        "host": {
          ".validate": "newData.isString()"
        },
        "guest": {
          ".validate": "newData.isString()"
        }
      }
    },
    ".read": false,
    ".write": false
  }
}
```

### Get Your Config
```javascript
const firebaseConfig = {
  apiKey: "your-new-api-key",
  authDomain: "easytiger-demo.firebaseapp.com",
  databaseURL: "https://easytiger-demo.firebaseio.com",
  projectId: "easytiger-demo",
  storageBucket: "easytiger-demo.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

## 2. Twilio Setup (Professional TURN/STUN)

### Create Twilio Account
1. Sign up at https://www.twilio.com
2. Get Network Traversal Service
3. Note your Account SID and Auth Token

### Create Serverless Function (Vercel)
```javascript
// api/turn-credentials.js
import twilio from 'twilio';

export default function handler(req, res) {
  // Password protection
  const { password } = req.query;
  if (password !== process.env.DEMO_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  const client = twilio(accountSid, authToken);
  
  client.tokens.create().then(token => {
    res.status(200).json({
      iceServers: token.iceServers,
      ttl: token.ttl
    });
  }).catch(error => {
    res.status(500).json({ error: error.message });
  });
}
```

## 3. Environment Variables

### Create `.env.local`
```bash
# Firebase
REACT_APP_FIREBASE_API_KEY=your-new-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=easytiger-demo.firebaseapp.com
REACT_APP_FIREBASE_DATABASE_URL=https://easytiger-demo.firebaseio.com
REACT_APP_FIREBASE_PROJECT_ID=easytiger-demo
REACT_APP_FIREBASE_STORAGE_BUCKET=easytiger-demo.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id

# Twilio (for Vercel functions)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token

# Demo Protection
DEMO_PASSWORD=TigerStripes2024
REACT_APP_TURN_ENDPOINT=/api/turn-credentials
```

## 4. Update Your Code

### Update firebase.ts
```typescript
// Remove all legacy XRCupid config
// Use only new EasyTiger Firebase config
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};
```

### Update VideoCallAnalytics ICE Config
```typescript
// Fetch professional TURN credentials
const getTurnCredentials = async () => {
  try {
    const response = await fetch(
      `${process.env.REACT_APP_TURN_ENDPOINT}?password=${process.env.REACT_APP_DEMO_PASSWORD}`
    );
    const data = await response.json();
    return data.iceServers;
  } catch (error) {
    console.error('Failed to get TURN credentials:', error);
    // Fallback to public STUN
    return [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ];
  }
};
```

## 5. Vercel Deployment

### Install Vercel CLI
```bash
npm i -g vercel
```

### Create vercel.json
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "functions": {
    "api/turn-credentials.js": {
      "maxDuration": 10
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### Deploy
```bash
# First deployment
vercel

# Production deployment
vercel --prod
```

### Password Protection (Basic Auth)
Create `middleware.ts` in root:
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const basicAuth = request.headers.get('authorization');
  
  if (basicAuth) {
    const auth = basicAuth.split(' ')[1];
    const [user, pwd] = Buffer.from(auth, 'base64').toString().split(':');
    
    if (user === 'investor' && pwd === 'TigerStripes2024') {
      return NextResponse.next();
    }
  }
  
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"'
    }
  });
}

export const config = {
  matcher: '/(.*)'
};
```

## 6. Domain Setup

### Option 1: Vercel Domain
- easytiger-demo.vercel.app (free)
- Custom domain: demo.easytiger.ai

### Option 2: Cloudflare
- Better DDoS protection
- Global CDN
- More control over DNS

### DNS Settings (for custom domain)
```
Type: CNAME
Name: demo
Value: cname.vercel-dns.com
```

## 7. Testing Checklist

- [ ] WebRTC works on mobile (4G/5G)
- [ ] Works behind corporate firewalls
- [ ] Password protection active
- [ ] TURN servers connecting
- [ ] Firebase real-time sync working
- [ ] No CORS issues
- [ ] SSL certificate valid

## 8. Monitoring

### Vercel Analytics
- Real-time performance metrics
- Error tracking
- User geography

### Sentry Integration (Optional)
```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
  integrations: [
    new Sentry.BrowserTracing(),
  ],
  tracesSampleRate: 0.1,
});
```

## Cost Estimates

- **Vercel Pro**: $20/month (includes password protection)
- **Twilio TURN**: ~$10-50/month depending on usage
- **Firebase**: Free tier should be sufficient
- **Domain**: $12-15/year
- **Total**: ~$35-70/month for professional setup

## Launch Steps

1. Create new Firebase project ✓
2. Set up Twilio account ✓
3. Clone repo to new folder: `easytiger-demo`
4. Update all environment variables
5. Test locally with new Firebase
6. Deploy to Vercel
7. Set up custom domain
8. Share password-protected link with investors

## Investor Demo URL Structure
```
https://demo.easytiger.ai/video-call
Username: investor
Password: TigerStripes2024
```
