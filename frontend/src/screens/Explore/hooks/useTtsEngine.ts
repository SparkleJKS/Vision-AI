import { useCallback, useEffect, useMemo, useState } from 'react';
import Tts from 'react-native-tts';
import { error, logEvent, warn } from '@/utils/logger';
import { showToast } from '@/utils/toast';

type UseTtsEngineOptions = {
  logName: string;
  language?: string;
  initialRate?: number;
  initialPitch?: number;
  showInitToast?: boolean;
};

export const useTtsEngine = ({
  logName,
  language = 'en-US',
  initialRate = 0.5,
  initialPitch = 1.0,
  showInitToast = true,
}: UseTtsEngineOptions) => {
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [rate, setRate] = useState<number>(initialRate);
  const [pitch, setPitch] = useState<number>(initialPitch);

  useEffect(() => {
    const handleStart = () => {
      setIsSpeaking(true);
      logEvent(`${logName}_tts_start`, {});
    };
    const handleFinish = () => {
      setIsSpeaking(false);
      logEvent(`${logName}_tts_finish`, {});
    };
    const handleCancel = () => {
      setIsSpeaking(false);
      logEvent(`${logName}_tts_cancel`, {});
    };
    const handleError = (err: { message?: string; code?: string }) => {
      setIsSpeaking(false);
      error(logName, 'TTS error', err?.message ?? err?.code ?? err);
      showToast.error(
        'Speech failed',
        'Text-to-speech hit an error. Try again or restart the app.',
      );
    };

    const startSubscription = Tts.addListener('tts-start', handleStart);
    const finishSubscription = Tts.addListener('tts-finish', handleFinish);
    const cancelSubscription = Tts.addListener('tts-cancel', handleCancel);
    const errorSubscription = Tts.addListener('tts-error', handleError);

    const initializeTts = async () => {
      try {
        await Tts.getInitStatus();
        await Tts.setDefaultLanguage(language);
        await Tts.setDefaultRate(initialRate);
        await Tts.setDefaultPitch(initialPitch);
        setIsReady(true);
        logEvent(`${logName}_ready`, { language });
      } catch (e) {
        setIsReady(false);
        warn(logName, 'TTS initialization failed', e);
        if (showInitToast) {
          showToast.error(
            'Voice preview unavailable',
            'Text-to-speech could not start on this device.',
          );
        }
      }
    };

    void initializeTts();

    return () => {
      void Tts.stop();
      startSubscription.remove();
      finishSubscription.remove();
      cancelSubscription.remove();
      errorSubscription.remove();
    };
    // we intentionally run once to avoid re-adding listeners
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isReady) return;
    void Tts.setDefaultRate(rate);
  }, [isReady, rate]);

  useEffect(() => {
    if (!isReady) return;
    void Tts.setDefaultPitch(pitch);
  }, [isReady, pitch]);

  const speak = useCallback(
    (text: string) => {
      const nextText = text.trim();
      if (!nextText || !isReady) {
        if (!isReady) warn(logName, 'Speak pressed while TTS not ready');
        return;
      }
      logEvent(`${logName}_speak`, {
        length: nextText.length,
        rate,
        pitch,
      });
      setIsSpeaking(true);
      void Tts.stop()
        .catch(() => undefined)
        .finally(() => {
          Tts.speak(nextText);
        });
    },
    [isReady, logName, pitch, rate],
  );

  const stop = useCallback(() => {
    logEvent(`${logName}_stop`, {});
    setIsSpeaking(false);
    void Tts.stop();
  }, [logName]);

  const adjustRate = useCallback((delta: number) => {
    setRate(value => {
      const next = Number((value + delta).toFixed(2));
      return Math.min(1, Math.max(0.1, next));
    });
  }, []);

  const adjustPitch = useCallback((delta: number) => {
    setPitch(value => {
      const next = Number((value + delta).toFixed(2));
      return Math.min(2, Math.max(0.5, next));
    });
  }, []);

  return useMemo(
    () => ({
      isReady,
      isSpeaking,
      rate,
      pitch,
      setRate,
      setPitch,
      adjustRate,
      adjustPitch,
      speak,
      stop,
    }),
    [
      adjustPitch,
      adjustRate,
      isReady,
      isSpeaking,
      pitch,
      rate,
      setPitch,
      setRate,
      speak,
      stop,
    ],
  );
};
