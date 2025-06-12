# Lipsync Integration for XRcupid Avatars

1. Install lipsync.js:
   npm install lipsync

2. Place your avatar GLB and speech audio (from Hume) in accessible URLs.

3. Use the GLBModelWithBlendshapes component with the audioUrl prop:

   <GLBModelWithBlendshapes url={AVATAR_URL} audioUrl={HUME_AUDIO_URL} />

4. The lipsync system will animate the avatar's mouth blendshapes in sync with the audio.

- You can customize the PHONEME_TO_BLENDSHAPE mapping in GLBModelWithBlendshapes.tsx.
- To support emotion or gesture-driven blendshapes, extend the blendShapes prop as needed.

If Hume provides phoneme/viseme timings directly, you can swap out the useLipsync hook logic to use them instead of lipsync.js.
