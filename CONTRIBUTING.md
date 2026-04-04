# Contributing to VisionAI

Thank you for your interest in improving VisionAI. This document describes how to set up your environment, follow branch and PR conventions, and what to verify before submitting changes.

## Project context

VisionAI is a prototype assistive app (React Native + optional FastAPI backend). For full install steps, environment variables, Firebase, and troubleshooting, see **[SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md)**.

## Branch and pull request workflow

1. **Create a branch** with a name that matches the Git hook rules (see [Git hooks](#git-hooks-one-time)):
   - `feature/<slug>` — new features (e.g. `feature/camera-settings`)
   - `bugfix/<slug>` — bug fixes (e.g. `bugfix/audio-crash`)
   - `update/<slug>` — updates or refactors (e.g. `update/deps`)
   - `release/<slug>` — release preparation (e.g. `release/1.0.0`)
   - Also allowed: `develop`, `HEAD`
   - Use lowercase letters, numbers, dots, underscores, and hyphens only in the slug.

2. **Open a pull request into `development`** (not `main`). Request review and merge into `development` when approved.

3. **Production releases:** When ready, open a PR **from `development` into `main`**. After merge, `main` reflects the production line.

## Git hooks (one-time)

Branch names are validated on commit. Configure hooks from the **repository root**:

**Windows (PowerShell):**

```powershell
git config core.hooksPath .githooks
```

**macOS / Linux:**

```bash
git config core.hooksPath .githooks
chmod +x .githooks/pre-commit .githooks/pre-commit-bash.sh .githooks/pre-commit-node.js
```

Details: [SETUP_INSTRUCTIONS.md § Git hooks](SETUP_INSTRUCTIONS.md#2-git-hooks-one-time).

## Code style and checks

- **Frontend** (`frontend/`): TypeScript and JavaScript. Run from `frontend/`:
  - `npm run format` — format with Prettier
  - `npm run format:check` — verify formatting (CI-friendly)
  - `npm run type-check` — TypeScript without emit
- Match existing patterns (NativeWind, navigation, Redux) and avoid unrelated drive-by refactors in the same PR.

## Detection runtime (developers)

- **TFLite** is the default on-device path (GPU / NNAPI / XNNPACK delegates) for latency and power.
- **Server** fallback is used when on-device runtimes are unavailable or fail at load or inference time.

When changing models or runtime behavior:

1. Keep large binaries out of tracked paths unless `.gitignore` is updated deliberately.
2. Preserve model IO contracts (`inputResolution`, YOLOv8-style outputs: bbox + class + confidence).
3. Update asset references in `frontend/src/lib/modelManager.js` as needed.
4. Unload and reload the runtime (`modelManager.unload()` then `modelManager.loadRuntime(...)`) so native sessions stay consistent.
5. Run the **minimal detection test checklist** below before merging detection-related PRs.

## Minimal detection test checklist

Use this when your change touches camera, inference, or model loading:

- [ ] Camera permission denied path shows a clear error and detection does not start.
- [ ] Start / stop detection toggles the inference loop without freeze or crash.
- [ ] Runtime fallback chain behaves as expected: TFLite → ONNX → server when lower layers fail.
- [ ] Confidence threshold and NMS changes affect prediction counts as expected.
- [ ] Snapshot capture works while detection is running.
- [ ] FPS and inference latency update sensibly under load.

## Security

Report security issues privately. See **[SECURITY.md](SECURITY.md)**.

## License and scope

This project is maintained for educational and research purposes. By contributing, you agree your contributions can be used under the same terms as the repository license (if one is specified).
