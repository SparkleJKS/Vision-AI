import { ScreenNames } from '@/configs/navigation';

export const SETTINGS_ITEMS = [
  {
    id: 'voice' as const,
    screenName: ScreenNames.VoiceAndAudio,
    title: 'Voice & Audio',
    subtitle: 'Adjust speed & pitch',
    icon: 'volume-high' as const,
  },
  {
    id: 'vision' as const,
    screenName: ScreenNames.VisionSettings,
    title: 'Vision Settings',
    subtitle: 'Contrast & detection modes',
    icon: 'eye' as const,
  },
  {
    id: 'devices' as const,
    screenName: ScreenNames.ConnectedDevices,
    title: 'Connected Devices',
    subtitle: 'Glasses & hearing aids',
    icon: 'bluetooth' as const,
  },
  {
    id: 'accessibility' as const,
    screenName: ScreenNames.Accessibility,
    title: 'Accessibility',
    subtitle: 'Haptics & gestures',
    icon: 'accessibility' as const,
  },
  {
    id: 'profile' as const,
    screenName: ScreenNames.Profile,
    title: 'Profile',
    subtitle: 'Personal details & preferences',
    icon: 'person' as const,
  },
] as const;
