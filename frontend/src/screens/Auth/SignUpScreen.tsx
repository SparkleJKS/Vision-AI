import React, { useState } from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import { useAuth } from '../../auth/AuthContext';
import { ScreenNames } from '../../configs/navigation';
import type { IAuthStackParamList } from '../screens.types';

type NavProp = NativeStackNavigationProp<IAuthStackParamList>;

export function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
  const { signUpWithEmail, signInWithGoogle, authError, clearAuthError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email.trim() || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    clearAuthError();
    try {
      await signUpWithEmail(email.trim(), password);
    } catch {
      // Error shown via authError
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    clearAuthError();
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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ paddingTop: insets.top }}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 24,
          flexGrow: 1,
          justifyContent: 'center',
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-white text-[28px] font-bold mb-2">Create account</Text>
        <Text className="text-grey text-base mb-8">
          Sign up to get started with VisionAI
        </Text>

        {authError ? (
          <View className="bg-warning/20 rounded-xl p-3 mb-4 flex-row items-center">
            <Ionicons name="alert-circle" size={20} color={colors.warning} />
            <Text className="text-warning text-sm ml-2 flex-1">{authError}</Text>
          </View>
        ) : null}

        <TextInput
          className="bg-card rounded-xl px-4 py-3.5 text-white text-base mb-3"
          placeholder="Email"
          placeholderTextColor={colors.grey}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          editable={!loading}
        />
        <TextInput
          className="bg-card rounded-xl px-4 py-3.5 text-white text-base mb-3"
          placeholder="Password (min 6 characters)"
          placeholderTextColor={colors.grey}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          editable={!loading}
        />
        <TextInput
          className="bg-card rounded-xl px-4 py-3.5 text-white text-base mb-6"
          placeholder="Confirm password"
          placeholderTextColor={colors.grey}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoComplete="new-password"
          editable={!loading}
        />

        <TouchableOpacity
          className="bg-accent rounded-xl py-3.5 items-center mb-4"
          activeOpacity={0.8}
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text className="text-black text-base font-bold">Sign Up</Text>
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
          <Text className="text-grey text-sm">Already have an account? </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate(ScreenNames.SignIn)}
            disabled={loading}
          >
            <Text className="text-accent text-sm font-semibold">Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
