/**
 * @format
 */

import 'react-native-gesture-handler';
import './ReactotronConfig';
import { AppRegistry } from 'react-native';

import crashlytics from '@react-native-firebase/crashlytics';
import App from './App';
import { logApp } from './src/utils/logger';

crashlytics().setCrashlyticsCollectionEnabled(true);

logApp('launch', {
  component: 'main',
  initialProps: {},
  fabric: !!global?.nativeFabricUIManager,
  timestamp: new Date().toISOString(),
});

AppRegistry.registerComponent('main', () => App);
