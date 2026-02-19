#!/usr/bin/env node
/**
 * Generates a release keystore for production APK signing.
 * Run once, then add the output path to android/local.properties.
 *
 * Usage: node scripts/generate-release-keystore.js
 *
 * The keystore is created at frontend/android/app/release.keystore (gitignored).
 * Keep backups securely — you need this keystore for all future app updates.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const androidAppDir = path.join(__dirname, '..', 'android', 'app');
const keystorePath = path.join(androidAppDir, 'release.keystore');

const ALIAS = 'visionai-release';
const VALIDITY_DAYS = 10000; // ~27 years
const KEY_ALG = 'RSA';
const KEY_SIZE = 2048;

// Default passwords — change these or pass via env for production
const STORE_PASS = process.env.KEYSTORE_PASSWORD || 'visionai-release';
const KEY_PASS = process.env.KEY_PASSWORD || process.env.KEYSTORE_PASSWORD || 'visionai-release';

// DName for the certificate
const DNAME = 'CN=VisionAI, OU=Mobile, O=VisionAI, L=Unknown, ST=Unknown, C=US';

function getKeytoolPath() {
  const candidates = [
    path.join(process.env['ProgramFiles'] || 'C:\\Program Files', 'Android', 'Android Studio', 'jbr', 'bin', 'keytool.exe'),
    path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Android', 'Android Studio', 'jbr', 'bin', 'keytool.exe'),
    path.join(process.env.HOME || process.env.USERPROFILE, 'Library', 'Java', 'JavaVirtualMachines', '*.jdk', 'Contents', 'Home', 'bin', 'keytool'),
    'keytool',
  ];
  for (const c of candidates) {
    try {
      if (c.includes('*')) continue;
      execSync(`"${c}" -help`, { stdio: 'ignore' });
      return c;
    } catch {
      continue;
    }
  }
  return 'keytool';
}

function main() {
  if (fs.existsSync(keystorePath)) {
    console.log('[generate-release-keystore] release.keystore already exists at:', keystorePath);
    console.log('To regenerate, delete it first.\n');
    printSha256();
    return;
  }

  if (!fs.existsSync(androidAppDir)) {
    console.error('[generate-release-keystore] android/app folder not found.');
    process.exit(1);
  }

  const keytool = getKeytoolPath();
  const cmd = `"${keytool}" -genkeypair -v -keystore "${keystorePath}" -alias ${ALIAS} -keyalg ${KEY_ALG} -keysize ${KEY_SIZE} -validity ${VALIDITY_DAYS} -storepass ${STORE_PASS} -keypass ${KEY_PASS} -dname "${DNAME}"`;

  console.log('[generate-release-keystore] Generating release keystore...\n');
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (e) {
    console.error('[generate-release-keystore] Failed to generate keystore.');
    process.exit(1);
  }

  console.log('\n[generate-release-keystore] Keystore created at:', keystorePath);
  printSha256();
  printLocalPropertiesInstructions();
}

function printSha256() {
  const keytool = getKeytoolPath();
  try {
    const out = execSync(
      `"${keytool}" -list -v -keystore "${keystorePath}" -alias ${ALIAS} -storepass ${STORE_PASS} -keypass ${KEY_PASS}`,
      { encoding: 'utf8' },
    );
    const match = out.match(/SHA256:\s*([\w:]+)/);
    if (match) {
      console.log('\n--- SHA-256 (add to Firebase App Check for production app) ---');
      console.log(match[1]);
      console.log('---\n');
    }
  } catch {
    console.log('Run keytool manually to get SHA-256 for Firebase App Check.');
  }
}

function printLocalPropertiesInstructions() {
  const relPath = path.relative(path.join(__dirname, '..', '..'), keystorePath).replace(/\\/g, '/');
  console.log('--- Add to android/local.properties (or run setup-local-properties with release config) ---');
  console.log(`release.keystore.file=${path.resolve(keystorePath).replace(/\\/g, '/')}`);
  console.log('release.keystore.password=' + STORE_PASS);
  console.log('release.keystore.alias=' + ALIAS);
  console.log('release.keystore.keyPassword=' + KEY_PASS);
  console.log('---');
  console.log('\nBack up the keystore securely. You need it for all future app updates.');
}

main();
