#!/usr/bin/env node
/**
 * Installs the dev debug build on a connected Android device/emulator.
 * Runs adb reverse so the app can connect to Metro bundler on the host.
 * Prerequisite: Start Metro with `npm run start` before launching the app.
 *
 * Usage:
 *   node scripts/install-dev-debug.js        — install only
 *   node scripts/install-dev-debug.js --clean — clean + install (fresh build)
 */
const { execSync } = require('child_process');
const path = require('path');

const androidDir = path.join(__dirname, '..', 'android');
const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
const doClean = process.argv.includes('--clean');

if (doClean) {
  console.log('Cleaning Android build first...\n');
  execSync(`${gradlew} clean`, { cwd: androidDir, stdio: 'inherit' });
  console.log('');
}

// Forward Metro port so emulator can reach host's localhost:8081
try {
  execSync('adb reverse tcp:8081 tcp:8081', { stdio: 'inherit' });
  console.log('adb reverse tcp:8081 tcp:8081 — Metro port forwarded');
} catch (e) {
  console.warn('adb reverse failed (no device/emulator?). Ensure Metro is running and device is connected.');
}

execSync(`${gradlew} installDevDebug`, {
  cwd: androidDir,
  stdio: 'inherit',
});
