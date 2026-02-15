/**
 * Logger utility with Reactotron integration.
 * Logs show up in Reactotron Timeline for app launch, API calls, events, etc.
 * No-op in production.
 */

const isDev = __DEV__;

const toMessage = (...args: unknown[]): string => {
  return args
    .map((arg) => {
      if (arg instanceof Error) {
        return `${arg.name}: ${arg.message}${arg.stack ? `\n${arg.stack}` : ''}`;
      }
      if (typeof arg === 'string') return arg;
      try {
        return JSON.stringify(arg, null, 2);
      } catch {
        return String(arg);
      }
    })
    .join(' ');
};

const getTron = () =>
  isDev && typeof console !== 'undefined' && (console as any).tron
    ? (console as any).tron
    : null;

/** Basic log - single output to Reactotron (avoids duplicate with console) */
const log = (name: string, ...args: unknown[]) => {
  if (!isDev) return;
  const message = toMessage(...args);
  const t = getTron();
  if (t?.log) {
    t.log(`[${name}]`, message);
  } else {
    console.log(`[${name}]`, ...args);
  }
};

/** Structured display - single output to Reactotron */
const display = (options: {
  name: string;
  preview?: string;
  value?: unknown;
  important?: boolean;
}) => {
  if (!isDev) return;
  const t = getTron();
  if (t?.display) {
    t.display({
      name: options.name,
      preview: options.preview ?? '',
      value: options.value ?? null,
      important: options.important ?? false,
    });
  } else {
    console.log(`[${options.name}]`, options.preview ?? '', options.value ?? '');
  }
};

/** Info level */
const info = (name: string, ...args: unknown[]) => {
  if (!isDev) return;
  const message = toMessage(...args);
  const t = getTron();
  if (t?.log) t.log(`[${name}] ℹ`, message);
  else console.info(`[${name}]`, ...args);
};

/** Warning level */
const warn = (name: string, ...args: unknown[]) => {
  if (!isDev) return;
  const message = toMessage(...args);
  const t = getTron();
  if (t?.log) t.log(`[${name}] ⚠`, message);
  else console.warn(`[${name}]`, ...args);
};

/** Error level - display only (single entry) */
const error = (name: string, ...args: unknown[]) => {
  if (!isDev) return;
  const message = toMessage(...args);
  display({ name: `Error: ${name}`, preview: message, value: args, important: true });
};

/** Debug level */
const debug = (name: string, ...args: unknown[]) => {
  if (!isDev) return;
  const message = toMessage(...args);
  const t = getTron();
  if (t?.log) t.log(`[${name}] 🔍`, message);
  else console.debug(`[${name}]`, ...args);
};

/** Event logging - display only (single entry) */
const logEvent = (eventName: string, payload?: Record<string, unknown>) => {
  if (!isDev) return;
  const preview = payload ? JSON.stringify(payload) : '';
  display({
    name: `Event: ${eventName}`,
    preview,
    value: payload ?? null,
    important: false,
  });
};

/** API call logging - display only (single entry) */
const logApi = (
  type: 'request' | 'response' | 'error',
  endpoint: string,
  details?: Record<string, unknown>
) => {
  if (!isDev) return;
  const name = `API ${type.toUpperCase()}: ${endpoint}`;
  display({
    name,
    preview: details ? JSON.stringify(details) : '',
    value: details ?? null,
    important: type === 'error',
  });
};

/** App lifecycle - display only (single entry) */
const logApp = (phase: string, details?: Record<string, unknown>) => {
  if (!isDev) return;
  display({
    name: `App: ${phase}`,
    preview: details ? JSON.stringify(details) : '',
    value: details ?? null,
    important: phase === 'launch' || phase === 'error',
  });
};

export { log, info, warn, error, debug, display, logEvent, logApi, logApp };
