import { createNavigationContainerRef } from '@react-navigation/native';
import type { IHomeTabParamList } from '../screens/screens.types';

/**
 * Typed navigation container ref.
 * Use this for navigating outside of React components (e.g. from utils, sagas, etc.).
 */
export const navigationRef = createNavigationContainerRef<IHomeTabParamList>();
