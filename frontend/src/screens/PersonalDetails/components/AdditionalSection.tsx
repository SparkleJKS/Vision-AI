import type { ThemeTokens } from '@/theme';
import { MAX_LIVING, MAX_OCCUPATION } from '../constants';
import { CollapsibleSection } from './CollapsibleSection';
import { ProfileTextField } from './ProfileTextField';

type Props = {
  theme: ThemeTokens;
  expanded: boolean;
  onToggle: () => void;
  occupationDraft: string;
  setOccupationDraft: (s: string) => void;
  onCommitOccupation: () => void;
  livingDraft: string;
  setLivingDraft: (s: string) => void;
  onCommitLiving: () => void;
  savingExtras: boolean;
  editable: boolean;
};

export const AdditionalSection = ({
  theme,
  expanded,
  onToggle,
  occupationDraft,
  setOccupationDraft,
  onCommitOccupation,
  livingDraft,
  setLivingDraft,
  onCommitLiving,
  savingExtras,
  editable,
}: Props) => (
  <CollapsibleSection
    title="Work & Living"
    subtitle="Your work and home life"
    expanded={expanded}
    onToggle={onToggle}
    theme={theme}>
    <ProfileTextField
      theme={theme}
      label="Occupation"
      optional
      value={occupationDraft}
      onChangeText={setOccupationDraft}
      onBlur={onCommitOccupation}
      maxLength={MAX_OCCUPATION}
      placeholder="What you do"
      editable={editable && !savingExtras}
    />
    <ProfileTextField
      theme={theme}
      label="Living situation"
      optional
      value={livingDraft}
      onChangeText={setLivingDraft}
      onBlur={onCommitLiving}
      maxLength={MAX_LIVING}
      placeholder="e.g. Alone, with family"
      editable={editable && !savingExtras}
    />
  </CollapsibleSection>
);
