import { useState } from "react";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useDispatch } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useTheme } from "@/theme";
import { useAuth } from "@/auth/AuthContext";
import { navigationActions } from "@/store/actions/navigation";
import type { AppDispatch } from "@/store";

const SignInScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { signInWithEmail, signInWithGoogle, authError, clearAuthError } =
    useAuth();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const errorMessage = validationError ?? authError;
  const clearError = () => {
    setValidationError(null);
    clearAuthError();
  };

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setValidationError("Please enter email and password");
      return;
    }
    setLoading(true);
    clearError();
    try {
      await signInWithEmail(email.trim(), password);
    } catch {
      // Error shown via authError
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    clearError();
    try {
      await signInWithGoogle();
    } catch {
      // Error shown via authError
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{
        backgroundColor: theme.screenBg,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 40,
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <Text
          className="text-3xl font-bold mb-2"
          style={{ color: theme.white }}
        >
          Welcome back
        </Text>
        <Text className="text-base mb-8" style={{ color: theme.grey }}>
          Sign in to continue to VisionAI
        </Text>

        {errorMessage ? (
          <View
            className="flex-row items-center p-3 rounded-xl mb-4 border-l-4"
            style={{
              backgroundColor: theme.cardBg,
              borderLeftColor: theme.warning,
            }}
          >
            <Ionicons
              name="information-circle"
              size={20}
              color={theme.warning}
            />
            <Text
              className="text-sm ml-3 flex-1"
              style={{ color: theme.white }}
            >
              {errorMessage}
            </Text>
            <TouchableOpacity
              onPress={clearError}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              className="p-1"
            >
              <Ionicons name="close" size={20} color={theme.grey} />
            </TouchableOpacity>
          </View>
        ) : null}

        <TextInput
          className="rounded-xl px-4 py-3.5 text-base mb-3"
          style={{ backgroundColor: theme.cardBg, color: theme.white }}
          placeholder="Email"
          placeholderTextColor={theme.grey}
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            clearError();
          }}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          editable={!loading}
        />
        <TextInput
          className="rounded-xl px-4 py-3.5 text-base mb-6"
          style={{ backgroundColor: theme.cardBg, color: theme.white }}
          placeholder="Password"
          placeholderTextColor={theme.grey}
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            clearError();
          }}
          secureTextEntry
          autoComplete="password"
          editable={!loading}
        />

        <TouchableOpacity
          className="rounded-xl py-3.5 items-center mb-4"
          style={{ backgroundColor: theme.primary }}
          activeOpacity={0.8}
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text className="text-base font-bold text-black">Sign In</Text>
          )}
        </TouchableOpacity>

        <View className="flex-row items-center mb-4">
          <View
            className="flex-1 h-px"
            style={{ backgroundColor: theme.border }}
          />
          <Text className="text-sm mx-4" style={{ color: theme.grey }}>
            or
          </Text>
          <View
            className="flex-1 h-px"
            style={{ backgroundColor: theme.border }}
          />
        </View>

        <TouchableOpacity
          className="flex-row items-center justify-center rounded-xl py-3.5 border"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.border,
          }}
          activeOpacity={0.8}
          onPress={handleGoogleSignIn}
          disabled={loading}
        >
          <Ionicons name="logo-google" size={22} color={theme.white} />
          <Text
            className="text-base font-semibold ml-3"
            style={{ color: theme.white }}
          >
            Continue with Google
          </Text>
        </TouchableOpacity>

        <View className="flex-row justify-center mt-6">
          <Text className="text-sm" style={{ color: theme.grey }}>
            Don't have an account?{" "}
          </Text>
          <TouchableOpacity
            onPress={() => dispatch(navigationActions.toSignUp())}
            disabled={loading}
          >
            <Text
              className="text-sm font-semibold"
              style={{ color: theme.primary }}
            >
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignInScreen;
