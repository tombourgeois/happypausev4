# HappyPause Web – Netlify Deployment

## 1. Push to GitHub

```bash
git remote add origin https://github.com/tomb4289/happypausetimev1.git
# Or if remote exists: git remote set-url origin https://github.com/tomb4289/happypausetimev1.git
git push -u origin main
```

## 2. Connect Netlify

1. Go to [Netlify](https://app.netlify.com) → **Add new site** → **Import an existing project**
2. Connect to GitHub and select `tomb4289/happypausetimev1`
3. Build settings are read from `netlify.toml` automatically
4. **Add environment variable** (Site settings → Environment variables):
   - `EXPO_PUBLIC_API_URL` = `https://happypausetime.mobileappslabs.ca`
5. Deploy

## 3. CORS

After deploy, add your Netlify URL (e.g. `https://yoursite.netlify.app`) to `CORS_ORIGIN` on the API server. Ask JF to update the deployed API env.
