import './global.css';
import { View, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MainContainer } from './src/screens/Main';

export default function App() {
  return (
    <GestureHandlerRootView className='flex-1'>
      <SafeAreaProvider>
        <View className="flex-1 bg-screen">
        <MainContainer />
        </View>
        <StatusBar barStyle="light-content" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
