# HappyPause Setup Hiccups

Common issues encountered during setup and how to avoid or fix them.

---

## Token Storage (SecureStore on Web)

**Problem:** `expo-secure-store` does not support web. Running the app in a browser causes:
```
ExpoSecureStore.default.getValueWithKeyAsync is not a function
```

**Solution:** Use a platform-aware storage abstraction:
- **Native (iOS/Android):** SecureStore.getItemAsync / setItemAsync / deleteItemAsync
- **Web:** localStorage.getItem / setItem / removeItem
- Create `lib/secureStorage.ts` that switches based on `Platform.OS`
- AuthContext should use this abstraction, not SecureStore directly

---

## NPM Install Failures

**Problem:** `npm install` fails with ERESOLVE peer dependency conflicts (e.g., react vs react-dom version mismatch).

**Solution:**
1. Add `mobile/.npmrc` with: `legacy-peer-deps=true`
2. Or run: `npm install --legacy-peer-deps`

---

## Package Versions

**Problem:** Pinned versions don't exist on npm (e.g., `@react-native-google-signin@^14.1.0`, `expo-apple-authentication@~7.0.4`).

**Solution:**
- Use `npx expo install <package>` for Expo packages — gets SDK-compatible versions
- For third-party packages, verify the version exists on [npmjs.com](https://www.npmjs.com) before pinning
- `@react-native-google-signin/google-signin`: use `^13.2.0` (14.x may not exist)
- `expo-apple-authentication`: use `npx expo install expo-apple-authentication` for correct version

---

## Web Platform Support

**Problem:** "Web is waiting" or "don't have the required dependencies installed" when pressing `w` to open web.

**Solution:** Install web dependencies:
```bash
npm install react-native-web --legacy-peer-deps
```
(or `npx expo install react-native-web` if peer deps allow it)

**Note:** OAuth (Google Sign-In, Apple Sign-In) does not work on web. Disable those buttons or show "Coming soon" when `Platform.OS === 'web'`.

---

## Port Already in Use

**Problem:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solution:**
1. Find the process: `netstat -ano | findstr :3000` (Windows) or `lsof -i :3000` (Mac/Linux)
2. Kill it: `taskkill /PID <pid> /F` (Windows) or `kill <pid>` (Mac/Linux)
3. Or use a different port: set `PORT=3001` in backend `.env` and `EXPO_PUBLIC_API_URL=http://localhost:3001` in mobile `.env`

---

## No Test User

**Note:** The database is seeded with categories and activities, but there is no pre-created test user. You must **Sign Up** to create an account before you can log in. Use email/password registration for the quickest path.

---

## Update Prompts for Future Builds

To avoid these hiccups in future implementations, add to your prompts:
- **Storage:** Require platform-aware storage (SecureStore on native, localStorage on web)
- **Dependencies:** Use `npx expo install` for Expo packages; document `.npmrc` with `legacy-peer-deps=true`
- **Web:** Mention `react-native-web` in setup steps
