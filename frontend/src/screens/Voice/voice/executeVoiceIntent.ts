import { ScreenNames } from '@/configs/navigation';
import { HELP_RESPONSE } from './constants';
import type { VoiceIntent } from './resolveVoiceIntent';

/** Minimal navigation surface so this module stays testable without full RN types. */
export type VoiceNavigationAdapter = {
  navigate(name: string, params?: object): void;
  goBack(): void;
  canGoBack(): boolean;
};

export type VoiceIntentExecutorDeps = {
  navigation: VoiceNavigationAdapter;
  speakReply: (text: string, restartAfter: boolean) => Promise<void>;
  navigateAndConfirm: (message: string, action: () => void) => Promise<void>;
  deactivateAssistant: () => Promise<void>;
};

/**
 * Runs side effects for a resolved intent (TTS + navigation). Keeps phrase
 * lists out of the screen component.
 */
export const executeVoiceIntent = async (
  intent: VoiceIntent,
  deps: VoiceIntentExecutorDeps,
): Promise<void> => {
  const { navigation, speakReply, navigateAndConfirm, deactivateAssistant } =
    deps;

  switch (intent.type) {
    case 'empty':
      await speakReply('I did not catch that. Please repeat.', true);
      return;

    case 'stop_assistant':
      await deactivateAssistant();
      await speakReply('Voice assistant stopped.', false);
      return;

    case 'help':
      await speakReply(HELP_RESPONSE, true);
      return;

    case 'time': {
      const currentTime = new Date().toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      });
      await speakReply(`The time is ${currentTime}.`, true);
      return;
    }

    case 'go_back':
      if (navigation.canGoBack()) {
        await navigateAndConfirm('Going back.', () => {
          navigation.goBack();
        });
      } else {
        await speakReply('There is no previous screen to go back to.', true);
      }
      return;

    case 'navigate_object_detection':
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

    case 'navigate_qr_scanner':
      await navigateAndConfirm('Opening QR scanner.', () => {
        navigation.navigate(ScreenNames.Explore, {
          screen: ScreenNames.ExploreQrScanner,
        });
      });
      return;

    case 'navigate_ocr':
      await navigateAndConfirm('Opening OCR screen.', () => {
        navigation.navigate(ScreenNames.Explore, {
          screen: ScreenNames.ExploreOcr,
        });
      });
      return;

    case 'navigate_tts':
      await navigateAndConfirm('Opening text to speech.', () => {
        navigation.navigate(ScreenNames.Explore, {
          screen: ScreenNames.ExploreTts,
        });
      });
      return;

    case 'navigate_home':
      await navigateAndConfirm('Opening home.', () => {
        navigation.navigate(ScreenNames.Home);
      });
      return;

    case 'navigate_explore':
      await navigateAndConfirm('Opening explore.', () => {
        navigation.navigate(ScreenNames.Explore, {
          screen: ScreenNames.Explore,
        });
      });
      return;

    case 'navigate_settings':
      await navigateAndConfirm('Opening settings.', () => {
        navigation.navigate(ScreenNames.Settings, {
          screen: ScreenNames.SettingsList,
        });
      });
      return;

    case 'navigate_voice_audio_settings':
      await navigateAndConfirm('Opening voice and audio settings.', () => {
        navigation.navigate(ScreenNames.Settings, {
          screen: ScreenNames.VoiceAndAudio,
        });
      });
      return;

    case 'navigate_alerts':
      await navigateAndConfirm('Opening alerts.', () => {
        navigation.navigate(ScreenNames.Alerts);
      });
      return;

    case 'already_in_voice_mode':
      await speakReply('You are already in voice mode.', true);
      return;

    case 'unsupported':
      await speakReply(
        'Unsupported command. Say help to hear supported commands.',
        true,
      );
      return;
  }
};
