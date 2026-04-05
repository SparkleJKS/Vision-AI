import type { ReactNode } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ThemeTokens } from '@/theme';

type Props = {
  visible: boolean;
  title: string;
  theme: ThemeTokens;
  onRequestClose: () => void;
  backdropDisabled?: boolean;
  children: ReactNode;
  scrollable?: boolean;
  sheetClassName?: string;
};

export const SheetModalShell = ({
  visible,
  title,
  theme,
  onRequestClose,
  backdropDisabled = false,
  children,
  scrollable = false,
  sheetClassName = '',
}: Props) => {
  const insets = useSafeAreaInsets();

  const body = scrollable ? (
    <ScrollView keyboardShouldPersistTaps="handled">{children}</ScrollView>
  ) : (
    <View>{children}</View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose}>
      <View className="flex-1 justify-end">
        <Pressable
          className="flex-1"
          style={{ backgroundColor: '#000000aa' }}
          onPress={() => !backdropDisabled && onRequestClose()}
        />
        <View
          className={`rounded-t-3xl px-4 pt-4 pb-8 ${sheetClassName}`}
          style={{
            backgroundColor: theme.screenBg,
            paddingBottom: insets.bottom + 16,
          }}>
          <View className="items-center mb-4">
            <View
              className="w-10 h-1 rounded-full mb-4"
              style={{ backgroundColor: theme.border }}
            />
            <Text className="text-lg font-bold" style={{ color: theme.white }}>
              {title}
            </Text>
          </View>
          {body}
          <TouchableOpacity
            className="mt-2 py-3 items-center"
            onPress={onRequestClose}
            disabled={backdropDisabled}>
            <Text
              className="text-base font-semibold"
              style={{ color: theme.grey }}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
