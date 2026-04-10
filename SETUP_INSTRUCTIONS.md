# VisionAI Setup Instructions

Setup guide for VisionAI: assistive app with real-time camera scanning, ML object detection, and audio feedback.

---

## Architecture

| Layer    | Stack                                    |
| -------- | ---------------------------------------- |
| Frontend | React Native CLI, TypeScript, NativeWind |
| Backend  | FastAPI (Python), `backend/`             |
| Models   | ML assets in `models/` (optional)        |

---

## Prerequisites

| Requirement    | Version / Notes                                                           |
| -------------- | ------------------------------------------------------------------------- |
| Node.js        | v18+                                                                      |
| npm            | Bundled with Node.js                                                      |
| Git            | —                                                                         |
| Android Studio | For Android builds; NDK **26.1.10909125** (SDK Manager → SDK Tools → NDK) |
| Xcode          | macOS only, for iOS                                                       |
| Python         | 3.10+ (backend)                                                           |

---

## 1. Clone and install

```bash
git clone <repository-url>
cd VisionAI
cd frontend
npm install
```

From the **repo root** you can also run `npm start`, `npm run android`, and `npm run ios` (they delegate to `frontend/`). You still need `npm install` inside `frontend/` first so `node_modules` exists there.

---

## 2. Git hooks (one-time)

Branch-name validation runs on commit. From repo root:

**Windows (PowerShell):**

```powershell
git config core.hooksPath .githooks
```

**macOS / Linux:**

```bash
git config core.hooksPath .githooks
chmod +x .githooks/pre-commit .githooks/pre-commit-bash.sh .githooks/pre-commit-node.js
```

Allowed branch names: `develop`, `HEAD`, or `feature/<slug>`, `bugfix/<slug>`, `update/<slug>`, `release/<slug>` (lowercase slug: letters, numbers, dots, underscores, hyphens).

---

## 3. Frontend

### 3.1 Android SDK and `local.properties`

The `prebuild` script runs `scripts/setup-local-properties.js` to create or update `android/local.properties` with `sdk.dir`. Without it you may see "SDK location not found".

From `frontend/`:

```bash
cd frontend
npm run prebuild
```

The script uses `ANDROID_HOME` or `ANDROID_SDK_ROOT`, or defaults (`%LOCALAPPDATA%\Android\Sdk` on Windows, `~/Android/Sdk` on macOS/Linux). Set `ANDROID_HOME` if the SDK is not found.

### 3.2 Environment and Firebase

Firebase config is **not** committed. `google-services.json` is generated at build time from `frontend/.env`.

