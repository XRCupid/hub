# 🎮 RPM Avatar Demo Script

Follow these steps to see the full RPM integration in action!

## 1. Start the App
```bash
npm start
```

## 2. Navigate to RPM Setup
- Click **"RPM Setup"** in the navigation menu
- You'll see the avatar management interface

## 3. Create Your First Avatar
1. Click **"Create New Avatar"**
2. The RPM creator opens in a modal
3. Customize your avatar:
   - Choose gender
   - Select hairstyle
   - Pick outfit
   - Adjust colors
4. Click **"Done"** when satisfied
5. Avatar automatically saves!

## 4. Create More Avatars
- Repeat step 3 to create 3-4 diverse avatars
- Mix different styles and appearances
- Each saves automatically

## 5. Test the Integration
Open browser console (F12) and run:
```javascript
testRPM()
```

This will verify:
- ✅ Configuration status
- ✅ Stored avatars
- ✅ Service integration
- ✅ Component availability

## 6. See Avatars in Action
1. Click **"Dating Sim"** in navigation
2. Start swiping through profiles
3. Match with someone
4. Progress to video chat
5. Watch your RPM avatars come to life!

## 7. Advanced Testing

### Check Stored Avatars
```javascript
// In browser console
const avatars = JSON.parse(localStorage.getItem('rpm_avatars'));
console.table(avatars);
```

### Clear Avatar Storage
```javascript
// Only if you want to start fresh
localStorage.removeItem('rpm_avatars');
```

### Generate Test Avatar
```javascript
// Test the service directly
const service = new window.ReadyPlayerMeService({
  subdomain: 'xr-cupid'
});
const avatar = await service.generateRandomAvatar();
console.log(avatar);
```

## 🎉 Success Indicators

You know it's working when:
1. ✅ Avatars appear in the gallery after creation
2. ✅ Profile photos show your avatars (or nice placeholders)
3. ✅ Video calls load 3D avatars (or animated fallbacks)
4. ✅ No 404 errors in console
5. ✅ Smooth transitions between screens

## 🆘 Troubleshooting

### "Avatar creator won't open"
- Check popup blocker settings
- Allow iframes from readyplayer.me

### "Avatars not saving"
- Check localStorage isn't disabled
- Try a different browser

### "Can't see avatars in dating sim"
- Create at least 2-3 avatars first
- Refresh the page after creating avatars

## 📸 What You Should See

### RPM Setup Page
- Configuration status (subdomain, app ID)
- "Create New Avatar" button
- Avatar gallery showing your creations
- Test results in green

### Dating Simulation
- Profile cards with avatar images
- Smooth chat interface
- 3D avatars in video calls
- Emotion-reactive animations

## 🚀 Next Steps

1. Create 5-6 diverse avatars for best variety
2. Test different conversation paths
3. Try the emotion detection in video calls
4. Explore all the training modules

Enjoy your fully-integrated RPM avatar experience! 🎭
