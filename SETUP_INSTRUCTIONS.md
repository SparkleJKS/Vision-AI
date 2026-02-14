# VisionAI Setup Instructions

Complete setup guide for VisionAI: an assistive app for the visually impaired with real-time camera scanning, ML-powered object detection, and audio feedback.

## 🏗️ Architecture

- **Frontend**: React Native CLI, **TypeScript**, **NativeWind** (Tailwind CSS)
- **Backend**: FastAPI (Python) in `backend/`
- **Models**: ML models (to be added in `models/`)
- **Database**: Optional (add PostgreSQL or SQLite if you store data)

## Prerequisites

### Required

- **Node.js** (v18 or higher) — [nodejs.org](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git**
- **Android Studio** or **Xcode** (for emulator/device builds)

### Optional

- **Python 3.10+** — for backend
- **Android Studio** — for Android emulator
- **Xcode** — for iOS development (macOS only)
- **VS Code** or **Cursor** — recommended editor

---

## 1. Clone the repository

```bash
git clone <repository-url>
cd VisionAI
```

---

## 2. Git hooks (one-time, all contributors)

Branch-name validation runs on commit. Configure from the repo root:

**Windows (PowerShell):**

```powershell
git config core.hooksPath .githooks
```

**macOS / Linux / Git Bash:**

```bash
git config core.hooksPath .githooks
chmod +x .githooks/pre-commit .githooks/pre-commit-bash.sh .githooks/pre-commit-node.js
```

**Allowed branch names:** `develop`, `HEAD`, or:

- `feature/<slug>` (e.g. `feature/camera-settings`)
- `bugfix/<slug>` (e.g. `bugfix/audio-crash`)
- `update/<slug>` (e.g. `update/deps`)
- `release/<slug>` (e.g. `release/1.0.0`)

Use only lowercase letters, numbers, dots, underscores, and hyphens in the slug.

---

## 3. Frontend setup (React Native CLI)

### Install dependencies

From repo root:

```bash
cd frontend
npm install
```

Or run frontend commands from root (no need to `cd frontend` for install if you use root scripts):

```bash
npm start          # same as: cd frontend && npm start
npm run android
npm run ios
npm run web
```

First time you should run `npm install` inside `frontend/` so `node_modules` is created there.

### Start the dev server

**From root:**

```bash
npm start
```

**From frontend folder:**

```bash
cd frontend
npm start
```

### Run the app

- **Android emulator**: Run `npm run android` (requires Android Studio).
- **iOS simulator** (macOS only): Run `npm run ios` (requires Xcode).
- **Physical device**: Run `npm run android:install-dev` for a dev build, then connect via USB and ensure USB debugging is enabled.

### Android native build (dev client / New Architecture)

The app uses React Native’s **New Architecture** and builds native code with **NDK 26**.

- **NDK version:** The project pins **NDK 26.1.10909125**. Install it in **Android Studio → SDK Manager → SDK Tools** → enable "Show Package Details" → under **NDK** select **26.1.10909125** → Apply.
- **Patched header:** A patch is applied to React Native’s `graphicsConversions.h` (for NDK 26’s C++ stdlib). It is applied automatically when you run `npm install` in `frontend/` (via `patch-package`). The app’s Gradle/CMake setup copies this patched header and passes it to the native build so both the app and autolinked libraries use it.
- **First native build:** From `frontend/` run `npm run android:install-dev` (or from `frontend/android`: `./gradlew installDevDebug` on macOS/Linux, `gradlew.bat installDevDebug` on Windows). The first build can take several minutes.

#### Prebuild and `local.properties`

The `prebuild` script runs `scripts/setup-local-properties.js` to create or update `android/local.properties` with the correct `sdk.dir`. Without this file you may see "SDK location not found" errors.

**Solution:** Run the prebuild script from `frontend/`:

```bash
cd frontend
npm run prebuild
```

This runs the **postprebuild** script (`scripts/setup-local-properties.js`) that creates `local.properties`. The script looks for the SDK in this order:

1. `ANDROID_HOME` environment variable  
2. `ANDROID_SDK_ROOT` environment variable  
3. Default path (e.g. `%LOCALAPPDATA%\Android\Sdk` on Windows, `~/Android/Sdk` on macOS/Linux)

**Optional:** Set `ANDROID_HOME` (or `ANDROID_SDK_ROOT`) so the script always finds your SDK:

- **Windows:** `set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk` (or add it in System Environment Variables)
- **macOS/Linux:** `export ANDROID_HOME=~/Android/Sdk` (or add to `~/.bashrc` / `~/.zshrc`)

`local.properties` is gitignored because it contains machine-specific paths.

#### Firebase (Crashlytics)

The app uses **Firebase Crashlytics** for crash reporting. Crashlytics works only in **development builds** (not in Expo Go).

**Setup:**

1. Create a project at [Firebase Console](https://console.firebase.google.com/).
2. Add an **Android app** with package name `com.anonymous.VisionAI` (or `com.anonymous.VisionAI.dev` for the dev flavor).
3. Download `google-services.json` and place it in `frontend/` (project root).
4. Build the app: `npm run android:install-dev`.

**Note:** `google-services.json` is committed to the repo.

#### Firebase Authentication (Email/Password & Google)

The app uses **Firebase Auth** with email/password and Google Sign-In.

**1. Enable sign-in methods in Firebase Console:**

- Go to [Firebase Console](https://console.firebase.google.com/) → your project → **Authentication** → **Sign-in method**
- Enable **Email/Password**
- Enable **Google** (add support email if prompted)

**2. Google Sign-In – Web Client ID (required for Google auth):**

- Firebase Console → Project Settings → **Your apps** → select your Android app
- Under "SDK setup and configuration", if you have a **Web app** in the project, copy its **Web client ID** (format: `XXXXX-xxx.apps.googleusercontent.com`)
- If you don't have a Web app: **Add app** → **Web** → register, then copy the Web client ID
- Create `frontend/.env` (or set `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in your environment):
  ```
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=YOUR_WEB_CLIENT_ID_HERE
  ```
- Rebuild the app after adding the env var

**3. Add both package names to Firebase:**

- Add Android apps for both `com.anonymous.VisionAI` and `com.anonymous.VisionAI.dev` (dev flavor)
- The `google-services.json` should include clients for both (see Firebase Crashlytics section)

### Frontend tech stack

- **React Native CLI**
- **TypeScript**
- **NativeWind** (Tailwind for React Native) — use `className` on React Native components
- **React Native Reanimated** & **Safe Area Context**

---

## 4. Backend setup (FastAPI)

### Install Python dependencies

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### Run backend

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will run at `http://localhost:8000` (or as configured).

### Environment variables (when added)

Create `backend/.env` as needed, for example:

```env
APP_NAME=VisionAI Backend
ENVIRONMENT=local
LOG_LEVEL=INFO
CORS_ALLOW_ORIGINS=*
MODEL_VERSION=mock-0.1
```

---

## 5. Models folder

The `models/` folder is a placeholder for ML model files (e.g. TensorFlow, ONNX). When you add models, document the expected format and how the backend loads them in this file or in `backend/` docs.

---

## 6. Troubleshooting

### Frontend

- **Metro/NativeWind cache issues**  
  ```bash
  cd frontend
  npm start -- --reset-cache
  ```

- **Node version**  
  Use Node 18+ and ensure `node` and `npm` are on your PATH.

- **Dev server not connecting to device**  
  Ensure phone/emulator and computer are on the same Wi‑Fi (for wireless debugging) or use USB debugging. Check that no firewall is blocking the Metro port (default 8081).

- **Android native build: undefined C++ symbols or std::format / graphicsConversions errors**  
  The project is pinned to **NDK 26.1.10909125**. Install it in **Android Studio → SDK Manager → SDK Tools** → "Show Package Details" → **NDK** → **26.1.10909125** → Apply. Ensure patches are applied: from `frontend/` run `npm install` (this runs `patch-package` and applies the React Native header patch). Then from `frontend/android` run `gradlew.bat clean` (Windows) or `./gradlew clean`, and build again (e.g. `gradlew.bat installDevDebug` or `./gradlew installDevDebug`).

- **SDK location not found / `local.properties` missing**  
  Run `npm run prebuild` from `frontend/`; the postprebuild script recreates `local.properties` automatically. See [Prebuild and local.properties](#prebuild-and-localproperties) above.

### Backend

- **Port 8000 in use**  
  Change port: `uvicorn app.main:app --reload --port 8001`  
  Or (Windows) find and stop the process using port 8000.

### Git hooks not running

- Confirm: `git config core.hooksPath` shows `.githooks`.
- On Windows, ensure Node is installed (pre-commit uses the Node script).

---

## 7. Production (future)

- **Backend**: Use a production WSGI/ASGI server (e.g. Gunicorn), PostgreSQL, and env-based config.
- **Frontend**: Use `npm run android:apk` for release APK, or configure Android Studio / Xcode for production builds.
- **API**: Point the app to the production API URL via environment or config.

---

## 8. Summary

| Task              | Command (from repo root)     |
|-------------------|------------------------------|
| Install frontend  | `cd frontend && npm install`  |
| Start app         | `npm start`                   |
| Android (dev build) | `npm run android`             |
| Android dev build | `cd frontend && npm run android:install-dev` |
| Prebuild (clean)  | `cd frontend && npm run prebuild -- --clean` |
| iOS               | `npm run ios`                 |
| Git hooks         | `git config core.hooksPath .githooks` |

For more on the project and branching workflow, see [README.md](README.md).
