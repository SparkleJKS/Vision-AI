import { createSlice } from '@reduxjs/toolkit';

export type LoginType = 'email' | 'google';

export interface AuthState {
  isLoggedIn: boolean;
  loginType: LoginType | null;
}

const initialState: AuthState = {
  isLoggedIn: false,
  loginType: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthState: (
      _state,
      action: {
        payload: { isLoggedIn: boolean; loginType?: LoginType | null };
      },
    ) => ({
      isLoggedIn: action.payload.isLoggedIn,
      loginType: action.payload.loginType ?? null,
    }),
    clearAuthState: () => initialState,
  },
});

export const authActions = authSlice.actions;
export const authReducer = authSlice.reducer;
