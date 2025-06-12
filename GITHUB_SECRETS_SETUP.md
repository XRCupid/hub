# Setting Up GitHub Secrets for Hume API

To deploy your app with Hume API keys securely using GitHub Actions:

## Steps:

1. **Go to your GitHub repository** (github.com/XRCupid/hub)

2. **Navigate to Settings** → **Secrets and variables** → **Actions**

3. **Click "New repository secret"** and add these secrets:

   - **Name**: `REACT_APP_HUME_API_KEY`
   - **Value**: Your Hume API key
   
   - **Name**: `REACT_APP_HUME_SECRET_KEY`
   - **Value**: Your Hume secret key

4. **Enable GitHub Actions**:
   - Go to Settings → Pages
   - Under "Build and deployment", change Source to "GitHub Actions"

5. **Push changes** to trigger deployment:
   ```bash
   git add .
   git commit -m "Add GitHub Actions deployment"
   git push
   ```

## How it works:

- GitHub Actions will build your app with the secrets injected as environment variables
- The secrets are never exposed in your code or repository
- The built files are deployed to GitHub Pages
- Users can access the app without needing their own API keys

## Important Notes:

- **NEVER** commit API keys to your repository
- GitHub Secrets are encrypted and only available during build time
- The API keys will be bundled into the built JavaScript, so they're still technically visible to determined users
- For production apps, consider using a backend proxy for better security

## Alternative: Keep Current Setup

If you prefer to keep using `npm run deploy` locally:
1. Create a `.env` file locally (don't commit it!)
2. Add your keys to `.env`
3. Run `npm run build` then `npm run deploy` locally
4. The keys will be bundled but not in your repository
