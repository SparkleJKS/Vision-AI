import React from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useBackHandler } from '../../navigators';

const FEATURE_CARDS = [
  {
    id: 'describe',
    title: 'Describe Object',
    subtitle: 'Identify items around you',
    icon: 'camera',
    highlighted: true,
  },
  {
    id: 'scene',
    title: 'Scene Summary',
    subtitle: 'Get a full room overview',
    icon: 'eye',
    highlighted: false,
  },
  {
    id: 'read',
    title: 'Read Text',
    subtitle: 'Scan documents & signs',
    icon: 'document-text',
    highlighted: false,
  },
  {
    id: 'navigation',
    title: 'Navigation',
    subtitle: 'Find your way safely',
    icon: 'locate',
    highlighted: false,
  },
];

const RECENT_ITEMS = [
  { id: '1', title: 'Find Keys', icon: 'search' },
  { id: '2', title: 'Read Menu', icon: 'book' },
];

const USER_NAME = 'Alex';

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  useBackHandler({
    showExitPrompt: true,
  })

  const cardGap = 12;
  const recentCardWidth = (width - 32 - insets.left - insets.right - cardGap) / 2;

  return (
    <View className="flex-1 bg-screen" style={{ paddingTop: insets.top }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: insets.bottom + 80,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-white text-[28px] font-bold">
              Hello, <Text className="text-accent">{USER_NAME}</Text>
            </Text>
          </View>
          <TouchableOpacity
            className="w-11 h-11 rounded-full bg-accent items-center justify-center"
            activeOpacity={0.8}
          >
            <Text className="text-black text-lg font-bold">{USER_NAME[0]}</Text>
          </TouchableOpacity>
        </View>

        {/* System Status Card */}
        <View className="bg-card rounded-2xl p-4 mb-3 flex-row justify-between items-center">
          <View className="flex-1">
            <Text className="text-grey text-xs mb-1">System Status</Text>
            <View className="flex-row items-center gap-2">
              <View className="w-2 h-2 rounded-full bg-success" />
              <Text className="text-white text-lg font-semibold">
                Online & Ready
              </Text>
            </View>
          </View>
          <View className="ml-3">
            <Ionicons
              name="cellular"
              size={24}
              color={colors.accentYellow}
            />
          </View>
        </View>

        {/* Feature Cards */}
        {FEATURE_CARDS.map((card) => (
          <TouchableOpacity
            key={card.id}
            className={`flex-row items-center rounded-2xl p-4 mb-3 ${
              card.highlighted ? 'bg-accent' : 'bg-card'
            }`}
            activeOpacity={0.8}
          >
            <View
              className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${
                card.highlighted ? 'bg-white/50' : 'bg-card-light'
              }`}
            >
              <Ionicons
                name={card.icon as any}
                size={24}
                color={card.highlighted ? '#000000' : colors.white}
              />
            </View>
            <View className="flex-1">
              <Text
                className={`text-lg font-bold mb-0.5 ${
                  card.highlighted ? 'text-black' : 'text-white'
                }`}
              >
                {card.title}
              </Text>
              <Text
                className={`text-sm ${
                  card.highlighted ? 'text-black/70' : 'text-grey'
                }`}
              >
                {card.subtitle}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* RECENT Section */}
        <Text className="text-white text-sm font-bold uppercase mt-6 mb-3">
          RECENT
        </Text>
        <View className="flex-row gap-3">
          {RECENT_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              className="bg-card rounded-2xl p-5 items-center min-h-[120px]"
              style={{ width: recentCardWidth }}
              activeOpacity={0.8}
            >
              <View className="mb-3">
                <Ionicons
                  name={item.icon as any}
                  size={28}
                  color={colors.accentYellow}
                />
              </View>
              <Text className="text-white text-sm font-bold text-center">
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
