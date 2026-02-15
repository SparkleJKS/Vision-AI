/**
 * @format
 */

import 'react-native-gesture-handler';
import './ReactotronConfig';
import { AppRegistry } from 'react-native';

import crashlytics from '@react-native-firebase/crashlytics';
import App from './App';

crashlytics().setCrashlyticsCollectionEnabled(true);

AppRegistry.registerComponent('main', () => App);
