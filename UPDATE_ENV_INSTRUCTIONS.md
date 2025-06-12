# How to Properly Update Your .env.local File

## The Problem
You have an RTF document with your environment variables, but `.env.local` must be a plain text file.

## Solution

### Option 1: Using Terminal (Recommended)

1. Open Terminal
2. Navigate to your project:
   ```bash
   cd /Users/douglasgoldstein/XRCupid_Clone/hub
   ```

3. Edit the file with nano:
   ```bash
   nano .env.local
   ```

4. You'll see your current variables. Update them to include BOTH naming conventions:
   ```
   REACT_APP_HUME_API_KEY=your_api_key_here
   REACT_APP_HUME_SECRET_KEY=your_secret_key_here
   ```

5. Save and exit:
   - Press `Ctrl + O` to save
   - Press `Enter` to confirm
   - Press `Ctrl + X` to exit

### Option 2: Using VS Code

1. Open the project in VS Code
2. Open `.env.local` file
3. Add your variables (make sure VS Code is in plain text mode)
4. Save the file

### What Your .env.local Should Look Like

```
# Hume AI Configuration
REACT_APP_HUME_API_KEY=your_actual_api_key_from_new_account
REACT_APP_HUME_SECRET_KEY=your_actual_secret_key_from_new_account

# Keep the CLIENT naming for compatibility
REACT_APP_HUME_CLIENT_ID=your_actual_api_key_from_new_account
REACT_APP_HUME_CLIENT_SECRET=your_actual_secret_key_from_new_account

# Other variables...
```

### Important Notes

- NO quotes around the values
- NO spaces before or after the = sign
- Each variable on its own line
- Use your NEW Hume account credentials, not the old ones

### After Updating

1. Restart your development server
2. Run the test: `node test-hume-default.js`

This should connect successfully if your new credentials are correct!
