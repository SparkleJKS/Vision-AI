import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  DeviceEventEmitter,
  NativeModules,
  PermissionsAndroid,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import Tts from 'react-native-tts';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenNames } from '@/configs/navigation';
import { useTheme } from '@/theme';
import { logEvent, warn } from '@/utils/logger';

const BAR_COUNT = 8;
const BAR_MIN = 0.15;
const BAR_MAX = 1;
const LOG_NAME = 'VoiceModeAssistant';
const EVENT_RESULT = 'voice_assistant_result';
const EVENT_ERROR = 'voice_assistant_error';
const EVENT_STATE = 'voice_assistant_state';
const RECOVERABLE_ERROR_CODES = new Set<number>([
  1, // ERROR_NETWORK_TIMEOUT
  2, // ERROR_NETWORK
  6, // ERROR_SPEECH_TIMEOUT
  7, // ERROR_NO_MATCH
  8, // ERROR_RECOGNIZER_BUSY
]);

const HELP_RESPONSE =
  'Try commands like start object detection, open OCR, open QR scanner, open text to speech, go home, open settings, open alerts, or stop listening.';

type VoiceAssistantNativeModule = {
  isAvailable?: () => Promise<boolean>;
  getNativeBuildTag?: () => Promise<string>;
  startListening?: (localeTag?: string) => Promise<boolean>;
  stopListening?: () => Promise<boolean>;
  destroyRecognizer?: () => Promise<boolean>;
};

type VoiceResultPayload = {
  text?: string;
  alternatives?: string[];
  isFinal?: boolean;
};

type VoiceErrorPayload = {
  code?: number;
  message?: string;
};

type VoiceStatePayload = {
  state?: string;
};

type SoundWaveBarsProps = { isActive: boolean; barColor?: string };
function SoundWaveBars({ isActive, barColor = '#6366F1' }: SoundWaveBarsProps) {
  const bars = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(BAR_MIN)),
  ).current;

  useEffect(() => {
    if (!isActive) {
      bars.forEach(bar => bar.setValue(BAR_MIN));
      return;
    }

    const STAGGER_MS = 60;
    const DURATION_MS = 120;

    const waveForward = Animated.parallel(
      bars.map((bar, index) =>
        Animated.sequence([
          Animated.delay(index * STAGGER_MS),
          Animated.timing(bar, {
            toValue: BAR_MAX,
            useNativeDriver: true,
            duration: DURATION_MS,
          }),
        ]),
      ),
    );

    const waveBack = Animated.parallel(
      bars.map((bar, index) =>
        Animated.sequence([
          Animated.delay((BAR_COUNT - 1 - index) * STAGGER_MS),
          Animated.timing(bar, {
            toValue: BAR_MIN,
            useNativeDriver: true,
            duration: DURATION_MS,
          }),
        ]),
      ),
    );

    const loop = Animated.loop(Animated.sequence([waveForward, waveBack]), {
      iterations: -1,
    });
    loop.start();
    return () => loop.stop();
  }, [bars, isActive]);

  return (
    <View className="flex-row items-center justify-center gap-1.5 mb-1 h-7">
      {bars.map((bar, index) => {
        const scaleY = bar.interpolate({
          inputRange: [0, 1],
          outputRange: [0.12, 1],
        });
        const translateY = bar.interpolate({
          inputRange: [0, 1],
          outputRange: [11, 0],
        });
        return (
          <View
            key={`bar-${index}`}
            className="w-1 h-6 items-center justify-end">
            <Animated.View
              className="w-1 h-6 rounded-sm"
              style={{
                backgroundColor: barColor,
                transform: [{ scaleY }, { translateY }],
              }}
            />
          </View>
        );
      })}
    </View>
  );
}

const voiceAssistantModule = NativeModules?.VoiceAssistantModule as
  | VoiceAssistantNativeModule
  | undefined;

const normalizeCommand = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const includesAny = (text: string, phrases: string[]): boolean => {
  return phrases.some(phrase => text.includes(phrase));
};

const isObjectDetectionCommand = (text: string): boolean => {
  if (
    includesAny(text, [
      'start object detection',
      'open object detection',
      'object detection',
      'detect objects',
      'start detection',
    ])
  ) {
    return true;
  }

  return (
    (text.includes('object') || text.includes('objects')) &&
    (text.includes('detect') || text.includes('detection'))
  );
};

