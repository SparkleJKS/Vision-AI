#!/usr/bin/env node
/**
 * Cleans the Android build (gradlew clean).
 * Use before a fresh install when you hit build cache issues.
 */
const { execSync } = require('child_process');
const path = require('path');

const androidDir = path.join(__dirname, '..', 'android');
const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';

console.log('Cleaning Android build...\n');
execSync(`${gradlew} clean`, {
  cwd: androidDir,
  stdio: 'inherit',
});
console.log('\nClean complete.');
