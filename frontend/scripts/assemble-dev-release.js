const path = require('path');
const { execSync } = require('child_process');

const androidDir = path.join(__dirname, '..', 'android');
const isWin = process.platform === 'win32';
const gradlew = isWin ? 'gradlew.bat' : './gradlew';

// arm64 only - covers most phones (2017+). Saves ~15MB vs armeabi-v7a+arm64
const architectures = 'arm64-v8a';

console.log('Building dev release APK (assembleDevRelease) for real devices only...\n');
execSync(`${gradlew} assembleDevRelease -PreactNativeArchitectures=${architectures}`, {
  cwd: androidDir,
  stdio: 'inherit',
});
console.log('\nAPK output: android/app/build/outputs/apk/dev/release/app-dev-release.apk');
