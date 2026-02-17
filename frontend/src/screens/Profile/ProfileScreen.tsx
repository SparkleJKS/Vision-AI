import { useState } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme';
import { useBackHandler } from '@/navigators';
import { useAuth } from '@/auth/AuthContext';
import { logEvent } from '@/utils/logger';
import { navigationActions } from '@/store/actions/navigation';
import type { AppDispatch } from '@/store';

const PROFILE_OPTIONS = [
  {
    id: 'personal',
    title: 'Personal Details',
    icon: 'person-outline' as const,
  },
  {
    id: 'privacy',
    title: 'Privacy & Security',
    icon: 'shield-checkmark-outline' as const,
  },
  {
    id: 'subscription',
    title: 'Subscription',
    icon: 'card-outline' as const,
  },
];

export function ProfileScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const insets = useSafeAreaInsets();
  const { user, signOut, authAvailable } = useAuth();

  const handleBack = () => dispatch(navigationActions.toBack());
  const [isSigningOut, setIsSigningOut] = useState<boolean>(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await signOut();
      logEvent('Profile:SignOutComplete');
      // MainContainer switches to AuthStack (SignIn) when user becomes null
    } catch (err) {
      logEvent('Profile:SignOutError', { error: String(err) });
    } finally {
      setIsSigningOut(false);
    }
  };

  useBackHandler({
    onBack: handleBack,
  });

  const displayName = user?.displayName ?? user?.email?.split('@')[0] ?? 'Guest';
  const displayInitial = displayName[0]?.toUpperCase() ?? '?';

  return (
    <View
      className="flex-1 bg-screen"
      style={{ paddingTop: insets.top }}
    >
      <TouchableOpacity
        className="flex-row items-center px-4 pt-4 pb-2"
        onPress={handleBack}
        activeOpacity={0.8}
      >
        <Ionicons name="arrow-back" size={24} color={colors.white} />
        <Text className="text-white text-base ml-2">Back</Text>
      </TouchableOpacity>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{
          alignItems: 'center',
          paddingBottom: insets.bottom + 80,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-24 h-24 rounded-full bg-accent items-center justify-center my-6">
          <Text className="text-black text-3xl font-bold">{displayInitial}</Text>
        </View>
        <Text className="text-white text-2xl font-bold">{displayName}</Text>
        {user?.email ? (
          <Text className="text-grey text-sm mt-1">{user.email}</Text>
        ) : authAvailable ? null : (
          <Text className="text-grey text-sm mt-1">Auth not available</Text>
        )}

        <View className="w-full mt-8">
          {PROFILE_OPTIONS.map((item) => (
            <TouchableOpacity
              key={item.id}
              className="bg-card rounded-2xl p-4 mb-3 flex-row items-center"
              activeOpacity={0.8}
            >
              <View className="w-12 h-12 rounded-full bg-card-light items-center justify-center mr-4">
                <Ionicons
                  name={item.icon}
                  size={24}
                  color={colors.white}
                />
              </View>
              <Text className="text-white text-lg font-bold flex-1">
                {item.title}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.grey} />
            </TouchableOpacity>
          ))}

          {authAvailable && (
            <TouchableOpacity
              className="bg-card rounded-2xl p-4 flex-row items-center border border-warning"
              activeOpacity={0.8}
              onPress={handleSignOut}
              disabled={isSigningOut}
            >
              <View className="w-12 h-12 rounded-full bg-card-light items-center justify-center mr-4">
                {isSigningOut ? (
                  <ActivityIndicator size="small" color={colors.warning} />
                ) : (
                  <Ionicons
                    name="log-out-outline"
                    size={24}
                    color={colors.warning}
                  />
                )}
              </View>
              <Text className="text-warning text-lg font-bold flex-1">
                {isSigningOut ? 'Signing out...' : 'Sign Out'}
              </Text>
              {!isSigningOut && (
                <Ionicons name="chevron-forward" size={20} color={colors.warning} />
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
