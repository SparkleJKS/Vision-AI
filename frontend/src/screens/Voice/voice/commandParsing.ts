export const normalizeCommand = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const includesAny = (text: string, phrases: string[]): boolean => {
  return phrases.some(phrase => text.includes(phrase));
};

export const isObjectDetectionCommand = (text: string): boolean => {
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
