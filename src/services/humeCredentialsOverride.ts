// Emergency Hume Credentials Override System
// This provides multiple fallback mechanisms to ensure credentials work

interface HumeCredentials {
  apiKey: string;
  secretKey: string;
  configId: string;
}

class HumeCredentialsManager {
  private static instance: HumeCredentialsManager;
  private credentials: HumeCredentials | null = null;
  
  private constructor() {
    this.loadCredentials();
  }
  
  static getInstance(): HumeCredentialsManager {
    if (!HumeCredentialsManager.instance) {
      HumeCredentialsManager.instance = new HumeCredentialsManager();
    }
    return HumeCredentialsManager.instance;
  }
  
  private loadCredentials() {
    // Method 1: Check URL parameters (for emergency override)
    const urlParams = new URLSearchParams(window.location.search);
    const urlApiKey = urlParams.get('hume_api');
    const urlSecretKey = urlParams.get('hume_secret');
    const urlConfigId = urlParams.get('hume_config');
    
    if (urlApiKey && urlSecretKey) {
      console.log('[HumeCredentials] Using URL override credentials');
      this.credentials = {
        apiKey: urlApiKey,
        secretKey: urlSecretKey,
        configId: urlConfigId || process.env.REACT_APP_HUME_CONFIG_ID || ''
      };
      // Store in session for this session
      sessionStorage.setItem('hume_override', JSON.stringify(this.credentials));
      return;
    }
    
    // Method 2: Check session storage (persists for browser session)
    const sessionOverride = sessionStorage.getItem('hume_override');
    if (sessionOverride) {
      try {
        this.credentials = JSON.parse(sessionOverride);
        console.log('[HumeCredentials] Using session override credentials');
        return;
      } catch (e) {
        console.error('[HumeCredentials] Failed to parse session override');
      }
    }
    
    // Method 3: Check local storage (persists across sessions)
    const localOverride = localStorage.getItem('hume_credentials');
    if (localOverride) {
      try {
        this.credentials = JSON.parse(localOverride);
        console.log('[HumeCredentials] Using local storage credentials');
        return;
      } catch (e) {
        console.error('[HumeCredentials] Failed to parse local storage');
      }
    }
    
    // Method 4: Use environment variables (default)
    this.credentials = {
      apiKey: process.env.REACT_APP_HUME_API_KEY || process.env.REACT_APP_HUME_CLIENT_ID || '',
      secretKey: process.env.REACT_APP_HUME_SECRET_KEY || process.env.REACT_APP_HUME_CLIENT_SECRET || '',
      configId: process.env.REACT_APP_HUME_CONFIG_ID || ''
    };
  }
  
  getCredentials(): HumeCredentials {
    if (!this.credentials || !this.credentials.apiKey || !this.credentials.secretKey) {
      console.error('[HumeCredentials] No valid credentials found!');
      // Return empty credentials rather than throwing
      return { apiKey: '', secretKey: '', configId: '' };
    }
    return this.credentials;
  }
  
  // Allow runtime credential updates
  setCredentials(apiKey: string, secretKey: string, configId?: string) {
    this.credentials = {
      apiKey,
      secretKey,
      configId: configId || this.credentials?.configId || process.env.REACT_APP_HUME_CONFIG_ID || ''
    };
    // Save to both session and local storage
    sessionStorage.setItem('hume_override', JSON.stringify(this.credentials));
    localStorage.setItem('hume_credentials', JSON.stringify(this.credentials));
    console.log('[HumeCredentials] Credentials updated and saved');
  }
  
  // Clear all stored credentials
  clearStoredCredentials() {
    sessionStorage.removeItem('hume_override');
    localStorage.removeItem('hume_credentials');
    this.loadCredentials(); // Reload from environment
  }
}

// Export singleton instance
export const humeCredentialsManager = HumeCredentialsManager.getInstance();

// Export helper function for easy access
export function getHumeCredentials(): HumeCredentials {
  // HARDCODED CREDENTIALS - ULTIMATE FALLBACK
  const HARDCODED_CREDENTIALS = {
    apiKey: 'm3KaINwHsH55rJNO6zr2kIEAWvOimYeLTon3OriOXWJeCxCl',
    secretKey: 'IWtKuDbybQZLI0qWWPJn2M1iW3wrKGiQhmoQcTvIGJD2iBhDG3eRD35969FzcjNT',
    configId: 'bfd6db39-f0ea-46c3-a64b-e902d8cec212'
  };

  // Check URL parameters first
  const urlParams = new URLSearchParams(window.location.search);
  const urlApiKey = urlParams.get('hume_api');
  const urlSecretKey = urlParams.get('hume_secret');
  const urlConfigId = urlParams.get('hume_config');
  
  if (urlApiKey && urlSecretKey) {
    console.log('[HumeCredentials] Using URL override credentials');
    return {
      apiKey: urlApiKey,
      secretKey: urlSecretKey,
      configId: urlConfigId || process.env.REACT_APP_HUME_CONFIG_ID || HARDCODED_CREDENTIALS.configId
    };
  }
  
  // Method 2: Check session storage (persists for browser session)
  const sessionOverride = sessionStorage.getItem('hume_override');
  if (sessionOverride) {
    try {
      const sessionCredentials = JSON.parse(sessionOverride);
      console.log('[HumeCredentials] Using session override credentials');
      return sessionCredentials;
    } catch (e) {
      console.error('[HumeCredentials] Failed to parse session override');
    }
  }
  
  // Method 3: Check local storage (persists across sessions)
  const localOverride = localStorage.getItem('hume_credentials');
  if (localOverride) {
    try {
      const localCredentials = JSON.parse(localOverride);
      console.log('[HumeCredentials] Using local storage credentials');
      return localCredentials;
    } catch (e) {
      console.error('[HumeCredentials] Failed to parse local storage');
    }
  }
  
  // If no override found, use environment variables
  const apiKey = process.env.REACT_APP_HUME_API_KEY || HARDCODED_CREDENTIALS.apiKey;
  const secretKey = process.env.REACT_APP_HUME_SECRET_KEY || HARDCODED_CREDENTIALS.secretKey;
  const configId = process.env.REACT_APP_HUME_CONFIG_ID || HARDCODED_CREDENTIALS.configId;
  
  // ALWAYS return valid credentials
  return {
    apiKey: apiKey || HARDCODED_CREDENTIALS.apiKey,
    secretKey: secretKey || HARDCODED_CREDENTIALS.secretKey,
    configId: configId || HARDCODED_CREDENTIALS.configId
  };
}

// Export function to set credentials at runtime
export function setHumeCredentials(apiKey: string, secretKey: string, configId?: string) {
  humeCredentialsManager.setCredentials(apiKey, secretKey, configId);
}

// Make it available globally for emergency console access
if (typeof window !== 'undefined') {
  (window as any).humeCredentials = {
    get: () => humeCredentialsManager.getCredentials(),
    set: (apiKey: string, secretKey: string, configId?: string) => {
      humeCredentialsManager.setCredentials(apiKey, secretKey, configId);
      console.log('Credentials updated. Refresh the page to apply.');
    },
    clear: () => {
      humeCredentialsManager.clearStoredCredentials();
      console.log('Stored credentials cleared. Using environment defaults.');
    }
  };
  
  console.log('[HumeCredentials] Emergency override available via console:');
  console.log('  window.humeCredentials.set("api_key", "secret_key", "config_id")');
  console.log('  window.humeCredentials.get()');
  console.log('  window.humeCredentials.clear()');
}
