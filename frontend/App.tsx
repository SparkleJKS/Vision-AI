import './global.css';
import { useEffect } from 'react';
import { View, StatusBar, AppState, type AppStateStatus } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { AuthProvider } from './src/auth/AuthContext';
import { MainContainer } from './src/screens/Main';
import { store } from './src/store';
import { logApp } from './src/utils/logger';

export default function App() {
  useEffect(() => {
    logApp('ready', { mounted: true });
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'background') {
        logApp('exit', { state: 'background', timestamp: new Date().toISOString() });
      } else if (nextState === 'active') {
        logApp('resume', { state: 'active', timestamp: new Date().toISOString() });
      }
    });
    return () => sub.remove();
  }, []);

  return (
    <Provider store={store}>
      <GestureHandlerRootView className="flex-1">
        <SafeAreaProvider>
          <AuthProvider>
            <View className="flex-1 bg-screen">
              <MainContainer />
            </View>
            <StatusBar barStyle="light-content" />
          </AuthProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </Provider>
  );
}
