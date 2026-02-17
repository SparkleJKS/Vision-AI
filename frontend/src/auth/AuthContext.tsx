import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useDispatch } from "react-redux";
import type { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { AUTH_CONFIG } from "@/configs/auth";
import { logEvent, logApp, error } from "@/utils/logger";
import { getAuthErrorMessage } from "./authErrors";
import { authActions } from "@/store/slices/authSlice";
import type { LoginType } from "@/store/slices/authSlice";
import { AppDispatch } from "@/store";

type User = FirebaseAuthTypes.User;

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  /** False when Firebase auth fails to initialize - App shows main UI without auth */
  authAvailable: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
};

function getLoginTypeFromUser(user: User | null): LoginType | null {
  if (!user?.providerData?.length) return null;
  const hasGoogle = user.providerData.some(
    (p) => p?.providerId === "google.com",
  );
  const hasEmail = user.providerData.some((p) => p?.providerId === "password");
  if (hasGoogle) return "google";
  if (hasEmail) return "email";
  return null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authAvailable, setAuthAvailable] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      const auth = require("@react-native-firebase/auth").default;
      const {
        GoogleSignin,
      } = require("@react-native-google-signin/google-signin");

      if (AUTH_CONFIG.GOOGLE_WEB_CLIENT_ID) {
        GoogleSignin.configure({
          webClientId: AUTH_CONFIG.GOOGLE_WEB_CLIENT_ID,
        });
        logEvent("Auth:GoogleSigninConfigured", { configured: true });
      }

      setAuthAvailable(true);
      unsubscribe = auth().onAuthStateChanged((u: User | null) => {
        logEvent("Auth:StateChanged", {
          signedIn: !!u,
          uid: u?.uid?.slice(0, 8),
        });
        setUser(u);
        setLoading(false);
        dispatch(
          authActions.setAuthState({
            isLoggedIn: !!u,
            loginType: getLoginTypeFromUser(u),
          }),
        );
      });
    } catch (err) {
      logApp("error", { phase: "auth_init", error: String(err) });
      setAuthAvailable(false);
      setUser(null);
      setLoading(false);
      dispatch(authActions.clearAuthState());
    }
    return () => unsubscribe?.();
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      setAuthError(null);
      try {
        const auth = require("@react-native-firebase/auth").default;
        await auth().signInWithEmailAndPassword(email, password);
      } catch (e: unknown) {
        setAuthError(getAuthErrorMessage(e));
        error("Auth:SignInWithEmailError", { error: String(e) });
        throw e;
      }
    },
    [],
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
      setAuthError(null);
      try {
        const auth = require("@react-native-firebase/auth").default;
        await auth().createUserWithEmailAndPassword(email, password);
      } catch (e: unknown) {
        setAuthError(getAuthErrorMessage(e));
        error("Auth:SignUpWithEmailError", { error: String(e) });
        throw e;
      }
    },
    [],
  );

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    logEvent("Auth:SignInWithGoogleClicked");
    try {
      const auth = require("@react-native-firebase/auth").default;
      const {
        GoogleSignin,
      } = require("@react-native-google-signin/google-signin");

      if (!AUTH_CONFIG.GOOGLE_WEB_CLIENT_ID) {
        throw new Error(
          "Google Web Client ID not configured. See configs/auth.ts",
        );
      }

      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (response.type === "cancelled") {
        logEvent("Auth:SignInWithGoogleCancelled");
        throw new Error("Google Sign-In was cancelled");
      }
      const idToken = response.data.idToken;
      if (!idToken) {
        logEvent("Auth:SignInWithGoogleError", {
          error: "No id token returned",
        });
        throw new Error("Google Sign-In failed: no id token returned");
      }
      const credential = auth.GoogleAuthProvider.credential(idToken);
      await auth().signInWithCredential(credential);
      logEvent("Auth:SignInWithGoogleSuccess");
    } catch (e: unknown) {
      const msg = getAuthErrorMessage(e);
      logEvent("Auth:SignInWithGoogleError", { error: msg });
      setAuthError(msg);
      throw e;
    }
  }, []);

  const signOut = useCallback(async () => {
    setAuthError(null);
    logEvent("Auth:SignOutClicked");
    try {
      const auth = require("@react-native-firebase/auth").default;
      const {
        GoogleSignin,
      } = require("@react-native-google-signin/google-signin");
      await GoogleSignin.signOut();
      await auth().signOut();
      logEvent("Auth:SignOutSuccess");
    } catch (err) {
      logEvent("Auth:SignOutError", { error: String(err) });
    }
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    authAvailable,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    authError,
    clearAuthError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
