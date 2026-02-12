import { navigationRef } from './navigationRef';

/**
 * Navigate to a screen from outside React components.
 * Waits until the navigation container is ready.
 */
export function navigate<RouteName extends string>(
  name: RouteName,
  params?: Record<string, unknown>,
): void {
  if (navigationRef.isReady()) {
    (navigationRef.navigate as Function)(name, params);
  }
}

/**
 * Go back from outside React components.
 */
export function goBack(): void {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
  }
}

/**
 * Get the current route name.
 */
export function getCurrentRouteName(): string | undefined {
  if (navigationRef.isReady()) {
    return navigationRef.getCurrentRoute()?.name;
  }
  return undefined;
}
