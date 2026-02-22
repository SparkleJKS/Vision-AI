/**
 * Generates android/app/google-services.json from .env (react-native-config).
 * Run before any Android build so the Google Services plugin finds the file.
 * Keeps Firebase/Google keys in .env only; no google-services.json in repo.
 */

const fs = require('fs');
const path = require('path');

const frontendRoot = path.join(__dirname, '..');
const envPath = path.join(frontendRoot, '.env');
const outPath = path.join(frontendRoot, 'android', 'app', 'google-services.json');

function loadEnv() {
  const env = {};
  if (!fs.existsSync(envPath)) {
    console.warn('scripts/generate-google-services.js: .env not found, skipping google-services.json generation');
    return null;
  }
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eq = trimmed.indexOf('=');
      if (eq > 0) {
        const key = trimmed.slice(0, eq).trim();
        let value = trimmed.slice(eq + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        env[key] = value;
      }
    }
  });
  return env;
}

function required(env, key) {
  const v = env[key];
  if (!v || v.includes('YOUR_') || v === '') {
    console.error(`Missing or placeholder .env: ${key}. Add it for Firebase/Google Services.`);
    process.exit(1);
  }
  return v;
}

function optional(env, key, fallback = '') {
  const v = env[key];
  if (!v || v.includes('YOUR_')) return fallback;
  return v;
}

function main() {
  const env = loadEnv();
  if (!env) process.exit(0);

  const projectNumber = required(env, 'FIREBASE_PROJECT_NUMBER');
  const projectId = required(env, 'FIREBASE_PROJECT_ID');
  const storageBucket = optional(env, 'FIREBASE_STORAGE_BUCKET', `${projectId}.firebasestorage.app`);
  const apiKey = required(env, 'FIREBASE_API_KEY');
  const mobileSdkAppId = required(env, 'FIREBASE_MOBILE_SDK_APP_ID');
  const mobileSdkAppIdDev = required(env, 'FIREBASE_MOBILE_SDK_APP_ID_DEV');
  const webClientId = required(env, 'GOOGLE_WEB_CLIENT_ID');
  const oauthAndroidClientId = optional(env, 'FIREBASE_OAUTH_ANDROID_CLIENT_ID', '');
  const oauthAndroidClientIdDev = optional(env, 'FIREBASE_OAUTH_ANDROID_CLIENT_ID_DEV', '');
  const debugSha1 = optional(env, 'FIREBASE_DEBUG_CERTIFICATE_SHA1', '');

  const payload = {
    project_info: {
      project_number: projectNumber,
      project_id: projectId,
      storage_bucket: storageBucket,
    },
    client: [
      {
        client_info: {
          mobilesdk_app_id: mobileSdkAppId,
          android_client_info: { package_name: 'com.anonymous.VisionAI' },
        },
        oauth_client: [
          ...(oauthAndroidClientId && debugSha1
            ? [
              {
                client_id: oauthAndroidClientId,
                client_type: 1,
                android_info: {
                  package_name: 'com.anonymous.VisionAI',
                  certificate_hash: debugSha1,
                },
              },
            ]
            : []),
          { client_id: webClientId, client_type: 3 },
        ],
        api_key: [{ current_key: apiKey }],
        services: {
          appinvite_service: {
            other_platform_oauth_client: [{ client_id: webClientId, client_type: 3 }],
          },
        },
      },
      {
        client_info: {
          mobilesdk_app_id: mobileSdkAppIdDev,
          android_client_info: { package_name: 'com.anonymous.VisionAI.dev' },
        },
        oauth_client: [
          ...(oauthAndroidClientIdDev && debugSha1
            ? [
              {
                client_id: oauthAndroidClientIdDev,
                client_type: 1,
                android_info: {
                  package_name: 'com.anonymous.VisionAI.dev',
                  certificate_hash: debugSha1,
                },
              },
            ]
            : []),
          { client_id: webClientId, client_type: 3 },
        ],
        api_key: [{ current_key: apiKey }],
        services: {
          appinvite_service: {
            other_platform_oauth_client: [{ client_id: webClientId, client_type: 3 }],
          },
        },
      },
    ],
    configuration_version: '1',
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');
  console.log('Generated android/app/google-services.json from .env');
}

main();
