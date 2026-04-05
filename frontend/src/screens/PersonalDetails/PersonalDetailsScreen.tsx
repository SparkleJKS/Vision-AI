import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { useBackHandler } from '@/navigators';
import { labelForGender } from '@/firestore';
import { navigationActions } from '@/store/actions/navigation';
import type { AppDispatch } from '@/store';
import {
  AccountCard,
  AdditionalSection,
  AgeFieldCard,
  BloodGroupPickerModal,
  GenderPickerModal,
  GenderRow,
  LocationCard,
  SafetySection,
} from './components';
import { usePersonalDetailsForm } from './hooks';

const PersonalDetailsScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const form = usePersonalDetailsForm();

  const handleBack = () => dispatch(navigationActions.toBack());
  useBackHandler({ onBack: handleBack });

  return (
    <View
      className="flex-1"
      style={{ paddingTop: insets.top, backgroundColor: theme.screenBg }}>
      <TouchableOpacity
        className="flex-row items-center px-4 pt-4 pb-2"
        onPress={handleBack}
        activeOpacity={0.8}>
        <Ionicons name="arrow-back" size={24} color={theme.white} />
        <Text className="text-base ml-2" style={{ color: theme.white }}>
          Back
        </Text>
      </TouchableOpacity>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{
          paddingBottom: insets.bottom + 32,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Text
          className="text-2xl font-extrabold tracking-tight mt-8"
          style={{ color: theme.white }}>
          Personal details
        </Text>

        {form.loading && (
          <View className="py-16 items-center">
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        )}

        {form.error && (
          <Text className="text-sm mb-4" style={{ color: theme.warning }}>
            {form.error}
          </Text>
        )}

        {form.savingExtras && (
          <View className="flex-row items-center gap-2 my-2">
            <ActivityIndicator size="small" color={theme.primary} />
            <Text className="text-xs" style={{ color: theme.grey }}>
              Saving…
            </Text>
          </View>
        )}

        <Text
          className="text-xs font-bold uppercase tracking-wider mt-8 mb-2"
          style={{ color: theme.grey }}>
          Account
        </Text>
        <AccountCard
          theme={theme}
          displayName={form.authDisplayName}
          email={form.authEmail}
        />

        <Text
          className="text-xs font-bold uppercase tracking-wider mb-2"
          style={{ color: theme.grey }}>
          About you
        </Text>

        <GenderRow
          theme={theme}
          label="Gender"
          valueLabel={labelForGender(form.profile?.gender)}
          onPress={() => form.setGenderModalOpen(true)}
          disabled={!form.editable || form.savingGender}
          saving={form.savingGender}
        />

        <AgeFieldCard
          theme={theme}
          ageInput={form.ageInput}
          setAgeInput={form.setAgeInput}
          setAgeHint={form.setAgeHint}
          ageHint={form.ageHint}
          onBlurCommit={form.commitAge}
          saving={form.savingAge}
          editable={form.editable}
        />

        <LocationCard
          theme={theme}
          cityDraft={form.cityDraft}
          setCityDraft={form.setCityDraft}
          onCommitCity={() => {
            void form.commitCity();
          }}
          savingExtras={form.savingExtras}
          editable={form.editable}
        />

        <SafetySection
          theme={theme}
          expanded={form.safetyExpanded}
          onToggle={() => form.setSafetyExpanded(v => !v)}
          profile={form.profile}
          emergencyContactsDraft={form.emergencyContactsDraft}
          onEmergencyFieldChange={form.updateEmergencyField}
          onCommitEmergencyContacts={() => {
            void form.commitEmergencyContacts();
          }}
          onAddEmergencyContact={form.addEmergencyContact}
          onRemoveEmergencyContact={form.removeEmergencyContact}
          medicalDraft={form.medicalDraft}
          setMedicalDraft={form.setMedicalDraft}
          onCommitMedical={() => {
            void form.commitMedical();
          }}
          onOpenBloodModal={() => form.setBloodModalOpen(true)}
          savingExtras={form.savingExtras}
          savingBlood={form.savingBlood}
          editable={form.editable}
        />

        <AdditionalSection
          theme={theme}
          expanded={form.additionalExpanded}
          onToggle={() => form.setAdditionalExpanded(v => !v)}
          occupationDraft={form.occupationDraft}
          setOccupationDraft={form.setOccupationDraft}
          onCommitOccupation={() => {
            void form.commitOccupation();
          }}
          livingDraft={form.livingDraft}
          setLivingDraft={form.setLivingDraft}
          onCommitLiving={() => {
            void form.commitLiving();
          }}
          savingExtras={form.savingExtras}
          editable={form.editable}
        />
      </ScrollView>

      <GenderPickerModal
        visible={form.genderModalOpen}
        theme={theme}
        onClose={() => form.setGenderModalOpen(false)}
        profileGender={form.profile?.gender}
        saving={form.savingGender}
        onPick={form.pickGender}
      />

      <BloodGroupPickerModal
        visible={form.bloodModalOpen}
        theme={theme}
        onClose={() => form.setBloodModalOpen(false)}
        profileBloodGroup={form.profile?.bloodGroup}
        saving={form.savingBlood}
        onPick={form.pickBloodGroup}
        onClear={form.clearBloodGroup}
      />
    </View>
  );
};

export default PersonalDetailsScreen;
