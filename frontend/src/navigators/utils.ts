import { CommonActions } from '@react-navigation/native';
import { navigationRef } from './navigationRef';

/**
 * Navigate to a screen from outside React components.
 * Supports both (name, params) and { name, params } for nested navigation.
 */
export function navigate(
  nameOrPayload: string | { name: string; params?: Record<string, unknown> },
  params?: Record<string, unknown>,
): void {
  if (!navigationRef.isReady()) return;
  if (typeof nameOrPayload === 'object') {
    const { name, params: p } = nameOrPayload;
    navigationRef.dispatch(CommonActions.navigate({ name, params: p }));
  } else {
    (navigationRef.navigate as (n: string, p?: object) => void)(nameOrPayload, params);
  }
}

/**
 * Get the navigation ref for use in sagas (e.g. canGoBack).
 */
export function getNavigationRef() {
  return navigationRef;
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
