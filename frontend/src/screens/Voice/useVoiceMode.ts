import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DeviceEventEmitter, Platform } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import Tts from 'react-native-tts';
import { ensureMicrophonePermission } from '@/permissions';
import { logEvent, warn } from '@/utils/logger';
import {
  EVENT_ERROR,
  EVENT_RESULT,
  EVENT_STATE,
  EXPECTED_NATIVE_BUILD_TAG,
  LOG_NAME,
  RECOVERABLE_ERROR_CODES,
  executeVoiceIntent,
  getVoiceAssistantModule,
  getVoiceStatusLabel,
  normalizeCommand,
  parseVoiceRecognizerState,
  resolveVoiceIntent,
} from './voice';
import type {
  VoiceAvailability,
  VoiceErrorPayload,
  VoiceNavigationAdapter,
  VoiceRecognizerState,
  VoiceResultPayload,
  VoiceStatePayload,
} from './voice';

export const useVoiceMode = () => {
  const isFocused = useIsFocused();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const voiceAssistantModule = useMemo(() => getVoiceAssistantModule(), []);

  const navigationAdapter = useMemo<VoiceNavigationAdapter>(
    () => ({
      navigate: (name, params) => {
        // Root param list is heterogeneous; voice commands only use known tab routes.
        (navigation as { navigate: (n: string, p?: object) => void }).navigate(
          name,
          params,
        );
      },
      goBack: () => navigation.goBack(),
      canGoBack: () => navigation.canGoBack(),
    }),
    [navigation],
  );

  const [voiceAvailability, setVoiceAvailability] =
    useState<VoiceAvailability>('checking');
  const [isAssistantEnabled, setIsAssistantEnabled] = useState<boolean>(false);
  const [recognizerState, setRecognizerState] =
    useState<VoiceRecognizerState>('idle');
  const [heardText, setHeardText] = useState<string>('');
  const [assistantReply, setAssistantReply] = useState<string>('');
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
  }, [voiceAssistantModule]);

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
  }, [voiceAssistantModule, voiceAvailability]);

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

  const runCommand = useCallback(
    async (rawTranscript: string) => {
      const normalized = normalizeCommand(rawTranscript);
      setHeardText(rawTranscript);
      const intent = resolveVoiceIntent(normalized);
      await executeVoiceIntent(intent, {
        navigation: navigationAdapter,
        speakReply,
        navigateAndConfirm,
        deactivateAssistant,
      });
    },
    [deactivateAssistant, navigateAndConfirm, navigationAdapter, speakReply],
  );

  const startAssistant = useCallback(async () => {
    if (voiceAvailability !== 'available') {
      setAssistantReply('Voice assistant is not available on this device.');
      return;
    }

    if (nativeBuildTag !== EXPECTED_NATIVE_BUILD_TAG) {
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
  }, [nativeBuildTag, speakReply, voiceAvailability]);

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
  }, [voiceAssistantModule]);

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
          void runCommand(spokenText);
        }
      },
    );

    const stateSub = DeviceEventEmitter.addListener(
      EVENT_STATE,
      (payload: VoiceStatePayload) => {
        setRecognizerState(parseVoiceRecognizerState(payload?.state));
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
    runCommand,
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
  }, [stopRecognizerSession, voiceAssistantModule]);

  const statusText = useMemo(
    () =>
      getVoiceStatusLabel(
        voiceAvailability,
        isAssistantEnabled,
        recognizerState,
      ),
    [isAssistantEnabled, recognizerState, voiceAvailability],
  );

  return {
    voiceAvailability,
    isAssistantEnabled,
    heardText,
    assistantReply,
    statusText,
    toggleAssistant,
  };
};
