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
- **For production:** Move Gemini API calls to a backend service or serverless function to avoid exposing the API key in the browser.

### 🔑 If Your Keys Have Been Leaked

If API keys were accidentally committed to Git:

1. **Immediately revoke the exposed keys:**
   - **Gemini API Key:** Go to [Google AI Studio](https://aistudio.google.com/apikey) and delete the exposed key
   - **Google Maps API Key:** Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials) and regenerate or delete the key

2. **Generate new keys** and add them to your `.env.local` file

3. **Add restrictions:**
   - For Google Maps: Add HTTP referrer restrictions (e.g., `yourdomain.com/*`)
   - For Gemini: Consider using it server-side only or add application restrictions

4. **Review Git history:** The leaked keys will remain in Git history. Consider using tools like [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/) or `git filter-branch` to remove them from history if needed.

### ⚠️ Client-Side API Key Warning

The Gemini API key is currently used in client-side code, which means it's exposed in the browser. For production applications, we strongly recommend:

1. Creating a backend API endpoint that calls Gemini
2. Having your frontend call your backend instead of calling Gemini directly
3. This protects your API key and gives you better control over usage and costs
