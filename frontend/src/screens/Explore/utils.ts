import type { RuntimeStatus } from './types';
import { EXPLORE_COLORS } from './config';

export const formatError = (error: unknown): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Detection failed.';
};

export const formatRuntime = (runtime: string | null | undefined): string => {
  if (typeof runtime !== 'string' || !runtime.trim()) {
    return 'Unknown';
  }
  return runtime.toUpperCase();
};

export const getStatusColor = (status: RuntimeStatus): string => {
  if (status === 'running') return EXPLORE_COLORS.success;
  if (status === 'error') return EXPLORE_COLORS.error;
  if (status === 'loading' || status === 'fallback')
    return EXPLORE_COLORS.warning;
  return EXPLORE_COLORS.label;
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};
