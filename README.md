# VisionAI – Assistive Technology for the Visually Impaired

A prototype application that helps blind and visually impaired individuals by providing real-time object descriptions through camera input and text-to-speech output.

## Features

- Real-time camera object detection (planned)
- Offline ML model processing (planned)
- Text-to-speech audio feedback (planned)
- **React Native (Expo)** mobile app with **TypeScript** and **Tailwind (NativeWind)**
- **Django** backend API (planned)
- **ML models** in a dedicated `models/` folder (planned)

## Project Structure

```
VisionAI/
├── frontend/         # Expo React Native app (TypeScript, NativeWind)
├── backend/         # Django backend (to be added)
├── models/          # ML models (to be added)
├── .githooks/       # Git hooks (branch name validation)
├── .github/         # CI workflows
├── package.json     # Root scripts (runs frontend commands)
├── README.md
└── SETUP_INSTRUCTIONS.md
```

## Quick Start

### Prerequisites

- **Node.js** (v18+)
- **Python 3.8+** (for backend, when added)
- **Expo Go** app (for testing on device)
- **Android Studio** / **Xcode** (for emulators; optional)

### Run the app (frontend only)

From the **repo root**:

```bash
npm install          # only if you need root deps (optional)
npm start            # starts Expo dev server
npm run android      # Android
npm run ios          # iOS (macOS only)
npm run web          # Web
```

Or from the **frontend** folder:

```bash
cd frontend
npm install
npm start
```

**Tunnel mode** (if your phone can’t reach the dev server on the same Wi‑Fi, e.g. “Failed to download remote update” in Expo Go):

```bash
cd frontend
npx expo start --tunnel
```

Then open in Expo Go (scan QR code) or press `a` (Android) / `i` (iOS) / `w` (web).

### Android dev build (physical device / emulator)

To build and install the **dev debug** app on a connected Android device or emulator:

```bash
cd frontend
npm run android:install-dev
```

Or from the Android project directory: `cd frontend/android` then `./gradlew installDevDebug` (macOS/Linux) or `gradlew.bat installDevDebug` (Windows). That builds and installs the dev variant (app id: `com.anonymous.VisionAI.dev`). If the build fails with “SDK location not found”, add `frontend/android/local.properties` with:

`sdk.dir=C\:\\Users\\YOUR_USERNAME\\AppData\\Local\\Android\\Sdk`  
(use your own SDK path; `local.properties` is gitignored.)

### Backend & models

Backend and models folders are placeholders. See [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md) for future backend and ML setup.

## Detailed setup

See **[SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md)** for:

- Git hooks (branch name validation)
- Backend (Django) setup when added
- Frontend (Expo) configuration
- Environment variables and troubleshooting

## Branching & pull request workflow

1. **Create a branch** with a suitable name (enforced by pre-commit):
   - `feature/<slug>` — new features (e.g. `feature/camera-settings`)
   - `bugfix/<slug>` — bug fixes (e.g. `bugfix/audio-crash`)
   - `update/<slug>` — updates or refactors (e.g. `update/deps`)
   - `release/<slug>` — release prep (e.g. `release/1.0.0`)
   - Use lowercase letters, numbers, dots, underscores, hyphens only.

2. **Open a PR into `development`** (not `main`). Get review and merge to `development`.

3. **When ready for production**, open a PR **from `development` to `main`**. After merge, `main` is the production branch.

**One-time setup:** Install Git hooks so branch names are validated on commit: see [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md#2-git-hooks-one-time-all-contributors).

## Contributing

This is a prototype project for educational purposes.
