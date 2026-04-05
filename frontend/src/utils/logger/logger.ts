/**
 * Logger utility with Reactotron integration.
 * Logs show up in Reactotron Timeline for app launch, API calls, events, etc.
 * No-op in production.
 */

const isDev = __DEV__;

const toMessage = (...args: unknown[]): string => {
  return args
    .map(arg => {
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
    console.log(
      `[${options.name}]`,
      options.preview ?? '',
      options.value ?? '',
    );
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
  display({
    name: `Error: ${name}`,
    preview: message,
    value: args,
    important: true,
  });
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
  details?: Record<string, unknown>,
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

/** JSON-safe values for logs (e.g. Firestore `changes` meta; timestamps → short strings). */
const serializeForLog = (v: unknown): unknown => {
  if (v === undefined) return '(undefined)';
  if (v === null) return null;
  if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'string')
    return v;
  if (typeof v === 'object' && v !== null) {
    const plain = v as {
      seconds?: number;
      nanoseconds?: number;
      toDate?: () => Date;
    };
    if (
      typeof plain.seconds === 'number' &&
      typeof plain.nanoseconds === 'number'
    ) {
      return `<ts ${plain.seconds}s>`;
    }
    if (typeof plain.toDate === 'function') {
      try {
        return `<ts ${plain.toDate().toISOString()}>`;
      } catch {
        return '<ts>';
      }
    }
    try {
      return JSON.parse(JSON.stringify(v)) as unknown;
    } catch {
      return String(v);
    }
  }
  return String(v);
};

/**
 * Firestore reads/writes/listeners — use for every Firestore touchpoint so
 * Reactotron stays searchable. New Firestore code should call this (or `error`
 * on failure) for parity.
 *
 * For writes, prefer `meta.changes` as `Record<string, { before; after }>` so
 * diffs are visible in the log preview.
 */
const logFirestore = (
  verb:
    | 'get'
    | 'create'
    | 'set_merge'
    | 'update'
    | 'delete_field'
    | 'listen_start'
    | 'listen_error',
  path: string,
  meta?: Record<string, unknown>,
) => {
  if (!isDev) return;
  const important = verb === 'listen_error';
  display({
    name: `Firestore ${verb}: ${path}`,
    preview: meta ? JSON.stringify(meta) : '',
    value: meta ?? null,
    important,
  });
};

export {
  log,
  info,
  warn,
  error,
  debug,
  display,
  logEvent,
  logApi,
  logApp,
  serializeForLog,
  logFirestore,
};
