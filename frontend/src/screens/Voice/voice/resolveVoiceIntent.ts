import { includesAny, isObjectDetectionCommand } from './commandParsing';

/**
 * Parsed intent from normalized speech (lowercase, trimmed). The executor maps
 * this to navigation + TTS without further phrase matching.
 */
export type VoiceIntent =
  | { type: 'empty' }
  | { type: 'stop_assistant' }
  | { type: 'help' }
  | { type: 'time' }
  | { type: 'go_back' }
  | { type: 'navigate_object_detection' }
  | { type: 'navigate_qr_scanner' }
  | { type: 'navigate_ocr' }
  | { type: 'navigate_tts' }
  | { type: 'navigate_home' }
  | { type: 'navigate_explore' }
  | { type: 'navigate_settings' }
  | { type: 'navigate_voice_audio_settings' }
  | { type: 'navigate_alerts' }
  | { type: 'already_in_voice_mode' }
  | { type: 'unsupported' };

export function resolveVoiceIntent(normalized: string): VoiceIntent {
  if (!normalized) {
    return { type: 'empty' };
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
    return { type: 'stop_assistant' };
  }

  if (
    includesAny(normalized, [
      'help',
      'what can you do',
      'show commands',
      'available commands',
    ])
  ) {
    return { type: 'help' };
  }

  if (
    includesAny(normalized, [
      'what time',
      'current time',
      'tell me the time',
      'time now',
    ])
  ) {
    return { type: 'time' };
  }

  if (includesAny(normalized, ['go back', 'back'])) {
    return { type: 'go_back' };
  }

  if (isObjectDetectionCommand(normalized)) {
    return { type: 'navigate_object_detection' };
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
    return { type: 'navigate_qr_scanner' };
  }

  if (
    includesAny(normalized, [
      'open ocr',
      'start ocr',
      'read text',
      'text recognition',
    ])
  ) {
    return { type: 'navigate_ocr' };
  }

  if (
    includesAny(normalized, [
      'text to speech',
      'open tts',
      'tts',
      'open speech',
    ])
  ) {
    return { type: 'navigate_tts' };
  }

  if (includesAny(normalized, ['go home', 'open home', 'home tab'])) {
    return { type: 'navigate_home' };
  }

  if (includesAny(normalized, ['open explore', 'go to explore', 'explore'])) {
    return { type: 'navigate_explore' };
  }

  if (
    includesAny(normalized, ['open settings', 'go to settings', 'settings'])
  ) {
    return { type: 'navigate_settings' };
  }

  if (
    includesAny(normalized, [
      'voice and audio settings',
      'open voice and audio',
      'voice settings',
    ])
  ) {
    return { type: 'navigate_voice_audio_settings' };
  }

  if (includesAny(normalized, ['open alerts', 'show alerts', 'alerts'])) {
    return { type: 'navigate_alerts' };
  }

  if (includesAny(normalized, ['open voice', 'voice mode'])) {
    return { type: 'already_in_voice_mode' };
  }

  return { type: 'unsupported' };
}
