import { NativeModules } from 'react-native';
import type { VoiceAssistantNativeModule } from './types';

export function getVoiceAssistantModule():
  | VoiceAssistantNativeModule
  | undefined {
  return NativeModules?.VoiceAssistantModule as
    | VoiceAssistantNativeModule
    | undefined;
}
