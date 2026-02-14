#!/usr/bin/env node
/**
 * Writes android/local.properties with sdk.dir.
 * Run after prebuild to recreate local.properties (SDK path).
 * Uses ANDROID_HOME or ANDROID_SDK_ROOT, or falls back to default Windows path.
 */
const fs = require('fs');
const path = require('path');

const sdkDir =
  process.env.ANDROID_HOME ||
  process.env.ANDROID_SDK_ROOT ||
  (process.platform === 'win32'
    ? path.join(process.env.LOCALAPPDATA || 'C:\\Users\\' + process.env.USERNAME, 'Android', 'Sdk')
    : path.join(process.env.HOME || '~', 'Android', 'Sdk'));

const localPropsPath = path.join(__dirname, '..', 'android', 'local.properties');
const content = `## This file must *NOT* be checked into Version Control Systems,
# as it contains information specific to your local configuration.
#
# Location of the SDK. This is only used by Gradle.
sdk.dir=${sdkDir.replace(/\\/g, '\\\\')}
`;

const dir = path.dirname(localPropsPath);
if (!fs.existsSync(dir)) {
  console.warn('[setup-local-properties] android/ folder not found, skipping.');
  process.exit(0);
}

fs.writeFileSync(localPropsPath, content, 'utf8');
console.log('[setup-local-properties] Wrote android/local.properties with sdk.dir=', sdkDir);
