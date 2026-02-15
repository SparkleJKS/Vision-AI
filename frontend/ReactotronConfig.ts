import Reactotron, { ReactotronReactNative } from 'reactotron-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const noop = () => undefined;

const reactotron : ReactotronReactNative = Reactotron.setAsyncStorageHandler(AsyncStorage)
  .configure({
    name: 'VisionAI',
    host: 'localhost',
  })
  .useReactNative({
    asyncStorage: true,
    networking: {
      ignoreUrls: /symbolicate/,
    },
    editor: false,
    errors: { veto: () => false },
    overlay: false,
  })
  .connect();

if (__DEV__) {
  console.tron = reactotron;
} else {
  console.tron = {
    configure: noop,
    connect: noop,
    use: noop,
    useReactNative: noop,
    clear: noop,
    log: noop,
    logImportant: noop,
    display: noop,
    error: noop,
  } as unknown as typeof reactotron;
}

reactotron.onCustomCommand({
  title: 'Show Dev Menu',
  description: 'Shake device or press Cmd+D (iOS) / Cmd+M (Android)',
  command: 'showDevMenu',
  handler: () => {
    Reactotron.log('Shake device or press Cmd+D (iOS) / Cmd+M (Android) to open React Native dev menu');
  },
});

declare global {
  interface Console {
    tron: typeof reactotron;
  }
}

export default reactotron;
