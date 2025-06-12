// Lazy loader for ML libraries to avoid TensorFlow conflicts

let ml5Instance = null;
let webgazerInstance = null;

export async function loadML5() {
  if (ml5Instance) return ml5Instance;
  
  // Dynamically load ML5 only when needed
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/ml5@0.12.2/dist/ml5.min.js';
  
  return new Promise((resolve, reject) => {
    script.onload = () => {
      ml5Instance = window.ml5;
      resolve(ml5Instance);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export async function loadWebGazer() {
  if (webgazerInstance) return webgazerInstance;
  
  // Dynamically load WebGazer only when needed
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/webgazer@2.1.0/dist/webgazer.min.js';
  
  return new Promise((resolve, reject) => {
    script.onload = () => {
      webgazerInstance = window.webgazer;
      resolve(webgazerInstance);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
