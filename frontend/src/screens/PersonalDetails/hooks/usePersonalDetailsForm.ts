import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import {
  emergencyContactsDraftFromProfile,
  emergencyContactsEqual,
  emergencyContactsFromStored,
  MAX_EMERGENCY_CONTACTS,
  updateEmergencyContacts,
  useUserProfile,
  type BloodGroupOption,
  type EmergencyContactEntry,
  type GenderOption,
} from '@/firestore';
import { parseIndianMobile } from '@/utils/openPhoneDialer';
import { showToast } from '@/utils/toast';
import { MAX_AGE, MIN_AGE } from '../constants';

const toastSaveFailed = () =>
  showToast.error(
    "Couldn't save changes",
    'Check your connection and try again.',
  );

export const usePersonalDetailsForm = () => {
  const { user } = useAuth();
  const {
    profile,
    loading,
    error,
    updateProfile,
    removeProfileAge,
    removeProfileBloodGroup,
  } = useUserProfile();

  const [genderModalOpen, setGenderModalOpen] = useState<boolean>(false);
  const [bloodModalOpen, setBloodModalOpen] = useState<boolean>(false);
  const [safetyExpanded, setSafetyExpanded] = useState<boolean>(false);
  const [additionalExpanded, setAdditionalExpanded] = useState<boolean>(false);

  const [ageInput, setAgeInput] = useState<number | null>(null);
  const [cityDraft, setCityDraft] = useState<string>('');
  const [emergencyContactsDraft, setEmergencyContactsDraft] = useState<
    EmergencyContactEntry[]
  >([{ name: '', phone: '', relationship: '' }]);
  const [medicalDraft, setMedicalDraft] = useState<string>('');
  const [occupationDraft, setOccupationDraft] = useState<string>('');
  const [livingDraft, setLivingDraft] = useState<string>('');

  const [savingGender, setSavingGender] = useState<boolean>(false);
  const [savingBlood, setSavingBlood] = useState<boolean>(false);
  const [savingAge, setSavingAge] = useState<boolean>(false);
  const [savingExtras, setSavingExtras] = useState<boolean>(false);
  const [ageHint, setAgeHint] = useState<string | null>(null);

  const profileEmergencyKey = useMemo(
    () => JSON.stringify(profile?.emergencyContacts ?? null),
    [profile?.emergencyContacts],
  );

  const profileRef = useRef(profile);
  profileRef.current = profile;

  useEffect(() => {
    if (profile?.age != null && !Number.isNaN(profile.age)) {
      setAgeInput(profile.age);
    } else {
      setAgeInput(null);
    }
  }, [profile?.age]);

  useEffect(() => {
    setCityDraft(profile?.cityOrArea ?? '');
    setMedicalDraft(profile?.medicalNotes ?? '');
    setOccupationDraft(profile?.occupation ?? '');
    setLivingDraft(profile?.livingSituation ?? '');
  }, [
    profile?.cityOrArea,
    profile?.medicalNotes,
    profile?.occupation,
    profile?.livingSituation,
  ]);

  useEffect(() => {
    setEmergencyContactsDraft(
      emergencyContactsDraftFromProfile(profileRef.current),
    );
  }, [profileEmergencyKey]);

  const authDisplayName =
    user?.displayName?.trim() ||
    (user?.email ? user.email.split('@')[0] : '') ||
    '—';
  const authEmail = user?.email ?? '—';
  const editable = !!user?.uid;

  const pickGender = useCallback(
    async (value: GenderOption) => {
      setSavingGender(true);
      try {
        await updateProfile({ gender: value });
        setGenderModalOpen(false);
      } catch {
        toastSaveFailed();
      } finally {
        setSavingGender(false);
      }
    },
    [updateProfile],
  );

  const pickBloodGroup = useCallback(
    async (value: BloodGroupOption) => {
      setSavingBlood(true);
      try {
        await updateProfile({ bloodGroup: value });
        setBloodModalOpen(false);
      } catch {
        toastSaveFailed();
      } finally {
        setSavingBlood(false);
      }
    },
    [updateProfile],
  );

  const clearBloodGroup = useCallback(async () => {
    setSavingBlood(true);
    try {
      await removeProfileBloodGroup();
      setBloodModalOpen(false);
    } catch {
      toastSaveFailed();
    } finally {
      setSavingBlood(false);
    }
  }, [removeProfileBloodGroup]);

  const commitAge = useCallback(async () => {
    setAgeHint(null);
    if (ageInput === null) {
      if (profile?.age != null) {
        setSavingAge(true);
        try {
          await removeProfileAge();
        } catch {
          toastSaveFailed();
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
    } catch {
      toastSaveFailed();
    } finally {
      setSavingAge(false);
    }
  }, [ageInput, profile?.age, removeProfileAge, updateProfile]);

  const commitCity = useCallback(async () => {
    const next = cityDraft.trim();
    const prev = profile?.cityOrArea ?? '';
    if (next === prev) return;
    setSavingExtras(true);
    try {
      await updateProfile({ cityOrArea: next });
    } catch {
      toastSaveFailed();
    } finally {
      setSavingExtras(false);
    }
  }, [cityDraft, profile?.cityOrArea, updateProfile]);

  const updateEmergencyField = useCallback(
    (index: number, field: keyof EmergencyContactEntry, value: string) => {
      setEmergencyContactsDraft(prev => {
        const next = [...prev];
        next[index] = { ...next[index], [field]: value };
        return next;
      });
    },
    [],
  );

  const commitEmergencyContacts = useCallback(async () => {
    if (!user?.uid) return;
    if (
      emergencyContactsEqual(
        emergencyContactsDraft,
        emergencyContactsFromStored(profile),
      )
    ) {
      return;
    }

    const invalid = emergencyContactsDraft.find(
      c => c.phone.trim() !== '' && !parseIndianMobile(c.phone),
    );
    if (invalid) {
      showToast.info(
        'Fix phone number',
        'Emergency contact phone must be a valid mobile number.',
      );
      return;
    }

    setSavingExtras(true);
    try {
      await updateEmergencyContacts(user.uid, emergencyContactsDraft);
    } catch {
      toastSaveFailed();
    } finally {
      setSavingExtras(false);
    }
  }, [emergencyContactsDraft, profile, user?.uid]);

  const addEmergencyContact = useCallback(() => {
    setEmergencyContactsDraft(prev => {
      if (prev.length >= MAX_EMERGENCY_CONTACTS) return prev;
      return [...prev, { name: '', phone: '', relationship: '' }];
    });
  }, []);

  const removeEmergencyContact = useCallback(
    async (index: number) => {
      if (!user?.uid) return;
      const next =
        emergencyContactsDraft.length <= 1
          ? [{ name: '', phone: '', relationship: '' }]
          : emergencyContactsDraft.filter((_, i) => i !== index);
      setEmergencyContactsDraft(next);
      setSavingExtras(true);
      try {
        await updateEmergencyContacts(user.uid, next);
      } catch {
        toastSaveFailed();
      } finally {
        setSavingExtras(false);
      }
    },
    [emergencyContactsDraft, user?.uid],
  );

  const commitMedical = useCallback(async () => {
    const next = medicalDraft.trim();
    const prev = profile?.medicalNotes ?? '';
    if (next === prev) return;
    setSavingExtras(true);
    try {
      await updateProfile({ medicalNotes: next });
    } catch {
      toastSaveFailed();
    } finally {
      setSavingExtras(false);
    }
  }, [medicalDraft, profile?.medicalNotes, updateProfile]);

  const commitOccupation = useCallback(async () => {
    const next = occupationDraft.trim();
    const prev = profile?.occupation ?? '';
    if (next === prev) return;
    setSavingExtras(true);
    try {
      await updateProfile({ occupation: next });
    } catch {
      toastSaveFailed();
    } finally {
      setSavingExtras(false);
    }
  }, [occupationDraft, profile?.occupation, updateProfile]);

  const commitLiving = useCallback(async () => {
    const next = livingDraft.trim();
    const prev = profile?.livingSituation ?? '';
    if (next === prev) return;
    setSavingExtras(true);
    try {
      await updateProfile({ livingSituation: next });
    } catch {
      toastSaveFailed();
    } finally {
      setSavingExtras(false);
    }
  }, [livingDraft, profile?.livingSituation, updateProfile]);

  return {
    profile,
    loading,
    error,
    editable,
    authDisplayName,
    authEmail,
    genderModalOpen,
    setGenderModalOpen,
    bloodModalOpen,
    setBloodModalOpen,
    safetyExpanded,
    setSafetyExpanded,
    additionalExpanded,
    setAdditionalExpanded,
    ageInput,
    setAgeInput,
    ageHint,
    setAgeHint,
    savingAge,
    commitAge,
    cityDraft,
    setCityDraft,
    commitCity,
    emergencyContactsDraft,
    updateEmergencyField,
    commitEmergencyContacts,
    addEmergencyContact,
    removeEmergencyContact,
    medicalDraft,
    setMedicalDraft,
    commitMedical,
    occupationDraft,
    setOccupationDraft,
    commitOccupation,
    livingDraft,
    setLivingDraft,
    commitLiving,
    savingGender,
    savingBlood,
    savingExtras,
    pickGender,
    pickBloodGroup,
    clearBloodGroup,
  };
};
