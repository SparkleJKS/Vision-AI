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
import { colors } from '../../../../theme';
import { useBackHandler } from '../../../../navigators';

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

const USER_NAME = 'Alex Johnson';
const USER_STATUS = 'Vision Premium User';

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  useBackHandler({
    onBack: () => navigation.goBack(),
  });

  return (
    <View
      className="flex-1 bg-screen"
      style={{ paddingTop: insets.top }}
    >
      <TouchableOpacity
        className="flex-row items-center px-4 pt-4 pb-2"
        onPress={() => navigation.goBack()}
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
          <Text className="text-black text-3xl font-bold">{USER_NAME[0]}</Text>
        </View>
        <Text className="text-white text-2xl font-bold">{USER_NAME}</Text>
        <Text className="text-grey text-sm mt-1">{USER_STATUS}</Text>

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

          <TouchableOpacity
            className="bg-card rounded-2xl p-4 flex-row items-center border border-warning"
            activeOpacity={0.8}
          >
            <View className="w-12 h-12 rounded-full bg-card-light items-center justify-center mr-4">
              <Ionicons
                name="log-out-outline"
                size={24}
                color={colors.warning}
              />
            </View>
            <Text className="text-warning text-lg font-bold flex-1">
              Sign Out
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.warning} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
