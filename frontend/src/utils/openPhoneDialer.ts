import { Linking } from 'react-native';
import { showToast } from '@/utils/toast';

/** Digits and optional leading + for `tel:` URLs. */
export const normalizeTelNumberForDial = (raw: string): string => {
  const s = raw.trim().replace(/[\s\-().]/g, '');
  if (!s) return '';
  if (s.startsWith('+')) {
    const rest = s.slice(1).replace(/\D/g, '');
    return rest ? `+${rest}` : '';
  }
  return s.replace(/\D/g, '');
};

/** Opens the system phone app / dialer with the number prefilled. */
export const openPhoneDialer = async (rawPhone: string): Promise<void> => {
  const n = normalizeTelNumberForDial(rawPhone);
  if (!n) {
    showToast.info('No phone number', 'Enter a number before calling.');
    return;
  }
  const url = `tel:${n}`;
  try {
    await Linking.openURL(url);
  } catch {
    showToast.error(
      "Couldn't open dialer",
      'This device may not support phone calls.',
    );
  }
};
