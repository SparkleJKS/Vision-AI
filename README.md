# VisionAI - Assistive Technology for the Visually Impaired

A prototype application that helps blind and visually impaired individuals by providing real-time object descriptions through camera input and text-to-speech output.

## Features

- **Real-time camera object detection** — on-device (TFLite/ONNX) or server fallback
- **Firebase Auth** — email/password and Google Sign-In
- **React Native CLI** mobile app with **TypeScript** and **Tailwind (NativeWind)**
- **FastAPI** backend API (Python) — `POST /v1/detect` for server-side inference
- **Reactotron** — dev logging and debugging

## Project Structure

```
VisionAI/
├── frontend/         # React Native CLI app (TypeScript, NativeWind)
├── backend/          # FastAPI backend (Python)
├── models/           # ML models (to be added)
├── .githooks/        # Git hooks (branch name validation)
├── .github/          # CI workflows
├── package.json      # Root scripts (runs frontend commands)
├── README.md
└── SETUP_INSTRUCTIONS.md
```

## Quick Start

### Prerequisites

- **Node.js** (v18+)
- **Python 3.10+** (for backend)
- **Android Studio** / **Xcode** (for emulator/device builds; optional)

### Run the app (frontend only)

From the **repo root**:

```bash
npm install          # only if you need root deps (optional)
npm start            # starts Metro bundler
npm run android      # Android
npm run ios          # iOS (macOS only)
```

Or from the **frontend** folder:

```bash
cd frontend
npm install
npm start
```


### Android dev build (physical device / emulator)

To build and install the **dev debug** app on a connected Android device or emulator:

```bash
npm run android:install-dev
```

(From repo root; or `cd frontend && npm run android:install-dev`)

Or from the Android project directory: `cd frontend/android` then `./gradlew installDevDebug` (macOS/Linux) or `gradlew.bat installDevDebug` (Windows). That builds and installs the dev variant (app id: `com.anonymous.VisionAI.dev`). If the build fails with "SDK location not found", run `npm run prebuild` from `frontend/`—the postprebuild script recreates `local.properties` automatically. See [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md#prebuild-and-localproperties) for details.

### Android release APK (shareable build)

To build a **release APK** for real devices (arm64 only, smaller size):

```bash
npm run android:apk
```

(From repo root; or `cd frontend && npm run android:apk`). Output: `frontend/android/app/build/outputs/apk/dev/release/app-dev-release.apk`. Use `android:install-dev` for emulator (includes x86).

**NDK:** The project is pinned to **NDK 26.1.10909125**. Install it via **Android Studio -> SDK Manager -> SDK Tools** -> "Show Package Details" -> **NDK** -> **26.1.10909125** -> Apply. If only NDK 27 is installed, the native build can fail with undefined C++ symbol errors. A patched React Native header (`graphicsConversions.h`) is applied automatically (via `patch-package` and the app's Gradle/CMake setup) for NDK 26 compatibility.

### Backend (FastAPI)

From the **backend** folder:

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs at `http://localhost:8000`.

**Endpoints:** `GET /health` | `POST /v1/describe` | `POST /v1/detect` (multipart form field `file`)

**Example:**
```bash
curl -X POST "http://localhost:8000/v1/detect" -F "file=@path/to/image.jpg"
```

See [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md) for environment variables and detailed backend setup.

## Detection Runtime Notes (Developers)

- `TFLite` is the default runtime because it is typically the lowest-latency, lowest-power path on mobile (GPU/NNAPI/XNNPACK delegates).
- Server fallback is only used when on-device runtimes are unavailable or fail at load/inference time.
- Swap models safely by following this sequence:
  1. Keep model binaries out of git-tracked paths (or explicitly update `.gitignore` rules first).
  2. Match model IO contracts (`inputResolution`, YOLOv8-style outputs: `bbox + class + confidence`).
  3. Update model asset references in `frontend/src/lib/modelManager.js`.
  4. Unload/reload runtime (`modelManager.unload()` then `modelManager.loadRuntime(...)`) so native sessions are recreated cleanly.
  5. Re-run the checklist below before merging.

## Minimal Detection Test Checklist

- [ ] Camera permission denied path shows a clear runtime error and detection does not start.
- [ ] Start/Stop detection toggles the inference loop without app freeze/crash.
- [ ] Runtime fallback chain works: `TFLite -> ONNX -> Server` when failures are forced.
- [ ] Confidence threshold and NMS toggle change prediction counts as expected.
- [ ] Snapshot capture works while detection is running.
- [ ] FPS and inference latency values update continuously under load.

## Detailed setup

See **[SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md)** for:

- Git hooks (branch name validation)
- Backend (FastAPI) setup
- Frontend (React Native CLI) configuration
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
