import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import {
  GENDER_OPTIONS,
  type GenderOption,
  type UserProfile,
} from '@/firestore';
import type { ThemeTokens } from '@/theme';
import { SheetModalShell } from './SheetModalShell';

type Props = {
  visible: boolean;
  theme: ThemeTokens;
  onClose: () => void;
  profileGender: UserProfile['gender'];
  saving: boolean;
  onPick: (value: GenderOption) => void;
};

export const GenderPickerModal = ({
  visible,
  theme,
  onClose,
  profileGender,
  saving,
  onPick,
}: Props) => (
  <SheetModalShell
    visible={visible}
    title="Gender"
    theme={theme}
    onRequestClose={onClose}
    backdropDisabled={saving}>
    {GENDER_OPTIONS.map(opt => (
      <TouchableOpacity
        key={opt.value}
        className="py-3.5 px-3 rounded-xl mb-2 flex-row items-center justify-between border"
        style={{
          backgroundColor: theme.cardBg,
          borderColor:
            profileGender === opt.value ? theme.primary : theme.border,
        }}
        activeOpacity={0.85}
        disabled={saving}
        onPress={() => void onPick(opt.value)}>
        <Text
          className="text-[16px] font-semibold"
          style={{ color: theme.white }}>
          {opt.label}
        </Text>
        {profileGender === opt.value ? (
          <Ionicons name="checkmark-circle" size={22} color={theme.primary} />
        ) : null}
      </TouchableOpacity>
    ))}
  </SheetModalShell>
);
