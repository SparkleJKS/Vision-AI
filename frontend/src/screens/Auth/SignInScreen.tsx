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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors } from "../../theme/colors";
import { useAuth } from "../../auth/AuthContext";
import { ScreenNames } from "../../configs/navigation";
import type { IAuthStackParamList } from "../screens.types";

type NavProp = NativeStackNavigationProp<IAuthStackParamList>;

export function SignInScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
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
      className="flex-1 bg-screen"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
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
        <Text className="text-white text-[28px] font-bold mb-2">
          Welcome back
        </Text>
        <Text className="text-grey text-base mb-8">
          Sign in to continue to VisionAI
        </Text>

        {errorMessage ? (
          <View className="bg-card rounded-xl p-3 mb-4 flex-row items-center border-l-4 border-warning">
            <Ionicons name="information-circle" size={20} color={colors.warning} />
            <Text className="text-white text-sm ml-3 flex-1">
              {errorMessage}
            </Text>
            <TouchableOpacity
              onPress={clearError}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              className="p-1"
            >
              <Ionicons name="close" size={20} color={colors.grey} />
            </TouchableOpacity>
          </View>
        ) : null}

        <TextInput
          className="bg-card rounded-xl px-4 py-3.5 text-white text-base mb-3"
          placeholder="Email"
          placeholderTextColor={colors.grey}
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
          className="bg-card rounded-xl px-4 py-3.5 text-white text-base mb-6"
          placeholder="Password"
          placeholderTextColor={colors.grey}
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
          className="bg-accent rounded-xl py-3.5 items-center mb-4"
          activeOpacity={0.8}
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text className="text-black text-base font-bold">Sign In</Text>
          )}
        </TouchableOpacity>

        <View className="flex-row items-center mb-4">
          <View className="flex-1 h-px bg-border" />
          <Text className="text-grey text-sm mx-4">or</Text>
          <View className="flex-1 h-px bg-border" />
        </View>

        <TouchableOpacity
          className="bg-card rounded-xl py-3.5 flex-row items-center justify-center border border-border"
          activeOpacity={0.8}
          onPress={handleGoogleSignIn}
          disabled={loading}
        >
          <Ionicons name="logo-google" size={22} color={colors.white} />
          <Text className="text-white text-base font-semibold ml-3">
            Continue with Google
          </Text>
        </TouchableOpacity>

        <View className="flex-row justify-center mt-6">
          <Text className="text-grey text-sm">Don't have an account? </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate(ScreenNames.SignUp)}
            disabled={loading}
          >
            <Text className="text-accent text-sm font-semibold">Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
