/**
 * In-app FAQ copy — kept in sync with actual navigation, Voice intents,
 * Explore tools, and Settings surfaces. Update when features ship or change.
 */
export type HelpFaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type HelpFaqSection = {
  id: string;
  title: string;
  items: HelpFaqItem[];
};

export const HELP_FAQ_SECTIONS: HelpFaqSection[] = [
  {
    id: 'start',
    title: 'Getting started',
    items: [
      {
        id: 'what-is-visionai',
        question: 'What is VisionAI?',
        answer:
          'VisionAI is a vision-focused companion app: a Home dashboard, an Explore tab with on-device AI tools (object detection, scanning, OCR, and text-to-speech), a Voice tab for hands-free commands on supported Android builds, a Notifications screen, and Settings (Preferences) for profile and device-related options.',
      },
      {
        id: 'main-tabs',
        question: 'What do the bottom tabs do?',
        answer:
          'Home is your landing screen with greetings and shortcuts. Explore opens the AI Tools hub (Object Detection, QR & Barcode, Photo to Text, Text to Speech). Voice is for the voice assistant where supported. Notifications shows in-app alerts. Settings (labeled Preferences on the list) opens profile-related items and other configuration screens.',
      },
      {
        id: 'cost',
        question: 'Is VisionAI free? Is there a subscription?',
        answer:
          'Everything in the app is free to use right now. There is no paid tier or in-app subscription.',
      },
      {
        id: 'account-required',
        question: 'Do I need to sign in?',
        answer:
          'When sign-in is available (Firebase Auth), you can use email/password or Google. If authentication cannot be initialized on your device, the app may still open the main experience without requiring an account. Your profile and some saved data use your account when you are signed in.',
      },
    ],
  },
  {
    id: 'account',
    title: 'Account & profile',
    items: [
      {
        id: 'profile-location',
        question: 'Where is my profile?',
        answer:
          'Open Settings (Preferences) from the bottom tabs, then tap Profile. From there you can change the app theme, open Personal Details, Privacy & Security, Help & Support, and sign out when authentication is available.',
      },
      {
        id: 'personal-details',
        question: 'What can I change under Personal Details?',
        answer:
          'Personal Details syncs with your Firestore user profile when you are signed in. You can update account-related information and structured fields such as gender, age, blood group, location, additional profile notes, and safety-related sections shown in the form.',
      },
      {
        id: 'sign-out',
        question: 'How do I sign out?',
        answer:
          'Go to Settings → Profile and tap Sign out at the bottom of the screen. This appears when sign-in is available.',
      },
      {
        id: 'theme',
        question: 'How do I change the app theme?',
        answer:
          'In Profile, under App Theme, choose between the available themes (for example Accessibility and Neon). The selection applies across the app.',
      },
    ],
  },
  {
    id: 'explore',
    title: 'Explore — AI tools',
    items: [
      {
        id: 'explore-hub',
        question: 'What is the Explore tab?',
        answer:
          'Explore is the hub for VisionAI’s AI Tools. Each card opens a dedicated experience. The hub also notes that more capabilities may be added over time.',
      },
      {
        id: 'object-detection',
        question: 'How does Object Detection work?',
        answer:
          'Object Detection runs a live camera preview and uses an on-device YOLOv8-style model (YOLOv8n-class setup in the UI) to highlight objects in real time. Use Start/Stop to control detection and Flip to switch cameras where supported. The camera needs permission to run. If you open this tool from the voice assistant, detection can start automatically.',
      },
      {
        id: 'qr-scanner',
        question: 'How do QR & Barcode scanning work?',
        answer:
          'QR & Barcode uses the rear camera in a live scanning mode. When a supported code is found, you can see the result and open safe links when applicable. Camera permission is required.',
      },
      {
        id: 'ocr',
        question: 'How does Photo to Text (OCR) work?',
        answer:
          'You capture a still photo; the app runs on-device text recognition and shows the extracted text. You can use read-aloud (text-to-speech) on the result where that option is offered. Camera (and sometimes storage-related) permissions may be requested depending on platform.',
      },
      {
        id: 'tts-explore',
        question: 'How does Text to Speech work?',
        answer:
          'Enter or paste text, then use Speak to hear it with the device’s TTS engine. You can stop playback and adjust rate and pitch with the on-screen controls.',
      },
      {
        id: 'explore-permissions',
        question: 'Why is the app asking for camera or microphone access?',
        answer:
          'Camera access is required for live object detection, QR scanning, and photo capture for OCR. The microphone is used for Voice Mode and for voice-related features. You can grant or revoke permissions in system Settings; the app will explain when a feature cannot run without them.',
      },
    ],
  },
  {
    id: 'voice',
    title: 'Voice assistant',
    items: [
      {
        id: 'voice-platform',
        question: 'Why doesn’t Voice Mode work on my phone?',
        answer:
          'The hands-free voice assistant is built for Android and relies on a native voice module shipped with your app build. On other platforms, or if the module is missing or outdated, Voice Mode will show as unavailable. If you see a message about an outdated voice module, rebuild and reinstall the Android app from the current project sources, then try again.',
      },
      {
        id: 'voice-how-to-use',
        question: 'How do I use Voice Mode?',
        answer:
          'Open the Voice tab, grant microphone permission when asked, then tap Start Assistant. Speak clearly after the assistant confirms it is listening. Tap Stop Assistant or say phrases like “stop listening,” “stop assistant,” or “goodbye” to end the session. Leaving the Voice tab turns the assistant off.',
      },
      {
        id: 'voice-commands-nav',
        question: 'What navigation commands can I say?',
        answer:
          'Examples that match the app’s command list: “start object detection” (opens object detection and can auto-start detection), phrases with “QR” or “scan QR” for the scanner, “open OCR” or “read text” for Photo to Text, “text to speech” or “open TTS” for TTS, “go home” or “open home,” “open explore,” “open settings,” “open alerts,” “voice and audio settings” or “voice settings,” and “go back” or “back” when there is a screen to return from.',
      },
      {
        id: 'voice-commands-other',
        question: 'What other voice commands are supported?',
        answer:
          'You can ask for “help,” “what can you do,” or “show commands” to hear a short summary. Ask “what time” or “current time” for the local time. The assistant responds with spoken feedback and may navigate after confirming certain actions.',
      },
      {
        id: 'voice-not-understood',
        question: 'The assistant didn’t understand me. What should I do?',
        answer:
          'Speak in a quiet environment, wait for the listening state, and use short phrases similar to the examples in this help section. If recognition repeatedly fails, check your network and microphone, then try stopping and starting the assistant again. On Android, transient recognition errors may recover automatically after a short delay.',
      },
    ],
  },
  {
    id: 'home-alerts',
    title: 'Home & notifications',
    items: [
      {
        id: 'home-content',
        question: 'What does the Home screen show?',
        answer:
          'Home shows a time-based greeting, your display name when signed in, and sections such as quick actions and activity. Some elements are illustrative only in the current build—for example, quick action tiles may not yet perform actions, and headline stats may be sample values until wired to real analytics.',
      },
      {
        id: 'home-profile-shortcut',
        question: 'How do I open Profile from Home?',
        answer:
          'Tap your avatar on Home to open Profile (same destination as Settings → Profile).',
      },
      {
        id: 'alerts-screen',
        question: 'Are Notifications real-time?',
        answer:
          'The Notifications tab shows an in-app list styled like alerts. In the current version the content is static sample data for the UI; it is not yet connected to push notifications or a live backend feed.',
      },
    ],
  },
  {
    id: 'settings',
    title: 'Settings (Preferences)',
    items: [
      {
        id: 'settings-list',
        question: 'What is under Settings / Preferences?',
        answer:
          'From the Preferences list you can open Voice & Audio, Vision Settings, Connected Devices, Accessibility, and Profile. These entries match the tiles shown on the main settings screen.',
      },
      {
        id: 'settings-coming-soon',
        question:
          'Some settings screens say “coming soon.” What does that mean?',
        answer:
          'Voice & Audio, Vision Settings, Connected Devices, and Accessibility currently show placeholder “coming soon” copy. Full controls for speed, pitch, contrast, detection modes, peripherals, and accessibility options will appear here as they are implemented. Profile, Personal Details, Privacy & Security, and Help & Support are functional today.',
      },
      {
        id: 'vision-settings-vs-explore',
        question: 'What is the difference between Vision Settings and Explore?',
        answer:
          'Explore is where you run the vision tools (camera, OCR, TTS, etc.). Vision Settings (under Preferences) is intended for global vision-related preferences once those controls are built; today it may only show a placeholder.',
      },
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy, security & data',
    items: [
      {
        id: 'privacy-where',
        question: 'Where are privacy controls and policies?',
        answer:
          'Open Settings → Profile → Privacy & Security. There you can review privacy-related actions, open relevant policy links where provided, and manage app-level choices tied to your account and device.',
      },
      {
        id: 'data-storage',
        question: 'Where is my data stored?',
        answer:
          'Sign-in and account identity use Firebase Authentication when enabled. Profile-related data may be stored in Firebase Firestore for your user ID. On-device processing (camera frames, OCR, and local models) stays on the device except where a feature explicitly uses a network service you configure.',
      },
      {
        id: 'crash-reporting',
        question: 'Does the app collect diagnostics?',
        answer:
          'Release builds may use Firebase Crashlytics for crash reporting to improve stability. That is separate from the sample content shown on Home or Notifications.',
      },
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    items: [
      {
        id: 'camera-not-working',
        question: 'The camera or a vision tool won’t start.',
        answer:
          'Confirm camera permission is allowed for VisionAI in Android Settings. Force-close and reopen the app, then open the tool again. If you denied permission permanently, use the system settings link from the app’s prompt when offered.',
      },
      {
        id: 'tts-issues',
        question: 'Text to speech is silent or sounds wrong.',
        answer:
          'Check device volume and mute switch. Ensure your phone’s TTS engine is installed and working in system accessibility/language settings. Try adjusting rate and pitch in the Text to Speech screen.',
      },
      {
        id: 'auth-issues',
        question: 'I can’t sign in or Google sign-in fails.',
        answer:
          'Check your internet connection, date and time, and that Google Play services are up to date on Android. If the app reports that authentication is unavailable, you may still use the main interface without signing in until the issue is resolved.',
      },
      {
        id: 'app-version',
        question: 'How do I know which version I’m running?',
        answer:
          'Open Settings → Profile and scroll to the version information at the bottom of the screen.',
      },
      {
        id: 'more-help',
        question: 'I still need help.',
        answer:
          'Re-read the sections above for your feature (Explore, Voice, or Settings). For account data and legal links, use Privacy & Security from Profile. If you are developing the app, ensure native modules are rebuilt after pulling updates so Voice and vision features match the current codebase.',
      },
    ],
  },
];
