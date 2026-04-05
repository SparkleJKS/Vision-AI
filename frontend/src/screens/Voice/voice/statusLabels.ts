import type { VoiceAvailability, VoiceRecognizerState } from './types';

export const getVoiceStatusLabel = (
  voiceAvailability: VoiceAvailability,
  isAssistantEnabled: boolean,
  recognizerState: VoiceRecognizerState,
): string => {
  if (voiceAvailability === 'checking') return 'CHECKING VOICE SERVICES...';
  if (voiceAvailability === 'unavailable') return 'VOICE ASSISTANT UNAVAILABLE';
  if (!isAssistantEnabled) return 'TAP TO START ASSISTANT';
  if (recognizerState === 'speech') return 'HEARING SPEECH...';
  if (recognizerState === 'processing') return 'PROCESSING COMMAND...';
  if (recognizerState === 'ready') return 'READY FOR COMMAND';
  if (recognizerState === 'listening') return 'LISTENING...';
  if (recognizerState === 'stopped') return 'MIC STOPPED';
  if (recognizerState === 'paused') return 'PAUSED';
  if (recognizerState === 'idle') return 'READY FOR COMMAND';
  return 'LISTENING...';
};
