#!/usr/bin/env node
/**
 * Installs the dev debug build on a connected Android device/emulator.
 */
const { execSync } = require('child_process');
const path = require('path');

const androidDir = path.join(__dirname, '..', 'android');
const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';

execSync(`${gradlew} installDevDebug`, {
  cwd: androidDir,
  stdio: 'inherit',
});
