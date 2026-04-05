import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import {
  labelForBloodGroup,
  type EmergencyContactEntry,
  type UserProfile,
} from '@/firestore';
import type { ThemeTokens } from '@/theme';
import { MAX_MEDICAL } from '../constants';
import { CollapsibleSection } from './CollapsibleSection';
import { EmergencyContactsEditor } from './EmergencyContactsEditor';
import { ProfileTextField } from './ProfileTextField';

type Props = {
  theme: ThemeTokens;
  expanded: boolean;
  onToggle: () => void;
  profile: UserProfile | null;
  emergencyContactsDraft: EmergencyContactEntry[];
  onEmergencyFieldChange: (
    index: number,
    field: keyof EmergencyContactEntry,
    value: string,
  ) => void;
  onCommitEmergencyContacts: () => void;
  onAddEmergencyContact: () => void;
  onRemoveEmergencyContact: (index: number) => void;
  medicalDraft: string;
  setMedicalDraft: (s: string) => void;
  onCommitMedical: () => void;
  onOpenBloodModal: () => void;
  savingExtras: boolean;
  savingBlood: boolean;
  editable: boolean;
};

export const SafetySection = ({
  theme,
  expanded,
  onToggle,
  profile,
  emergencyContactsDraft,
  onEmergencyFieldChange,
  onCommitEmergencyContacts,
  onAddEmergencyContact,
  onRemoveEmergencyContact,
  medicalDraft,
  setMedicalDraft,
  onCommitMedical,
  onOpenBloodModal,
  savingExtras,
  savingBlood,
  editable,
}: Props) => (
  <CollapsibleSection
    title="Safety"
    subtitle="Emergency and health info"
    expanded={expanded}
    onToggle={onToggle}
    theme={theme}>
    <EmergencyContactsEditor
      theme={theme}
      contacts={emergencyContactsDraft}
      onChangeField={onEmergencyFieldChange}
      onBlurCommit={() => {
        void onCommitEmergencyContacts();
      }}
      onAdd={onAddEmergencyContact}
      onRemove={index => {
        void onRemoveEmergencyContact(index);
      }}
      editable={editable}
      savingExtras={savingExtras}
    />
    <View>
      <Text
        className="text-xs font-semibold mb-2"
        style={{ color: theme.grey }}>
        Blood group (Optional)
      </Text>
      <TouchableOpacity
        className="rounded-xl border px-3 py-3 flex-row items-center justify-between"
        style={{
          backgroundColor: theme.screenBg,
          borderColor: theme.border,
        }}
        onPress={onOpenBloodModal}
        disabled={!editable || savingBlood}
        activeOpacity={0.85}>
        <Text
          className="text-base font-semibold"
          style={{ color: theme.white }}>
          {labelForBloodGroup(profile?.bloodGroup)}
        </Text>
        {savingBlood ? (
          <ActivityIndicator size="small" color={theme.primary} />
        ) : (
          <Ionicons name="chevron-forward" size={20} color={theme.grey} />
        )}
      </TouchableOpacity>
    </View>
    <ProfileTextField
      theme={theme}
      label="Medical notes"
      optional
      value={medicalDraft}
      onChangeText={setMedicalDraft}
      onBlur={onCommitMedical}
      maxLength={MAX_MEDICAL}
      multiline
      minHeight={120}
      placeholder="Allergies, conditions, medications…"
      editable={editable && !savingExtras}
    />
  </CollapsibleSection>
);
