import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '@/theme/colors';
import { SETTINGS_ITEMS } from './config';
import type { ISettingsStackParamList } from '@/screens/screens.types';

type NavProp = NativeStackNavigationProp<ISettingsStackParamList>;

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
            onPress={() => navigation.navigate(item.screenName)}
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
