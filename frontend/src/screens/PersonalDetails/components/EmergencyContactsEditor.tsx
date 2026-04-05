import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import {
  MAX_EMERGENCY_CONTACTS,
  type EmergencyContactEntry,
} from '@/firestore';
import type { ThemeTokens } from '@/theme';
import { showToast } from '@/utils/toast';
import { MAX_EC_NAME, MAX_EC_PHONE, MAX_EC_RELATIONSHIP } from '../constants';
import { ProfileTextField } from './ProfileTextField';

type Props = {
  theme: ThemeTokens;
  contacts: EmergencyContactEntry[];
  onChangeField: (
    index: number,
    field: keyof EmergencyContactEntry,
    value: string,
  ) => void;
  onBlurCommit: () => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  editable: boolean;
  savingExtras: boolean;
};

const contactHasAnyDetail = (c: EmergencyContactEntry) =>
  c.name.trim() !== '' ||
  c.phone.trim() !== '' ||
  c.relationship.trim() !== '';

export const EmergencyContactsEditor = ({
  theme,
  contacts,
  onChangeField,
  onBlurCommit,
  onAdd,
  onRemove,
  editable,
  savingExtras,
}: Props) => {
  const canAdd = contacts.length < MAX_EMERGENCY_CONTACTS;
  const inputLocked = !editable || savingExtras;

  const handleAddPress = () => {
    const first = contacts[0];
    if (!first || !contactHasAnyDetail(first)) {
      showToast.info(
        'Finish contact 1 first',
        'Add a name, phone, or relationship before adding another contact.',
      );
      return;
    }
    onAdd();
  };

  return (
    <View className="gap-4">
      <Text className="text-xs font-semibold" style={{ color: theme.grey }}>
        Emergency contacts
      </Text>
      {contacts.map((row, index) => (
        <View
          key={index}
          className="rounded-xl border p-3 gap-3"
          style={{
            backgroundColor: theme.screenBg,
            borderColor: theme.border,
          }}>
          <View className="flex-row items-center justify-between mb-1">
            <Text
              className="text-xs font-bold uppercase tracking-wide"
              style={{ color: theme.muted }}>
              Contact {index + 1}
            </Text>
            {contacts.length > 1 && (
              <TouchableOpacity
                onPress={() => onRemove(index)}
                disabled={inputLocked}
                hitSlop={8}
                accessibilityLabel={`Remove emergency contact ${index + 1}`}>
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color={theme.warning}
                />
              </TouchableOpacity>
            )}
          </View>
          <ProfileTextField
            theme={theme}
            label="Name"
            value={row.name}
            onChangeText={v => onChangeField(index, 'name', v)}
            onBlur={onBlurCommit}
            maxLength={MAX_EC_NAME}
            placeholder="Full name"
            editable={!inputLocked}
          />
          <ProfileTextField
            theme={theme}
            label="Phone"
            value={row.phone}
            onChangeText={v => onChangeField(index, 'phone', v)}
            onBlur={onBlurCommit}
            maxLength={MAX_EC_PHONE}
            placeholder="Phone number"
            keyboardType="phone-pad"
            editable={!inputLocked}
          />
          <ProfileTextField
            theme={theme}
            label="Relationship"
            value={row.relationship}
            onChangeText={v => onChangeField(index, 'relationship', v)}
            onBlur={onBlurCommit}
            maxLength={MAX_EC_RELATIONSHIP}
            placeholder="e.g. Parent, partner"
            editable={!inputLocked}
          />
        </View>
      ))}
      {canAdd && (
        <TouchableOpacity
          className="flex-row items-center justify-center py-3 rounded-xl border"
          style={{
            borderColor: theme.primary,
            backgroundColor: theme.cardBg,
          }}
          onPress={handleAddPress}
          disabled={inputLocked}
          activeOpacity={0.85}>
          <Ionicons name="add-circle-outline" size={22} color={theme.primary} />
          <Text
            className="text-base font-semibold ml-2"
            style={{ color: theme.primary }}>
            Add another contact
          </Text>
        </TouchableOpacity>
      )}
      <Text className="text-xs" style={{ color: theme.muted }}>
        Up to {MAX_EMERGENCY_CONTACTS} contacts. Fill contact 1 before adding
        another. Saves when you leave a field.
      </Text>
    </View>
  );
};
