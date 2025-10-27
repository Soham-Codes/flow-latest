<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1pP1L-WDva9o6PzVMX90aRCjrG5iiWwMg

## Run Locally

**Prerequisites:** Node.js

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up your API keys:**
   - Copy the example environment file:
     ```bash
     cp .env.example .env.local
     ```
   - Open `.env.local` and add your API keys:
     - `VITE_GEMINI_API_KEY`: Get from [Google AI Studio](https://aistudio.google.com/apikey)
     - `VITE_GOOGLE_MAPS_API_KEY`: Get from [Google Cloud Console](https://console.cloud.google.com/)
   
   **Important:** Never commit `.env.local` to version control. It's already in `.gitignore`.

3. **Run the app:**
   ```bash
   npm run dev
   ```

## Security Best Practices

### 🔒 Protecting Your API Keys

- **Never commit API keys** to version control. Always use `.env.local` for local development.
- **Restrict your Google Maps API key** by HTTP referrer (domain) in the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
- **For production:** Use the server-side Gemini proxy (see below) to avoid exposing API keys in the browser.

### 🛡️ Server-Side Gemini Proxy (RECOMMENDED)

This project now includes a server-side proxy for Gemini API calls to protect your API key:

**Serverless Deployment (Vercel/Netlify):**

1. Deploy the `/api/gemini-proxy.ts` function to your serverless platform
2. Set the `GEMINI_API_KEY` environment variable in your platform's dashboard:
   - **Vercel**: Project Settings → Environment Variables
   - **Netlify**: Site Settings → Environment Variables
3. The client will automatically use `/api/gemini-proxy` endpoint

**Environment Variables for Production:**
```bash
# Server-side only (never in browser)
GEMINI_API_KEY=your_actual_gemini_key_here

# Optional: Custom proxy endpoint
VITE_GEMINI_PROXY_ENDPOINT=/api/gemini-proxy
```

### 🚨 URGENT: Secret Remediation Steps

**⚠️ If you have cloned this repository before the security fixes, two Gemini API keys were exposed in git history.**

**Required Actions:**

1. **Revoke the exposed keys immediately:**
   - Go to [Google AI Studio](https://aistudio.google.com/apikey)
   - Delete any keys that match:
     - `AIzaSyATr0wA5k99oWYUL0Ifu6BDZiEMS0plMOw`
     - `AIzaSyCRGNQgexiMHTn3LNHn2OJGd574aqU_Dik`

2. **Generate new API keys:**
   - Create a new Gemini API key at [Google AI Studio](https://aistudio.google.com/apikey)
   - Add it to your `.env.local` file (never commit this file!)

3. **Run the secret purge script** (for repository maintainers):
   ```bash
   # Install git-filter-repo first
   pip install git-filter-repo
   
   # Run the purge script
   ./tools/remove-secrets/purge-history.sh
   ```
   
   See [`tools/remove-secrets/README.md`](tools/remove-secrets/README.md) for detailed instructions.

4. **After history rewrite** (all collaborators):
   - Delete your local repository
   - Re-clone from GitHub
   - Recreate any local branches

### 🔍 Automated Secret Scanning

This repository includes automated security scanning:

- **GitHub Actions**: Runs on every PR and push to main
  - Secret scanning with `detect-secrets`
  - Dependency vulnerability scanning with `npm audit`
  - TypeScript type checking
  
- **Pre-commit hooks**: Prevent secrets from being committed
  ```bash
  # Install pre-commit
  pip install pre-commit
  
  # Set up hooks
  pre-commit install
  
  # Generate secrets baseline (first time only)
  detect-secrets scan --exclude-files '\.git/.*' --exclude-files 'package-lock\.json' --exclude-files 'node_modules/.*' > .secrets.baseline
  detect-secrets audit .secrets.baseline
  ```

### 🔑 If Your Keys Have Been Leaked

If API keys were accidentally committed to Git:

1. **Immediately revoke the exposed keys:**
   - **Gemini API Key:** Go to [Google AI Studio](https://aistudio.google.com/apikey) and delete the exposed key
   - **Google Maps API Key:** Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials) and regenerate or delete the key

2. **Generate new keys** and add them to your `.env.local` file (server-side keys in platform env vars)

3. **Add restrictions:**
   - For Google Maps: Add HTTP referrer restrictions (e.g., `yourdomain.com/*`)
   - For Gemini: Use server-side proxy only (set `GEMINI_API_KEY` in serverless platform)

4. **Clean Git history:** Use the provided purge script to remove secrets from history:
   ```bash
   ./tools/remove-secrets/purge-history.sh
   ```
   See [`tools/remove-secrets/README.md`](tools/remove-secrets/README.md) for full instructions.
