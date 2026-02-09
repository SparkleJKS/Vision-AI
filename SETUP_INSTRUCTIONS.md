# VisionAI Setup Instructions

Complete setup guide for VisionAI: an assistive app for the visually impaired with real-time camera scanning, ML-powered object detection, and audio feedback.

## 🏗️ Architecture

- **Frontend**: React Native with **Expo** (SDK 54), **TypeScript**, **NativeWind** (Tailwind CSS)
- **Backend**: Django REST API (to be added in `backend/`)
- **Models**: ML models (to be added in `models/`)
- **Database**: SQLite for development (when backend is added)

## Prerequisites

### Required

- **Node.js** (v18 or higher) — [nodejs.org](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git**
- **Expo Go** app on your phone (for mobile testing)

### Optional

- **Python 3.8+** — for backend when added
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

## 3. Frontend setup (Expo / React Native)

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
npx expo start
```

### Run the app

- **Web**: In the Expo terminal press `w`, or open the URL shown (e.g. `http://localhost:8081`).
- **Mobile**: Scan the QR code with Expo Go (same Wi‑Fi as your machine).
- **Android emulator**: Press `a` in the terminal (requires Android Studio).
- **iOS simulator** (macOS only): Press `i` in the terminal (requires Xcode).

### Frontend tech stack

- **Expo** SDK 54
- **TypeScript**
- **NativeWind** (Tailwind for React Native) — use `className` on React Native components
- **React Native Reanimated** & **Safe Area Context**

---

## 4. Backend setup (Django) — when added

The `backend/` folder is a placeholder. When the Django backend is added, use steps like these:

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

### Database

```bash
python manage.py migrate
python manage.py createsuperuser   # optional, for admin
```

### Run backend

```bash
python manage.py runserver
```

Backend will run at `http://localhost:8000` (or as configured).

### Environment variables (when added)

Create `backend/.env` as needed, for example:

```env
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOW_ALL_ORIGINS=True
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
  npx expo start -c
  ```

- **Node version**  
  Use Node 18+ and ensure `node` and `npm` are on your PATH.

- **Expo Go not connecting**  
  Ensure phone and computer are on the same Wi‑Fi and that no firewall is blocking the dev server port.

### Backend (when added)

- **Port 8000 in use**  
  Change port: `python manage.py runserver 8001`  
  Or (Windows) find and stop the process using port 8000.

### Git hooks not running

- Confirm: `git config core.hooksPath` shows `.githooks`.
- On Windows, ensure Node is installed (pre-commit uses the Node script).

---

## 7. Production (future)

- **Backend**: Use a production WSGI/ASGI server (e.g. Gunicorn), PostgreSQL, and env-based config.
- **Frontend**: Use EAS Build or equivalent for production builds:  
  `npx expo build:android` / `npx expo build:ios` (or EAS CLI).
- **API**: Point the app to the production API URL via environment or config.

---

## 8. Summary

| Task              | Command (from repo root)     |
|-------------------|------------------------------|
| Install frontend  | `cd frontend && npm install`  |
| Start app         | `npm start`                   |
| Android           | `npm run android`             |
| iOS               | `npm run ios`                 |
| Web               | `npm run web`                 |
| Git hooks         | `git config core.hooksPath .githooks` |

For more on the project and branching workflow, see [README.md](README.md).
