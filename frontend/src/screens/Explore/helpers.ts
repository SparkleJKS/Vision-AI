import type { Code } from "react-native-vision-camera";
import { CODE_TYPE_LABELS } from "./constants";

export const getCodeTypeLabel = (type: Code["type"]): string => {
  const mapped = CODE_TYPE_LABELS[type];
  if (mapped) return mapped;
  return String(type).toUpperCase();
};

export const getOpenableUrl = (rawValue: string): string | null => {
  const value = rawValue.trim();
  if (!value) return null;

  const looksLikeHttpUrl =
    /^(https?:\/\/)[\w.-]+\.[a-z]{2,}(:\d+)?(\/[^\s]*)?$/i.test(value);
  if (looksLikeHttpUrl) return value;

  const looksLikeDomainPath = /^([\w-]+\.)+[a-z]{2,}(:\d+)?(\/[^\s]*)?$/i.test(
    value,
  );
  if (looksLikeDomainPath) return `https://${value}`;

  return null;
};
