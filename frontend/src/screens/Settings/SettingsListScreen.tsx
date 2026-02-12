import React from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import type { SettingsStackParamList } from './SettingsStack';

const SETTINGS_ITEMS = [
  {
    id: 'voice',
    title: 'Voice & Audio',
    subtitle: 'Adjust speed & pitch',
    icon: 'volume-high' as const,
  },
  {
    id: 'vision',
    title: 'Vision Settings',
    subtitle: 'Contrast & detection modes',
    icon: 'eye' as const,
  },
  {
    id: 'devices',
    title: 'Connected Devices',
    subtitle: 'Glasses & hearing aids',
    icon: 'bluetooth' as const,
  },
  {
    id: 'accessibility',
    title: 'Accessibility',
    subtitle: 'Haptics & gestures',
    icon: 'accessibility' as const,
  },
  {
    id: 'profile',
    title: 'Profile',
    subtitle: 'Personal details & preferences',
    icon: 'person' as const,
  },
];

type NavProp = NativeStackNavigationProp<SettingsStackParamList, 'SettingsList'>;

export function SettingsListScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();

  return (
    <View
      className="flex-1 bg-screen"
      style={{ paddingTop: insets.top }}
    >
      <Text className="text-white text-[28px] font-bold px-4 pt-6 pb-4">
        Settings
      </Text>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
      >
        {SETTINGS_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.id}
            className="bg-card rounded-2xl p-4 mb-3 flex-row items-center"
            activeOpacity={0.8}
            onPress={() =>
              item.id === 'profile' ? navigation.navigate('Profile') : undefined
            }
          >
            <View className="w-12 h-12 rounded-full bg-card-light items-center justify-center mr-4">
              <Ionicons
                name={item.icon}
                size={24}
                color={colors.white}
              />
            </View>
            <View className="flex-1">
              <Text className="text-white text-lg font-bold">{item.title}</Text>
              <Text className="text-grey text-sm mt-0.5">{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.grey} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
