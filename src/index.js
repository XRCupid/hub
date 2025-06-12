import process from 'process';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import * as THREE from 'three';
import { extend, Canvas } from '@react-three/fiber';
// import { Amplify } from 'aws-amplify';
// import awsExports from './aws-exports';
import './tfjs-initializer'; // Moved tfjs import here to ensure it's an ES6 import at the top
import './utils/debugHume';
import './utils/testMicrophoneAccess';
import './services/nuclearHumeOverride'; // NUCLEAR OVERRIDE - YOUR CREDENTIALS ONLY

// --- START R3F/THREE EXTENSION ---
console.log("Attempting to extend THREE namespace for R3F...");
console.log('[index.js] R3F Canvas component from import:', Canvas);
console.log('[index.js] R3F extend function from import:', extend);
console.log("[index.js] THREE object before extend:", THREE);
console.log("[index.js] THREE.REVISION before extend:", THREE?.REVISION);
console.log("[index.js] window.THREE before extend:", window.THREE);
console.log("[index.js] window.THREE.REVISION before extend:", window.THREE?.REVISION);

extend(THREE);
window.THREE = THREE; // Explicitly set window.THREE to the extended THREE object

console.log("Successfully extended THREE namespace.");
console.log("[index.js] Explicitly set window.THREE to the extended THREE object.");
console.log("[index.js] THREE object after extend (imported):", THREE);
console.log("[index.js] THREE.REVISION after extend (imported):", THREE?.REVISION);
console.log("[index.js] Is THREE.CanvasTexture available AFTER extend (imported THREE)?", !!THREE?.CanvasTexture);
console.log("[index.js] window.THREE after extend:", window.THREE);
console.log("[index.js] window.THREE.REVISION after extend:", window.THREE?.REVISION);
console.log("[index.js] Is window.THREE.CanvasTexture available AFTER extend?", !!window.THREE?.CanvasTexture);
console.log('window.THREE.REVISION after extend:', window.THREE?.REVISION);
// --- END R3F/THREE EXTENSION ---

// Initialize Amplify AFTER extending THREE (TensorFlow.js is imported above)
// Amplify.configure(awsExports);

// Debug WebSocket connections (TEMPORARILY COMMENTED OUT)
// const originalWebSocket = window.WebSocket;
// window.WebSocket = function(...args) {
//   console.log('WebSocket connection created to:', args[0]);
//   const socket = new originalWebSocket(...args);

//   // Log WebSocket events
//   socket.addEventListener('open', (event) => {
//     console.log('WebSocket opened:', event);
//   });

//   socket.addEventListener('error', (event) => {
//     console.error('WebSocket error:', event);
//   });

//   socket.addEventListener('close', (event) => {
//     console.log('WebSocket closed:', event);
//   });

//   return socket;
// };

// // Restore the original WebSocket prototype
// Object.setPrototypeOf(window.WebSocket, originalWebSocket.prototype);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
