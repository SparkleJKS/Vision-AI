import type { RootState } from '../store';

export const selectAuthState = (state: RootState) => state.auth;

export const selectIsLoggedIn = (state: RootState) => state.auth.isLoggedIn;

export const selectLoginType = (state: RootState) => state.auth.loginType;
