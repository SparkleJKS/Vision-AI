export type VoiceAssistantNativeModule = {
  isAvailable?: () => Promise<boolean>;
  getNativeBuildTag?: () => Promise<string>;
  startListening?: (localeTag?: string) => Promise<boolean>;
  stopListening?: () => Promise<boolean>;
  destroyRecognizer?: () => Promise<boolean>;
};

export type VoiceResultPayload = {
  text?: string;
  alternatives?: string[];
  isFinal?: boolean;
};

export type VoiceErrorPayload = {
  code?: number;
  message?: string;
};

/**
 * Values emitted by Android `VoiceAssistantModule.emitState` (see
 * `VoiceAssistantModule.kt`: listening, ready, speech, processing, idle,
 * stopped, paused).
 */
export type VoiceRecognizerState =
  | 'idle'
  | 'listening'
  | 'ready'
  | 'speech'
  | 'processing'
  | 'stopped'
  | 'paused';

/** Payload for `voice_assistant_state` DeviceEventEmitter events. */
export type VoiceStatePayload = {
  /** Same strings as {@link VoiceRecognizerState}; typed loosely because the bridge returns `string`. */
  state?: string;
};

export type VoiceAvailability = 'checking' | 'available' | 'unavailable';

const RECOGNIZER_STATES: VoiceRecognizerState[] = [
  'idle',
  'listening',
  'ready',
  'speech',
  'processing',
  'stopped',
  'paused',
];

export function parseVoiceRecognizerState(
  value: unknown,
): VoiceRecognizerState {
  if (typeof value !== 'string') return 'idle';
  return (RECOGNIZER_STATES as string[]).includes(value)
    ? (value as VoiceRecognizerState)
    : 'idle';
}
