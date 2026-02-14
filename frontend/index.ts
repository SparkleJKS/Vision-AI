import 'react-native-gesture-handler';
import './ReactotronConfig';
import { registerRootComponent } from 'expo';

import App from './App';

// Initialize Firebase Crashlytics (only available in dev/production builds, not Expo Go)
try {
  const crashlytics = require('@react-native-firebase/crashlytics').default;
  crashlytics().setCrashlyticsCollectionEnabled(true);
} catch {
  // Firebase native modules not available (e.g. Expo Go)
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
