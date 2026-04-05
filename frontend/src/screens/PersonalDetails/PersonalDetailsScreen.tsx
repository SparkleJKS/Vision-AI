import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { useBackHandler } from '@/navigators';
import { useAuth } from '@/auth/AuthContext';
import {
  GENDER_OPTIONS,
  labelForGender,
  useUserProfile,
  type GenderOption,
} from '@/firestore';
import { navigationActions } from '@/store/actions/navigation';
import type { AppDispatch } from '@/store';

const MIN_AGE = 1;
const MAX_AGE = 130;

const PersonalDetailsScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { profile, loading, error, updateProfile, removeProfileAge } =
    useUserProfile();

  const handleBack = () => dispatch(navigationActions.toBack());
  useBackHandler({ onBack: handleBack });

  const [genderModalOpen, setGenderModalOpen] = useState<boolean>(false);
  const [ageInput, setAgeInput] = useState<number | null>(null);
  const [savingGender, setSavingGender] = useState(false);
  const [savingAge, setSavingAge] = useState(false);
  const [ageHint, setAgeHint] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.age != null && !Number.isNaN(profile.age)) {
      setAgeInput(profile.age);
    } else {
      setAgeInput(null);
    }
  }, [profile?.age]);

  const authDisplayName =
    user?.displayName?.trim() ||
    (user?.email ? user.email.split('@')[0] : '') ||
    '—';
  const authEmail = user?.email ?? '—';

  const pickGender = useCallback(
    async (value: GenderOption) => {
      setSavingGender(true);
      try {
        await updateProfile({ gender: value });
        setGenderModalOpen(false);
      } finally {
        setSavingGender(false);
      }
    },
    [updateProfile],
  );

  const commitAge = useCallback(async () => {
    setAgeHint(null);
    if (ageInput === null) {
      if (profile?.age != null) {
        setSavingAge(true);
        try {
          await removeProfileAge();
        } finally {
          setSavingAge(false);
        }
      }
      return;
    }
    const n = ageInput;
    if (n < MIN_AGE || n > MAX_AGE) {
      setAgeHint(`Age must be between ${MIN_AGE} and ${MAX_AGE}.`);
      setAgeInput(profile?.age != null ? profile.age : null);
      return;
    }
    if (n === profile?.age) return;
    setSavingAge(true);
    try {
      await updateProfile({ age: n });
    } finally {
      setSavingAge(false);
    }
  }, [ageInput, profile?.age, removeProfileAge, updateProfile]);

  const inputSurface = {
    backgroundColor: theme.cardBg,
    borderColor: theme.border,
    color: theme.white,
  } as const;

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

        {loading && (
          <View className="py-16 items-center">
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        )}

        {error && (
          <Text className="text-sm mb-4" style={{ color: theme.warning }}>
            {error}
          </Text>
        )}

        <Text
          className="text-xs font-bold uppercase tracking-wider mt-8 mb-2"
          style={{ color: theme.grey }}>
          Account
        </Text>
        <View
          className="rounded-2xl border overflow-hidden mb-6"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.border,
          }}>
          <View
            className="px-4 py-3 border-b"
            style={{ borderColor: theme.border }}>
            <Text
              className="text-xs font-semibold mb-1"
              style={{ color: theme.grey }}>
              Name
            </Text>
            <Text
              className="text-base font-semibold"
              style={{ color: theme.white }}>
              {authDisplayName}
            </Text>
          </View>
          <View className="px-4 py-3">
            <Text
              className="text-xs font-semibold mb-1"
              style={{ color: theme.grey }}>
              Email
            </Text>
            <Text
              className="text-base font-semibold"
              style={{ color: theme.white }}>
              {authEmail}
            </Text>
          </View>
        </View>

        <Text
          className="text-xs font-bold uppercase tracking-wider mb-2"
          style={{ color: theme.grey }}>
          About you
        </Text>

        <TouchableOpacity
          className="rounded-2xl border px-4 py-3 mb-3 flex-row items-center justify-between"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.border,
          }}
          activeOpacity={0.85}
          onPress={() => setGenderModalOpen(true)}
          disabled={!user?.uid || savingGender}>
          <View>
            <Text
              className="text-xs font-semibold mb-1"
              style={{ color: theme.grey }}>
              Gender
            </Text>
            <Text
              className="text-base font-semibold"
              style={{ color: theme.white }}>
              {labelForGender(profile?.gender)}
            </Text>
          </View>
          {savingGender ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <Ionicons name="chevron-forward" size={20} color={theme.grey} />
          )}
        </TouchableOpacity>

        <View
          className="rounded-2xl border px-4 py-3 mb-2"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.border,
          }}>
          <Text
            className="text-xs font-semibold mb-2"
            style={{ color: theme.grey }}>
            Age
          </Text>
          <TextInput
            value={ageInput === null ? '' : String(ageInput)}
            onChangeText={text => {
              setAgeHint(null);
              const digits = text.replace(/[^0-9]/g, '');
              if (digits === '') {
                setAgeInput(null);
                return;
              }
              const n = parseInt(digits, 10);
              if (!Number.isNaN(n)) setAgeInput(n);
            }}
            onBlur={() => {
              void commitAge();
            }}
            placeholder="Optional"
            placeholderTextColor={theme.grey}
            keyboardType="number-pad"
            maxLength={3}
            editable={!!user?.uid && !savingAge}
            className="text-base font-semibold py-2 px-3 rounded-xl border"
            style={inputSurface}
          />
          {ageHint && (
            <Text className="text-xs mt-2" style={{ color: theme.warning }}>
              {ageHint}
            </Text>
          )}
          {savingAge && (
            <ActivityIndicator
              className="mt-2"
              size="small"
              color={theme.primary}
            />
          )}
        </View>
      </ScrollView>

      <Modal
        visible={genderModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setGenderModalOpen(false)}>
        <View className="flex-1 justify-end">
          <Pressable
            className="flex-1"
            style={{ backgroundColor: '#000000aa' }}
            onPress={() => !savingGender && setGenderModalOpen(false)}
          />
          <View
            className="rounded-t-3xl px-4 pt-4 pb-8"
            style={{
              backgroundColor: theme.screenBg,
              paddingBottom: insets.bottom + 16,
            }}>
            <View className="items-center mb-4">
              <View
                className="w-10 h-1 rounded-full mb-4"
                style={{ backgroundColor: theme.border }}
              />
              <Text
                className="text-lg font-bold"
                style={{ color: theme.white }}>
                Gender
              </Text>
            </View>
            {GENDER_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                className="py-3.5 px-3 rounded-xl mb-2 flex-row items-center justify-between border"
                style={{
                  backgroundColor: theme.cardBg,
                  borderColor:
                    profile?.gender === opt.value
                      ? theme.primary
                      : theme.border,
                }}
                activeOpacity={0.85}
                disabled={savingGender}
                onPress={() => void pickGender(opt.value)}>
                <Text
                  className="text-[16px] font-semibold"
                  style={{ color: theme.white }}>
                  {opt.label}
                </Text>
                {profile?.gender === opt.value && (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={theme.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              className="mt-2 py-3 items-center"
              onPress={() => setGenderModalOpen(false)}
              disabled={savingGender}>
              <Text
                className="text-base font-semibold"
                style={{ color: theme.grey }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default PersonalDetailsScreen;
