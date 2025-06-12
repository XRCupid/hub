# API Keys to Update in .env File

Copy the following template to your `.env` file and replace with your actual API keys:

```bash
# Ready Player Me Configuration
REACT_APP_RPM_API_KEY=your_api_key_here
REACT_APP_RPM_SUBDOMAIN=xr-cupid
REACT_APP_RPM_APP_ID=68389f8fa2bcefc234512570

# Firebase Configuration
# Get these from: https://console.firebase.google.com/
# Project Settings > General > Your apps > Firebase SDK snippet > Config
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com/
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789012
REACT_APP_FIREBASE_APP_ID=1:123456789012:web:abcdef123456789
REACT_APP_FIREBASE_MEASUREMENT_ID=G-ABCDEFGHIJ

# Hume AI Configuration
# Get your API key from: https://platform.hume.ai/settings/keys
REACT_APP_HUME_API_KEY=your_hume_api_key_here
REACT_APP_HUME_SECRET_KEY=your_hume_secret_key_here
REACT_APP_HUME_CONFIG_ID=your_default_hume_config_id_here

# Coach-specific Hume Config IDs
# Replace with your actual coach config IDs from Hume platform
REACT_APP_HUME_CONFIG_ID_GRACE=your_grace_config_id_here
REACT_APP_HUME_CONFIG_ID_POSIE=your_posie_config_id_here
REACT_APP_HUME_CONFIG_ID_RIZZO=your_rizzo_config_id_here

# OpenAI Configuration (for fallback voice and conversation)
# Get your API key from: https://platform.openai.com/api-keys
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here

# ElevenLabs Configuration (alternative voice provider)
# Get your API key from: https://elevenlabs.io/api
REACT_APP_ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Convai Configuration (AI voice and conversation service)
# Get your API key from: https://convai.com/dashboard
REACT_APP_CONVAI_API_KEY=your_convai_api_key_here
```

## Steps to Update:

1. **Create/Edit .env file**: If you don't have a `.env` file, create one in the root directory (`/Users/douglasgoldstein/XRCupid_Clone/hub/.env`)

2. **Copy the template above** and paste it into your `.env` file

3. **Replace the placeholder values** with your actual API keys:
   - **Hume AI**: Most important for coach voices and NPC interactions
   - **Firebase**: For user authentication and data storage
   - **OpenAI**: For fallback conversation generation
   - **ElevenLabs**: For alternative voice synthesis
   - **Ready Player Me**: For avatar generation
   - **Convai**: For additional AI voice features

4. **For Rizzo's Hume Config**:
   - Go to https://platform.hume.ai/
   - Create a new EVI configuration
   - Use the character bio from `/src/config/RizzoSystemPrompt.txt`
   - Copy the config ID and set it as `REACT_APP_HUME_CONFIG_ID_RIZZO`

5. **Save the file** and restart your development server:
   ```bash
   npm start
   ```

## Security Note:
- Never commit your `.env` file to version control
- The `.gitignore` file should already exclude it
- Keep your API keys secure and rotate them regularly
