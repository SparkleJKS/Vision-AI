/**
 * App version shown in Profile (Settings).
 * Sourced from package.json "version";
 */
import packageJson from "../../package.json";

export const APP_VERSION: string =
  (packageJson as { version?: string }).version ?? "1.0.0";
