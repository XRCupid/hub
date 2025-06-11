// NUCLEAR HUME OVERRIDE - YOUR CREDENTIALS ONLY, NO FALLBACKS
// This is the most aggressive override possible

interface NuclearCredentials {
  apiKey: string;
  secretKey: string;
  configId: string;
  graceConfigId: string;
  posieConfigId: string;
  rizzoConfigId: string;
  dougieConfigId: string;
}

// YOUR CREDENTIALS - HARDCODED EVERYWHERE
const YOUR_CREDENTIALS: NuclearCredentials = {
  apiKey: 'm3KaINwHsH55rJNO6zr2kIEAWvOimYeLTon3OriOXWJeCxCl',
  secretKey: 'IWtKuDbybQZLI0qWWPJn2M1iW3wrKGiQhmoQcTvIGJD2iBhDG3eRD35969FzcjNT', 
  configId: 'bfd6db39-f0ea-46c3-a64b-e902d8cec212', // Default/Grace
  graceConfigId: 'bfd6db39-f0ea-46c3-a64b-e902d8cec212',
  posieConfigId: 'dbf8debd-6835-489f-a7c3-a38fde6bb859',
  rizzoConfigId: '0643bb10-61b5-43a8-ae1d-eb0051afc0a8',
  dougieConfigId: '320d816a-8dac-44e6-b59b-1c3d2b6b24d9'
};

class NuclearHumeOverride {
  private static instance: NuclearHumeOverride;
  private credentials: NuclearCredentials = YOUR_CREDENTIALS; // Always use hardcoded
  
  private constructor() {
    this.initializeOverride();
  }
  
  static getInstance(): NuclearHumeOverride {
    if (!NuclearHumeOverride.instance) {
      NuclearHumeOverride.instance = new NuclearHumeOverride();
    }
    return NuclearHumeOverride.instance;
  }
  
  private initializeOverride() {
    // ALWAYS use hardcoded credentials - ignore URL params and localStorage
    this.credentials = YOUR_CREDENTIALS;
    console.log('[NUCLEAR] 🚨 HARDCODED CREDENTIALS ACTIVE - NO OVERRIDES ACCEPTED');
    
    // Override ALL environment variables
    this.overrideEnvironment();
  }
  
  getCredentials(): NuclearCredentials {
    // ALWAYS return hardcoded credentials
    return YOUR_CREDENTIALS;
  }
  
  setCredentials(apiKey: string, secretKey: string, configId: string) {
    // IGNORE all attempts to change credentials
    console.warn('[NUCLEAR] ❌ IGNORING CREDENTIAL CHANGE - HARDCODED ONLY');
  }
  
  overrideEnvironment() {
    console.log('[NUCLEAR] 🔥 OVERRIDING ALL ENVIRONMENT VARIABLES');
    
    // Override EVERYTHING with hardcoded values
    process.env.REACT_APP_HUME_API_KEY = YOUR_CREDENTIALS.apiKey;
    process.env.REACT_APP_HUME_SECRET_KEY = YOUR_CREDENTIALS.secretKey;
    process.env.REACT_APP_HUME_CONFIG_ID = YOUR_CREDENTIALS.configId;
    process.env.REACT_APP_HUME_CONFIG_ID_GRACE = YOUR_CREDENTIALS.graceConfigId;
    process.env.REACT_APP_HUME_CONFIG_ID_POSIE = YOUR_CREDENTIALS.posieConfigId;
    process.env.REACT_APP_HUME_CONFIG_ID_RIZZO = YOUR_CREDENTIALS.rizzoConfigId;
    process.env.REACT_APP_HUME_CONFIG_ID_DOUGIE = YOUR_CREDENTIALS.dougieConfigId;
    
    // Also set on window for good measure
    if (typeof window !== 'undefined') {
      (window as any).HUME_API_KEY = YOUR_CREDENTIALS.apiKey;
      (window as any).HUME_SECRET_KEY = YOUR_CREDENTIALS.secretKey;
      (window as any).HUME_CONFIG_ID = YOUR_CREDENTIALS.configId;
      (window as any).HUME_CONFIG_ID_GRACE = YOUR_CREDENTIALS.graceConfigId;
      (window as any).HUME_CONFIG_ID_POSIE = YOUR_CREDENTIALS.posieConfigId;
      (window as any).HUME_CONFIG_ID_RIZZO = YOUR_CREDENTIALS.rizzoConfigId;
      (window as any).HUME_CONFIG_ID_DOUGIE = YOUR_CREDENTIALS.dougieConfigId;
    }
    
    console.log('[NUCLEAR] ✅ ALL CREDENTIALS HARDCODED:');
    console.log('[NUCLEAR] API Key:', YOUR_CREDENTIALS.apiKey.substring(0, 10) + '...');
    console.log('[NUCLEAR] Secret Key:', YOUR_CREDENTIALS.secretKey.substring(0, 10) + '...');
    console.log('[NUCLEAR] Default Config:', YOUR_CREDENTIALS.configId);
    console.log('[NUCLEAR] Grace Config:', YOUR_CREDENTIALS.graceConfigId);
    console.log('[NUCLEAR] Posie Config:', YOUR_CREDENTIALS.posieConfigId);
    console.log('[NUCLEAR] Rizzo Config:', YOUR_CREDENTIALS.rizzoConfigId);
    console.log('[NUCLEAR] Dougie Config:', YOUR_CREDENTIALS.dougieConfigId);
  }
}

// Initialize immediately
const nuclearOverride = NuclearHumeOverride.getInstance();
nuclearOverride.overrideEnvironment();

// Export functions that ALWAYS return hardcoded values
export function getNuclearCredentials(): NuclearCredentials {
  return YOUR_CREDENTIALS; // Always hardcoded
}

export function setNuclearCredentials(apiKey: string, secretKey: string, configId: string) {
  console.warn('[NUCLEAR] ❌ IGNORING - CREDENTIALS ARE HARDCODED');
}

// Global emergency functions that do nothing
if (typeof window !== 'undefined') {
  (window as any).NUCLEAR_SET_HUME = (apiKey: string, secretKey: string, configId: string) => {
    console.warn('[NUCLEAR] ❌ IGNORING - CREDENTIALS ARE HARDCODED');
  };
  
  (window as any).NUCLEAR_GET_HUME = () => {
    console.log('[NUCLEAR] 🚨 HARDCODED CREDENTIALS:');
    console.log('API Key:', YOUR_CREDENTIALS.apiKey);
    console.log('Secret Key:', YOUR_CREDENTIALS.secretKey);
    console.log('Default Config:', YOUR_CREDENTIALS.configId);
    console.log('Grace Config:', YOUR_CREDENTIALS.graceConfigId);
    console.log('Posie Config:', YOUR_CREDENTIALS.posieConfigId);
    console.log('Rizzo Config:', YOUR_CREDENTIALS.rizzoConfigId);
    console.log('Dougie Config:', YOUR_CREDENTIALS.dougieConfigId);
    return YOUR_CREDENTIALS;
  };
  
  console.log(`
🚨 NUCLEAR HUME OVERRIDE ACTIVE - HARDCODED ONLY 🚨
All credentials are hardcoded. No overrides accepted.
Check credentials: NUCLEAR_GET_HUME()
  `);
}
