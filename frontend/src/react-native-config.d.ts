declare module 'react-native-config' {
  export interface NativeConfig {
    GOOGLE_WEB_CLIENT_ID?: string;
    API_URL?: string;
  }

  export const Config: NativeConfig;
  export default Config;
}
