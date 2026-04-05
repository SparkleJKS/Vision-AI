import { NativeModules } from 'react-native';
import type { VoiceAssistantNativeModule } from './types';

export const getVoiceAssistantModule = ():
  | VoiceAssistantNativeModule
  | undefined => {
  return NativeModules?.VoiceAssistantModule as
    | VoiceAssistantNativeModule
    | undefined;
};
