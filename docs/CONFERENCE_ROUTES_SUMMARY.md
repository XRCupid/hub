# Conference Demo Routes Summary 🗺️

## Current Route Structure

### Original Conference Booth Demo
- **URL**: `/conference-booth-demo`
- **Features**: WebRTC video chat, presence avatars, audience analytics
- **Setup**: Single page with participant/audience toggle

### New Conference Setup (Your Demo)
- **Host Computer**: `/conference`
  - Creates room with 6-character code
  - Shows webcam preview
  - Auto-switches to analytics when mobile joins
  
- **Mobile Device**: `/conference-mobile`
  - Joins with room code
  - Uses mobile camera
  - Connects to host computer

### Navigation Between Systems

**From Conference Booth Demo:**
- Added links to new conference setup
- "Host Conference (Computer)" → `/conference`
- "Join Conference (Mobile)" → `/conference-mobile`

**Direct Access:**
```
http://localhost:3000/conference-booth-demo  → Original demo
http://localhost:3000/conference             → New host setup
http://localhost:3000/conference-mobile      → New mobile join
```

## Key Differences

| Feature | Original Booth | New Conference |
|---------|---------------|----------------|
| Setup | Single page | Two separate pages |
| Room Codes | Long IDs | Simple 6-char codes |
| Connection | WebRTC/Firestore | Firebase Realtime DB |
| Analytics | Built-in | Auto-appears on connect |
| Avatars | Toggle in page | Overlay on analytics |

## For Your Demo

**Recommended Flow:**
1. Start at `/conference` on computer
2. Join from `/conference-mobile` on phone
3. Show auto-switch to analytics dashboard
4. Demonstrate real-time features

**Alternative:**
- Can still use `/conference-booth-demo` for single-page demo
- Links added to easily switch between versions

Both systems work independently but share the same analytics dashboard and emotion tracking features!
