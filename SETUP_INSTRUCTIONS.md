# VisionAI Setup Instructions

Setup guide for VisionAI: assistive app with real-time camera scanning, ML object detection, and audio feedback.

---

## Architecture

| Layer | Stack |
|-------|--------|
| Frontend | React Native CLI, TypeScript, NativeWind |
| Backend | FastAPI (Python), `backend/` |
| Models | ML assets in `models/` (optional) |

---

## Prerequisites

| Requirement | Version / Notes |
|-------------|-----------------|
| Node.js | v18+ |
| npm | Bundled with Node.js |
| Git | — |
| Android Studio | For Android builds; NDK **26.1.10909125** (SDK Manager → SDK Tools → NDK) |
| Xcode | macOS only, for iOS |
| Python | 3.10+ (backend) |

---

## 1. Clone and install

```bash
git clone <repository-url>
cd VisionAI
cd frontend
npm install
```

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

### 3.1 Android SDK and local.properties

From `frontend/`:

```bash
npm run prebuild
```

This creates `android/local.properties` (sdk.dir). The script uses `ANDROID_HOME` or `ANDROID_SDK_ROOT`, or default paths (`%LOCALAPPDATA%\Android\Sdk` on Windows, `~/Android/Sdk` on macOS/Linux). Set `ANDROID_HOME` if the script cannot find the SDK.

### 3.2 Environment and Firebase

Firebase config is **not** committed. `google-services.json` is generated at build time from `frontend/.env`.

1. Copy `frontend/.env.example` to `frontend/.env`.
2. Create a project in [Firebase Console](https://console.firebase.google.com/).
3. Add two Android apps: package names `com.anonymous.VisionAI` and `com.anonymous.VisionAI.dev`.
4. In Firebase Console → Project settings, obtain:
   - Project number, Project ID, Web API Key
   - For each Android app: App ID (e.g. `1:558368469782:android:18e666c73ce261aaef9637`)
5. Set in `frontend/.env`:

| Variable | Required | Description |
|----------|----------|-------------|
| `FIREBASE_PROJECT_NUMBER` | Yes | Project number |
| `FIREBASE_PROJECT_ID` | Yes | Project ID |
| `FIREBASE_API_KEY` | Yes | Web API Key |
| `FIREBASE_MOBILE_SDK_APP_ID` | Yes | Main app App ID |
| `FIREBASE_MOBILE_SDK_APP_ID_DEV` | Yes | Dev flavor App ID |
| `GOOGLE_WEB_CLIENT_ID` | Yes | Web client ID (Google Sign-In) |
| `FIREBASE_STORAGE_BUCKET` | No | Defaults to `{PROJECT_ID}.firebasestorage.app` |
| `FIREBASE_DEBUG_CERTIFICATE_SHA1` | No | Debug SHA-1 for Google Sign-In |
| `FIREBASE_OAUTH_ANDROID_CLIENT_ID` | No | Android OAuth client (main) |
| `FIREBASE_OAUTH_ANDROID_CLIENT_ID_DEV` | No | Android OAuth client (dev) |

Do not commit `.env`. The build scripts run `scripts/generate-google-services.js` and write `android/app/google-services.json` before Gradle.

**Firebase Authentication:** In Firebase Console → Authentication → Sign-in method, enable **Email/Password** and **Google**. For Google Sign-In issues (e.g. `DEVELOPER_ERROR`), see [frontend/docs/GOOGLE_SIGNIN_SETUP.md](frontend/docs/GOOGLE_SIGNIN_SETUP.md).

### 3.3 Run the app

**Metro (required for dev):**
```bash
cd frontend
npm start
```

**Android (separate terminal):**
```bash
cd frontend
npm run android
# or: npm run android:install-dev   # installs dev debug + adb reverse 8081
```

**iOS (macOS):**
```bash
cd frontend
npm run ios
```

**Physical device:** USB debugging enabled, device connected. Use `npm run android:install-dev`; Metro must be running.

### 3.4 Native build (Android)

- **NDK:** 26.1.10909125 (Android Studio → SDK Manager → SDK Tools → NDK, enable “Show Package Details”).
- **Patched header:** Applied via `patch-package` on `npm install`; Gradle uses it for the native build.
- First build: `npm run android:install-dev` from `frontend/` (several minutes).

### 3.5 Release APK

```bash
cd frontend
npm run android:apk
```

Output: `frontend/android/app/build/outputs/apk/dev/release/app-dev-release.apk` (arm64 only). For emulator, use `npm run android:install-dev`.

### 3.6 Frontend env reference

| Variable | Description |
|---------|-------------|
| `GOOGLE_WEB_CLIENT_ID` | Firebase Web client ID |
| `API_URL` | Backend API base URL (default: emulator `http://10.0.2.2:8000`, iOS `http://127.0.0.1:8000`) |

---

## 4. CI (GitHub Actions)

Workflow: `.github/workflows/android-dev-apk-cd.yml` (builds dev release APK on push to `main` or manual dispatch).

**Required secret:** `FIREBASE_ENV`

- **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
- Name: `FIREBASE_ENV`
- Value: full contents of `frontend/.env` (Firebase/Google vars only; used to generate `google-services.json` in CI)

Without `FIREBASE_ENV`, the Android APK job fails.

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

| Issue | Action |
|-------|--------|
| Metro / NativeWind cache | `cd frontend && npm start -- --reset-cache` |
| SDK / local.properties | `cd frontend && npm run prebuild` |
| Device not reaching Metro | Run `npm run android:install-dev` (sets `adb reverse tcp:8081 tcp:8081`); ensure Metro is running. |
| App crashes on launch | Start Metro first; then install with `npm run android:install-dev`. Check `adb logcat` for native errors. |
| NDK / C++ / std::format errors | Use NDK 26.1.10909125; run `npm install` in `frontend/` so patches apply; rebuild. |
| Port 8000 in use | `uvicorn app.main:app --reload --port 8001` or stop the process using 8000. |
| Git hooks not running | `git config core.hooksPath` should show `.githooks`. On Windows, Node must be available. |

---

## 8. Command reference

| Task | Command |
|------|---------|
| Install frontend | `cd frontend && npm install` |
| Prebuild (local.properties) | `cd frontend && npm run prebuild` |
| Start Metro | `cd frontend && npm start` |
| Android dev run | `cd frontend && npm run android` |
| Android dev install | `cd frontend && npm run android:install-dev` |
| Android release APK | `cd frontend && npm run android:apk` |
| iOS | `cd frontend && npm run ios` |
| Git hooks | `git config core.hooksPath .githooks` |

For project overview and branching, see [README.md](README.md).
