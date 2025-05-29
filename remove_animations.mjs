import { NodeIO } from '@gltf-transform/core';
import { KHRONOS_EXTENSIONS } from '@gltf-transform/extensions';

// Optional: If your model uses Draco compression and you want to preserve it,
// or if you want to apply Draco compression, you'd include draco3dgltf.
// For simply removing animations, it might not be strictly necessary if the model isn't Draco compressed.
// import draco3d from 'draco3dgltf';

const io = new NodeIO()
    .registerExtensions(KHRONOS_EXTENSIONS);

// Uncomment and configure if Draco is needed:
// const draco = await draco3d.createDecoderModule();
// const dracoEncoder = await draco3d.createEncoderModule();
// io.registerDependencies({
//     'draco3d.decoder': draco,
//     'draco3d.encoder': dracoEncoder,
// });

console.log('Reading public/bro.glb...');
const document = await io.read('public/bro.glb');

const animationCount = document.getRoot().listAnimations().length;
console.log(`Found ${animationCount} animations.`);

if (animationCount > 0) {
    console.log('Removing animations...');
    document.getRoot().listAnimations().forEach(anim => anim.dispose());
    console.log('Animations removed.');
} else {
    console.log('No animations to remove.');
}

console.log('Writing to public/bro-no-anims.glb...');
await io.write('public/bro-no-anims.glb', document);

console.log('Processing complete. Output at public/bro-no-anims.glb');