1. Copy `frontend/.env.example` to `frontend/.env`.
2. Create a project in [Firebase Console](https://console.firebase.google.com/).
3. Add two Android apps: package names `com.anonymous.VisionAI` and `com.anonymous.VisionAI.dev`.
4. In Firebase Console → Project settings, obtain:
   - Project number, Project ID, Web API Key
   - For each Android app: App ID (e.g. `1:558368469782:android:18e666c73ce261aaef9637`)
5. Set in `frontend/.env`:

| Variable                               | Required | Description                                    |
| -------------------------------------- | -------- | ---------------------------------------------- |
| `FIREBASE_PROJECT_NUMBER`              | Yes      | Project number                                 |
| `FIREBASE_PROJECT_ID`                  | Yes      | Project ID                                     |
| `FIREBASE_API_KEY`                     | Yes      | Web API Key                                    |
| `FIREBASE_MOBILE_SDK_APP_ID`           | Yes      | Main app App ID                                |
| `FIREBASE_MOBILE_SDK_APP_ID_DEV`       | Yes      | Dev flavor App ID                              |
| `GOOGLE_WEB_CLIENT_ID`                 | Yes      | Web client ID (Google Sign-In)                 |
| `FIREBASE_STORAGE_BUCKET`              | No       | Defaults to `{PROJECT_ID}.firebasestorage.app` |
| `FIREBASE_DEBUG_CERTIFICATE_SHA1`      | No       | Debug SHA-1 for Google Sign-In                 |
| `FIREBASE_OAUTH_ANDROID_CLIENT_ID`     | No       | Android OAuth client (main)                    |
| `FIREBASE_OAUTH_ANDROID_CLIENT_ID_DEV` | No       | Android OAuth client (dev)                     |

Do not commit `.env`. Build scripts run `scripts/generate-google-services.js` and write `android/app/google-services.json` before Gradle.

**Firebase Authentication:** In Firebase Console → Authentication → Sign-in method, enable **Email/Password** and **Google**. For Google Sign-In issues (e.g. `DEVELOPER_ERROR`), see [frontend/docs/GOOGLE_SIGNIN_SETUP.md](frontend/docs/GOOGLE_SIGNIN_SETUP.md).

### 3.3 Run the app (Metro, Android, iOS)

**Metro (required for dev):**

```bash
cd frontend
npm start
```

**From repo root:** `npm start` (same as above).

**Android**

- Emulator: `cd frontend && npm run android` (requires Android Studio), or start Metro then `npm run android:install-dev` (installs dev debug and runs `adb reverse tcp:8081 tcp:8081`).
- Physical device: USB debugging on; use `npm run android:install-dev`; Metro must be running.

**iOS (macOS)**

```bash
cd frontend
npm run ios
```

See [§3.7 iOS setup](#37-ios-setup-mac-only) for CocoaPods and `GoogleService-Info.plist`.

### 3.4 Native build (Android / New Architecture)

The app uses React Native **New Architecture** and **NDK 26**.

- **NDK:** **26.1.10909125** — Android Studio → SDK Manager → SDK Tools → show package details → NDK → **26.1.10909125** → Apply.
- **Patched header:** `patch-package` applies a React Native `graphicsConversions.h` patch on `npm install` in `frontend/`. Gradle/CMake use it so the app and autolinked libraries build with NDK 26.
- **First native build:** From `frontend/` run `npm run android:install-dev`, or from `frontend/android`: `./gradlew installDevDebug` (macOS/Linux) / `gradlew.bat installDevDebug` (Windows). First build can take several minutes.

### 3.5 Release APK

```bash
cd frontend
npm run android:apk
```

Output: `frontend/android/app/build/outputs/apk/dev/release/app-dev-release.apk` (arm64 only). For emulator workflows, prefer `npm run android:install-dev`.

### 3.6 Frontend environment variables

| Variable               | Description                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------------- |
| `GOOGLE_WEB_CLIENT_ID` | Firebase Web client ID                                                                       |
| `API_URL`              | Backend API base URL (default: emulator `http://10.0.2.2:8000`, iOS `http://127.0.0.1:8000`) |

Copy `frontend/.env.example` to `frontend/.env` and fill Firebase/Google values (see §3.2).

**Code style (optional):** From `frontend/`, `npm run format` / `npm run format:check` (Prettier).

### 3.7 iOS setup (Mac only)

The `frontend/ios/` project is in the repo. On a Mac:

1. Install CocoaPods: `sudo gem install cocoapods`
2. Install pods: `cd frontend/ios && pod install`
3. **Firebase:** In Firebase Console, add an iOS app with bundle ID `com.anonymous.VisionAI`, download `GoogleService-Info.plist`, place it in `frontend/ios/VisionAI/` (or the app target folder your project uses).
4. Run: `npm run ios` from repo root or `frontend/`.

Without a Mac you can still work on JS/TS; build iOS when Xcode is available.

---

## 4. CI (GitHub Actions)

Workflow: `.github/workflows/android-dev-apk-cd.yml` — dev release APK on push to `main` or manual dispatch.

**Required secret:** `FIREBASE_ENV`

- **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
- Name: `FIREBASE_ENV`
- Value: full contents of `frontend/.env` (same Firebase/Google vars as locally; used to generate `google-services.json` in CI)

Without `FIREBASE_ENV`, the Android APK job fails.

CI also runs `.github/workflows/ci.yml` (backend checks and frontend type-check).

---

## 5. Backend

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
```

Run:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Optional `backend/.env` (e.g. `APP_NAME`, `ENVIRONMENT`, `LOG_LEVEL`, `CORS_ALLOW_ORIGINS`, `MODEL_VERSION`).

---

## 6. Models

The `models/` directory holds ML assets. Document expected formats and loading in `backend/` or project docs when adding models.

---

## 7. Troubleshooting

| Issue                          | Action                                                                                                    |
| ------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Metro / NativeWind cache       | `cd frontend && npm start -- --reset-cache`                                                               |
| SDK / local.properties         | `cd frontend && npm run prebuild`                                                                         |
| Device not reaching Metro      | Run `npm run android:install-dev` (sets `adb reverse tcp:8081 tcp:8081`); ensure Metro is running.        |
| App crashes on launch          | Start Metro first; then install with `npm run android:install-dev`. Check `adb logcat` for native errors. |
| NDK / C++ / std::format errors | Use NDK 26.1.10909125; run `npm install` in `frontend/` so patches apply; rebuild.                        |
| Port 8000 in use               | `uvicorn app.main:app --reload --port 8001` or stop the process using 8000.                               |
| Git hooks not running          | `git config core.hooksPath` should show `.githooks`. On Windows, Node must be available.                  |

---

## 8. Command reference

| Task                        | Command                                      |
| --------------------------- | -------------------------------------------- |
| Install frontend            | `cd frontend && npm install`                 |
| Prebuild (local.properties) | `cd frontend && npm run prebuild`            |
| Start Metro                 | `cd frontend && npm start`                   |
| Android dev run             | `cd frontend && npm run android`             |
| Android dev install         | `cd frontend && npm run android:install-dev` |
| Android release APK         | `cd frontend && npm run android:apk`         |
| iOS                         | `cd frontend && npm run ios`                 |
| Git hooks                   | `git config core.hooksPath .githooks`        |

For overview and branching, see [README.md](README.md) and [CONTRIBUTING.md](CONTRIBUTING.md).
