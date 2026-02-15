import { Platform } from 'react-native';
import Config from 'react-native-config';

const DEFAULT_HOST = Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';
const DEFAULT_PORT = '8000';

export const API_BASE_URL =
  Config.API_URL ?? `http://${DEFAULT_HOST}:${DEFAULT_PORT}`;
