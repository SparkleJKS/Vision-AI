import { Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import {
  BLOOD_GROUP_OPTIONS,
  type BloodGroupOption,
  type UserProfile,
} from '@/firestore';
import type { ThemeTokens } from '@/theme';
import { SheetModalShell } from './SheetModalShell';

type Props = {
  visible: boolean;
  theme: ThemeTokens;
  onClose: () => void;
  profileBloodGroup: UserProfile['bloodGroup'];
  saving: boolean;
  onPick: (value: BloodGroupOption) => void;
  onClear: () => void;
};

export const BloodGroupPickerModal = ({
  visible,
  theme,
  onClose,
  profileBloodGroup,
  saving,
  onPick,
  onClear,
}: Props) => (
  <SheetModalShell
    visible={visible}
    title="Blood group"
    theme={theme}
    onRequestClose={onClose}
    backdropDisabled={saving}
    scrollable
    sheetClassName="max-h-[85%]">
    <TouchableOpacity
      className="py-3.5 px-3 rounded-xl mb-2 flex-row items-center justify-between border"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: profileBloodGroup == null ? theme.primary : theme.border,
      }}
      activeOpacity={0.85}
      disabled={saving}
      onPress={() => {
        if (profileBloodGroup == null) {
          onClose();
          return;
        }
        void onClear();
      }}>
      <Text
        className="text-[16px] font-semibold"
        style={{ color: theme.white }}>
        Not set
      </Text>
      {profileBloodGroup == null ? (
        <Ionicons name="checkmark-circle" size={22} color={theme.primary} />
      ) : null}
    </TouchableOpacity>
    {BLOOD_GROUP_OPTIONS.map(opt => (
      <TouchableOpacity
        key={opt.value}
        className="py-3.5 px-3 rounded-xl mb-2 flex-row items-center justify-between border"
        style={{
          backgroundColor: theme.cardBg,
          borderColor:
            profileBloodGroup === opt.value ? theme.primary : theme.border,
        }}
        activeOpacity={0.85}
        disabled={saving}
        onPress={() => void onPick(opt.value)}>
        <Text
          className="text-[16px] font-semibold"
          style={{ color: theme.white }}>
          {opt.label}
        </Text>
        {profileBloodGroup === opt.value ? (
          <Ionicons name="checkmark-circle" size={22} color={theme.primary} />
        ) : null}
      </TouchableOpacity>
    ))}
  </SheetModalShell>
);