const VoiceScreen = () => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const accent = theme.tabVoice;

  const [voiceAvailability, setVoiceAvailability] = useState<
    'checking' | 'available' | 'unavailable'
  >('checking');
  const [isAssistantEnabled, setIsAssistantEnabled] = useState(false);
  const [recognizerState, setRecognizerState] = useState('idle');
  const [heardText, setHeardText] = useState('');
  const [assistantReply, setAssistantReply] = useState('');
  const [nativeBuildTag, setNativeBuildTag] = useState<string | null>(null);

  const assistantEnabledRef = useRef<boolean>(false);
  const ttsReadyRef = useRef<boolean>(false);
  const speakingRef = useRef<boolean>(false);
  const resumeListeningAfterSpeechRef = useRef<boolean>(false);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    assistantEnabledRef.current = isAssistantEnabled;
  }, [isAssistantEnabled]);

  const stopRecognizerSession = useCallback(async () => {
    if (!voiceAssistantModule?.stopListening) return;
    try {
      await voiceAssistantModule.stopListening();
    } catch {
      // Intentionally ignore stop errors when shutting down sessions.
    }
  }, []);

  const startRecognizerSession = useCallback(async () => {
    if (!assistantEnabledRef.current) return;
    if (
      voiceAvailability !== 'available' ||
      !voiceAssistantModule?.startListening
    )
      return;

    try {
      await voiceAssistantModule.startListening('en-US');
      setRecognizerState('listening');
    } catch (error) {
      warn(LOG_NAME, 'Failed to start recognizer session', error);
      setRecognizerState('idle');
      const detail =
        error instanceof Error && error.message ? ` (${error.message})` : '';
      setAssistantReply(`Unable to start speech recognition${detail}.`);
    }
  }, [voiceAvailability]);

  const scheduleRecognizerRestart = useCallback(
    (delayMs: number = 350) => {
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      restartTimerRef.current = setTimeout(() => {
        restartTimerRef.current = null;
        if (!assistantEnabledRef.current || speakingRef.current) return;
        void startRecognizerSession();
      }, delayMs);
    },
    [startRecognizerSession],
  );

  const speakReply = useCallback(
    async (text: string, restartAfterSpeech: boolean) => {
      setAssistantReply(text);

      if (!ttsReadyRef.current) {
        if (restartAfterSpeech) scheduleRecognizerRestart(200);
        return;
      }

      resumeListeningAfterSpeechRef.current =
        restartAfterSpeech && assistantEnabledRef.current;
      await stopRecognizerSession();
      void Tts.stop()
        .catch(() => undefined)
        .finally(() => {
          Tts.speak(text);
        });
    },
    [scheduleRecognizerRestart, stopRecognizerSession],
  );

  const deactivateAssistant = useCallback(async () => {
    assistantEnabledRef.current = false;
    setIsAssistantEnabled(false);
    setRecognizerState('idle');
    resumeListeningAfterSpeechRef.current = false;
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    await stopRecognizerSession();
  }, [stopRecognizerSession]);

  const navigateAndConfirm = useCallback(
    async (message: string, action: () => void) => {
      await deactivateAssistant();
      action();
      await speakReply(message, false);
    },
    [deactivateAssistant, speakReply],
  );

  const executeCommand = useCallback(
    async (rawTranscript: string) => {
      const normalized = normalizeCommand(rawTranscript);
      setHeardText(rawTranscript);

      if (!normalized) {
        await speakReply('I did not catch that. Please repeat.', true);
        return;
      }

      if (
        includesAny(normalized, [
          'stop listening',
          'stop assistant',
          'stop voice',
          'goodbye',
          'exit voice',
        ])
      ) {
        await deactivateAssistant();
        await speakReply('Voice assistant stopped.', false);
        return;
      }

      if (
        includesAny(normalized, [
          'help',
          'what can you do',
          'show commands',
          'available commands',
        ])
      ) {
        await speakReply(HELP_RESPONSE, true);
        return;
      }

      if (
        includesAny(normalized, [
          'what time',
          'current time',
          'tell me the time',
          'time now',
        ])
      ) {
        const currentTime = new Date().toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
        });
        await speakReply(`The time is ${currentTime}.`, true);
        return;
      }

      if (includesAny(normalized, ['go back', 'back'])) {
        if (navigation.canGoBack?.()) {
          await navigateAndConfirm('Going back.', () => {
            navigation.goBack();
          });
        } else {
          await speakReply('There is no previous screen to go back to.', true);
        }
        return;
      }

      if (isObjectDetectionCommand(normalized)) {
        await navigateAndConfirm(
          'Opening object detection and starting detection.',
          () => {
            navigation.navigate(ScreenNames.Explore, {
              screen: ScreenNames.ExploreObjectDetection,
              params: { autoStart: true },
            });
          },
        );
        return;
      }

      if (
        includesAny(normalized, [
          'open qr',
          'start qr',
          'qr scanner',
          'scan qr',
          'scan code',
        ])
      ) {
        await navigateAndConfirm('Opening QR scanner.', () => {
          navigation.navigate(ScreenNames.Explore, {
            screen: ScreenNames.ExploreQrScanner,
          });
        });
        return;
      }

      if (
        includesAny(normalized, [
          'open ocr',
          'start ocr',
          'read text',
          'text recognition',
        ])
      ) {
        await navigateAndConfirm('Opening OCR screen.', () => {
          navigation.navigate(ScreenNames.Explore, {
            screen: ScreenNames.ExploreOcr,
          });
        });
        return;
      }

      if (
        includesAny(normalized, [
          'text to speech',
          'open tts',
          'tts',
          'open speech',
        ])
      ) {
        await navigateAndConfirm('Opening text to speech.', () => {
          navigation.navigate(ScreenNames.Explore, {
            screen: ScreenNames.ExploreTts,
          });
        });
        return;
      }

      if (includesAny(normalized, ['go home', 'open home', 'home tab'])) {
        await navigateAndConfirm('Opening home.', () => {
          navigation.navigate(ScreenNames.Home);
        });
        return;
      }

      if (
        includesAny(normalized, ['open explore', 'go to explore', 'explore'])
      ) {
        await navigateAndConfirm('Opening explore.', () => {
          navigation.navigate(ScreenNames.Explore, {
            screen: ScreenNames.Explore,
          });
        });
        return;
      }

      if (
        includesAny(normalized, ['open settings', 'go to settings', 'settings'])
      ) {
        await navigateAndConfirm('Opening settings.', () => {
          navigation.navigate(ScreenNames.Settings, {
            screen: ScreenNames.SettingsList,
          });
        });
        return;
      }

      if (
        includesAny(normalized, [
          'voice and audio settings',
          'open voice and audio',
          'voice settings',
        ])
      ) {
        await navigateAndConfirm('Opening voice and audio settings.', () => {
          navigation.navigate(ScreenNames.Settings, {
            screen: ScreenNames.VoiceAndAudio,
          });
        });
        return;
      }

      if (includesAny(normalized, ['open alerts', 'show alerts', 'alerts'])) {
        await navigateAndConfirm('Opening alerts.', () => {
          navigation.navigate(ScreenNames.Alerts);
        });
        return;
      }

      if (includesAny(normalized, ['open voice', 'voice mode'])) {
        await speakReply('You are already in voice mode.', true);
        return;
      }

      await speakReply(
        'Unsupported command. Say help to hear supported commands.',
        true,
      );
    },
    [deactivateAssistant, navigateAndConfirm, navigation, speakReply],
  );

  const ensureMicrophonePermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return false;

    const permission = PermissionsAndroid.PERMISSIONS.RECORD_AUDIO;
    const hasPermission = await PermissionsAndroid.check(permission);
    if (hasPermission) return true;

    const result = await PermissionsAndroid.request(permission, {
      title: 'Microphone Permission',
      message:
        'VisionAI needs microphone access to listen for voice commands in Voice Mode.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    });
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }, []);

  const startAssistant = useCallback(async () => {
    if (voiceAvailability !== 'available') {
      setAssistantReply('Voice assistant is not available on this device.');
      return;
    }

    if (nativeBuildTag !== 'voice-native-v3') {
      setAssistantReply(
        'Voice module is outdated. Rebuild and reinstall the Android app, then try again.',
      );
      return;
    }

    const hasMicPermission = await ensureMicrophonePermission();
    if (!hasMicPermission) {
      setAssistantReply(
        'Microphone permission is required to start voice mode.',
      );
      warn(LOG_NAME, 'Microphone permission denied for voice assistant.');
      return;
    }

    assistantEnabledRef.current = true;
    setIsAssistantEnabled(true);
    setHeardText('');
    logEvent(`${LOG_NAME}_start`, {});
    await speakReply(
      'Voice assistant is active. Say a command like start object detection.',
      true,
    );
  }, [
    ensureMicrophonePermission,
    nativeBuildTag,
    speakReply,
    voiceAvailability,
  ]);

  const stopAssistant = useCallback(async () => {
    await deactivateAssistant();
    await speakReply('Voice assistant stopped.', false);
    logEvent(`${LOG_NAME}_stop`, {});
  }, [deactivateAssistant, speakReply]);

  const toggleAssistant = useCallback(() => {
    if (isAssistantEnabled) {
      void stopAssistant();
      return;
    }
    void startAssistant();
  }, [isAssistantEnabled, startAssistant, stopAssistant]);

  useEffect(() => {
    let active = true;

    const checkAvailability = async () => {
      if (
        Platform.OS !== 'android' ||
        !voiceAssistantModule?.isAvailable ||
        !voiceAssistantModule?.startListening
      ) {
        if (active) setVoiceAvailability('unavailable');
        return;
      }

      try {
        const available = await voiceAssistantModule.isAvailable();
        if (!active) return;
        if (voiceAssistantModule.getNativeBuildTag) {
          try {
            const buildTag = await voiceAssistantModule.getNativeBuildTag();
            if (!active) return;
            setNativeBuildTag(buildTag);
          } catch (error) {
            warn(
              LOG_NAME,
              'Failed to read native voice module build tag',
              error,
            );
            if (!active) return;
            setNativeBuildTag(null);
          }
        } else {
          setNativeBuildTag(null);
        }
        setVoiceAvailability(available ? 'available' : 'unavailable');
      } catch (error) {
        if (!active) return;
        warn(LOG_NAME, 'Failed to check recognizer availability', error);
        setVoiceAvailability('unavailable');
      }
    };

    void checkAvailability();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const onTtsStart = () => {
      speakingRef.current = true;
    };

    const onTtsComplete = () => {
      speakingRef.current = false;
      if (
        resumeListeningAfterSpeechRef.current &&
        assistantEnabledRef.current &&
        voiceAvailability === 'available'
      ) {
        resumeListeningAfterSpeechRef.current = false;
        void startRecognizerSession();
      }
    };

    const onTtsError = (error: { message?: string; code?: string }) => {
      warn(LOG_NAME, 'TTS error', error?.message ?? error?.code ?? error);
      onTtsComplete();
    };

    const initializeTts = async () => {
      try {
        await Tts.getInitStatus();
        await Tts.setDefaultLanguage('en-US');
        await Tts.setDefaultRate(0.5);
        await Tts.setDefaultPitch(1.0);
        ttsReadyRef.current = true;
      } catch (error) {
        ttsReadyRef.current = false;
        warn(LOG_NAME, 'TTS initialization failed', error);
      }
    };

    const ttsStartSub = Tts.addListener('tts-start', onTtsStart);
    const ttsFinishSub = Tts.addListener('tts-finish', onTtsComplete);
    const ttsCancelSub = Tts.addListener('tts-cancel', onTtsComplete);
    const ttsErrorSub = Tts.addListener('tts-error', onTtsError);
    void initializeTts();

    return () => {
      ttsReadyRef.current = false;
      ttsStartSub.remove();
      ttsFinishSub.remove();
      ttsCancelSub.remove();
      ttsErrorSub.remove();
      void Tts.stop();
    };
  }, [startRecognizerSession, voiceAvailability]);

  useEffect(() => {
    if (voiceAvailability !== 'available') return;

    const resultSub = DeviceEventEmitter.addListener(
      EVENT_RESULT,
      (payload: VoiceResultPayload) => {
        const spokenText =
          typeof payload?.text === 'string' ? payload.text.trim() : '';
        if (!spokenText) return;
        setHeardText(spokenText);

        if (payload?.isFinal) {
          logEvent(`${LOG_NAME}_command_received`, { spokenText });
          void executeCommand(spokenText);
        }
      },
    );

    const stateSub = DeviceEventEmitter.addListener(
      EVENT_STATE,
      (payload: VoiceStatePayload) => {
        if (typeof payload?.state !== 'string') return;
        setRecognizerState(payload.state);
      },
    );

    const errorSub = DeviceEventEmitter.addListener(
      EVENT_ERROR,
      (payload: VoiceErrorPayload) => {
        const code = typeof payload?.code === 'number' ? payload.code : 0;
        const message =
          typeof payload?.message === 'string'
            ? payload.message
            : 'Speech recognition error.';
        warn(LOG_NAME, 'Recognizer error', { code, message });
        setRecognizerState('idle');

        if (code === 9) {
          // ERROR_INSUFFICIENT_PERMISSIONS
          void deactivateAssistant();
          setAssistantReply(
            'Microphone permission is required for voice commands.',
          );
          return;
        }

        if (
          assistantEnabledRef.current &&
          !speakingRef.current &&
          RECOVERABLE_ERROR_CODES.has(code)
        ) {
          scheduleRecognizerRestart();
        } else if (assistantEnabledRef.current) {
          setAssistantReply(message);
        }
      },
    );

    return () => {
      resultSub.remove();
      stateSub.remove();
      errorSub.remove();
    };
  }, [
    deactivateAssistant,
    executeCommand,
    scheduleRecognizerRestart,
    voiceAvailability,
  ]);

  useEffect(() => {
    if (isFocused || !assistantEnabledRef.current) return;
    void deactivateAssistant();
  }, [deactivateAssistant, isFocused]);

  useEffect(() => {
    return () => {
      assistantEnabledRef.current = false;
      resumeListeningAfterSpeechRef.current = false;
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
      }
      void stopRecognizerSession();
      void voiceAssistantModule?.destroyRecognizer?.();
    };
  }, [stopRecognizerSession]);

  const statusText = useMemo(() => {
    if (voiceAvailability === 'checking') return 'CHECKING VOICE SERVICES...';
    if (voiceAvailability === 'unavailable')
      return 'VOICE ASSISTANT UNAVAILABLE';
    if (!isAssistantEnabled) return 'TAP TO START ASSISTANT';
    if (recognizerState === 'speech') return 'HEARING SPEECH...';
    if (recognizerState === 'processing') return 'PROCESSING COMMAND...';
    if (recognizerState === 'ready') return 'READY FOR COMMAND';
    if (recognizerState === 'listening') return 'LISTENING...';
    return 'LISTENING...';
  }, [isAssistantEnabled, recognizerState, voiceAvailability]);

  return (
    <View
      className="flex-1 items-center"
      style={{ paddingTop: insets.top, backgroundColor: theme.screenBg }}>
      <View className="items-center mt-16">
        <Text
          className="text-[28px] font-extrabold tracking-tight mb-2"
          style={{ color: theme.white }}>
          Voice Mode
        </Text>
      </View>

      <View className="flex-1 items-center justify-center px-6">
        <TouchableOpacity
          className="w-40 h-40 rounded-full mb-7 border-2 justify-center items-center"
          style={{
            backgroundColor: isAssistantEnabled ? `${accent}12` : theme.cardBg,
            borderColor: isAssistantEnabled ? accent : `${accent}35`,
          }}
          activeOpacity={0.9}
          onPress={toggleAssistant}>
          <Ionicons name="mic" size={64} color={accent} />
        </TouchableOpacity>

        <SoundWaveBars isActive={isAssistantEnabled} barColor={accent} />

        <Text
          className="text-[13px] font-bold tracking-widest mb-8 text-center"
          style={{ color: isAssistantEnabled ? accent : theme.white }}>
          {statusText}
        </Text>

        <TouchableOpacity
          className="rounded-[14px] py-4 px-7 min-w-[260px] flex-row items-center justify-center gap-2.5 border"
          style={{
            backgroundColor: isAssistantEnabled ? accent : theme.cardBg,
            borderColor: isAssistantEnabled ? 'transparent' : `${accent}40`,
          }}
          activeOpacity={0.8}
          onPress={toggleAssistant}
          disabled={voiceAvailability === 'checking'}>
          <Ionicons
            name={isAssistantEnabled ? 'stop-circle' : 'mic'}
            size={24}
            color={isAssistantEnabled ? theme.white : accent}
          />
          <Text
            className="text-[15px] font-bold"
            style={{ color: isAssistantEnabled ? theme.white : accent }}>
            {isAssistantEnabled ? 'Stop Assistant' : 'Start Assistant'}
          </Text>
        </TouchableOpacity>

        <View className="mt-5 min-h-[68px] max-w-[330px]">
          <Text
            className="text-center text-[12px] leading-5"
            style={{ color: theme.grey }}>
            {heardText ? `Heard: "${heardText}"` : assistantReply}
          </Text>
        </View>

        <View className="mt-1 max-w-[330px]">
          <Text
            className="text-center text-[11px] leading-5"
            style={{ color: theme.muted }}>
            Example: "Start object detection"
          </Text>
        </View>
      </View>
    </View>
  );
};

export default VoiceScreen;
