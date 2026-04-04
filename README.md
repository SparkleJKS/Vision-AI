<p align="center">
  <img src="frontend/assets/icon-readme.png" alt="VisionAI Logo" width="128" />
</p>

<h1 align="center">VisionAI</h1>
<p align="center"><strong>Assistive Technology for the Visually Impaired</strong></p>

<p align="center">
  A prototype application that helps blind and visually impaired individuals by providing<br/>
  real-time object descriptions through camera input and text-to-speech output.
</p>

---

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
├── CONTRIBUTING.md   # How to contribute
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

## Detailed setup

See **[SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md)** for:

- Git hooks (branch name validation)
- Backend (FastAPI) setup
- Frontend (React Native CLI) configuration
- Environment variables and troubleshooting

## Contributing

Contributions are welcome. Read **[CONTRIBUTING.md](CONTRIBUTING.md)** for branch and PR workflow, Git hooks, code style (Prettier / TypeScript), detection and model change guidelines, and the minimal detection test checklist.

This project is maintained for educational and research purposes.
