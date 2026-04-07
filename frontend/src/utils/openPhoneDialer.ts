import { Linking } from 'react-native';
import { showToast } from '@/utils/toast';

/**
 * Parses and validates Indian mobile numbers.
 * Accepts: 10-digit mobile starting 6-9, optionally prefixed with +91 / 91 / 0.
 */
export const parseIndianMobile = (
  raw: string,
): { national10: string; e164: string } | null => {
  const s = raw.trim().replace(/[\s\-().]/g, '');
  if (!s) return null;

  let digits = s;
  if (digits.startsWith('+')) digits = digits.slice(1);
  digits = digits.replace(/\D/g, '');

  // 0XXXXXXXXXX (11) or 91XXXXXXXXXX (12)
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);

  if (digits.length !== 10) return null;
  if (!/^[6-9]\d{9}$/.test(digits)) return null;

  return { national10: digits, e164: `+91${digits}` };
};

export const isValidIndianMobile = (raw: string): boolean => {
  return parseIndianMobile(raw) != null;
};

/** For UI: returns E.164 (or empty) suitable for `tel:`. */
export const normalizeTelNumberForDial = (raw: string): string => {
  const parsed = parseIndianMobile(raw);
  return parsed?.e164 ?? '';
};

/** Opens the system phone app / dialer with the number prefilled. */
export const openPhoneDialer = async (rawPhone: string): Promise<void> => {
  const parsed = parseIndianMobile(rawPhone);
  if (!parsed) {
    showToast.info('Invalid phone number', 'Enter a valid mobile number');
    return;
  }
  const url = `tel:${parsed.e164}`;
  try {
    await Linking.openURL(url);
  } catch {
    showToast.error(
      "Couldn't open dialer",
      'This device may not support phone calls.',
    );
  }
};
