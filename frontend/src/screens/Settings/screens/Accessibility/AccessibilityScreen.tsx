import { Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../../../theme';
import { useBackHandler } from '../../../../navigators';

export function AccessibilityScreen() {
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

      <View className="flex-1 px-4 items-center justify-center">
        <Text className="text-white text-lg text-center">
          Accessibility settings — coming soon
        </Text>
      </View>
    </View>
  );
}
