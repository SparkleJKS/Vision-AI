import { useCallback, useMemo, useState } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { useBackHandler } from '@/navigators';
import { navigationActions } from '@/store/actions/navigation';
import type { AppDispatch } from '@/store';
import {
  HELP_FAQ_SECTIONS,
  type HelpFaqItem,
  type HelpFaqSection,
} from './helpFaqData';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FaqRow = ({
  item,
  expanded,
  onToggle,
  theme,
}: {
  item: HelpFaqItem;
  expanded: boolean;
  onToggle: () => void;
  theme: import('@/theme/tokens').ThemeTokens;
}) => (
  <View
    className="rounded-xl mb-2 overflow-hidden border"
    style={{
      backgroundColor: theme.cardBg,
      borderColor: theme.border,
    }}>
    <TouchableOpacity
      className="flex-row items-center py-3.5 px-4"
      onPress={() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        onToggle();
      }}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      accessibilityLabel={`${item.question}. ${expanded ? 'Collapse' : 'Expand'} answer.`}>
      <Text
        className="text-[15px] font-semibold flex-1 pr-3 leading-5"
        style={{ color: theme.white }}>
        {item.question}
      </Text>
      <Ionicons
        name={expanded ? 'chevron-up' : 'chevron-down'}
        size={22}
        color={theme.grey}
      />
    </TouchableOpacity>
    {expanded ? (
      <View className="px-4 pb-4 pt-0">
        <Text
          className="text-[14px] leading-[22px]"
          style={{ color: theme.grey }}>
          {item.answer}
        </Text>
      </View>
    ) : null}
  </View>
);

const filterSections = (
  sections: HelpFaqSection[],
  query: string,
): HelpFaqSection[] => {
  const q = query.trim().toLowerCase();
  if (!q) return sections;

  return sections
    .map(section => ({
      ...section,
      items: section.items.filter(
        item =>
          item.question.toLowerCase().includes(q) ||
          item.answer.toLowerCase().includes(q),
      ),
    }))
    .filter(section => section.items.length > 0);
};

const HelpAndSupportScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [search, setSearch] = useState('');
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());

  const handleBack = () => dispatch(navigationActions.toBack());

  useBackHandler({ onBack: handleBack });

  const filteredSections = useMemo(
    () => filterSections(HELP_FAQ_SECTIONS, search),
    [search],
  );

  const toggleItem = useCallback((id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAllInSection = useCallback((section: HelpFaqSection) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenIds(prev => {
      const next = new Set(prev);
      const allOpen = section.items.every(i => next.has(i.id));
      if (allOpen) {
        section.items.forEach(i => next.delete(i.id));
      } else {
        section.items.forEach(i => next.add(i.id));
      }
      return next;
    });
  }, []);

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
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Text
          className="text-[26px] font-bold mt-1 mb-1 tracking-tight"
          style={{ color: theme.white }}>
          Help & Support
        </Text>
        <Text
          className="text-[15px] leading-[22px] mb-5"
          style={{ color: theme.grey }}>
          Find answers about VisionAI’s tabs, AI tools, voice commands,
          settings, and privacy. Content matches the current app behavior,
          including features that are still rolling out.
        </Text>

        <View
          className="flex-row items-center rounded-xl px-3 py-2.5 mb-6 border"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.border,
          }}>
          <Ionicons name="search" size={20} color={theme.grey} />
          <TextInput
            className="flex-1 text-[15px] py-1.5 px-2.5"
            style={{ color: theme.white }}
            placeholder="Search questions and answers"
            placeholderTextColor={theme.grey}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            accessibilityLabel="Search help articles"
          />
          {search.length > 0 ? (
            <TouchableOpacity
              onPress={() => setSearch('')}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={22} color={theme.grey} />
            </TouchableOpacity>
          ) : null}
        </View>

        {filteredSections.length === 0 ? (
          <View
            className="rounded-2xl p-6 items-center border"
            style={{
              backgroundColor: theme.cardBg,
              borderColor: theme.border,
            }}>
            <Ionicons name="search-outline" size={40} color={theme.grey} />
            <Text
              className="text-base font-semibold mt-3 text-center"
              style={{ color: theme.white }}>
              No matches
            </Text>
            <Text
              className="text-sm mt-2 text-center leading-5"
              style={{ color: theme.grey }}>
              Try different keywords, or clear the search to see all topics.
            </Text>
          </View>
        ) : (
          filteredSections.map(section => {
            const allExpanded =
              section.items.length > 0 &&
              section.items.every(i => openIds.has(i.id));
            return (
              <View key={section.id} className="mb-6">
                <View className="flex-row items-center justify-between mb-2.5 pr-1">
                  <Text
                    className="text-xs font-bold uppercase tracking-wider flex-1"
                    style={{ color: theme.grey }}>
                    {section.title}
                  </Text>
                  {section.items.length > 1 ? (
                    <TouchableOpacity
                      onPress={() => expandAllInSection(section)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={
                        allExpanded
                          ? `Collapse all in ${section.title}`
                          : `Expand all in ${section.title}`
                      }>
                      <Text
                        className="text-xs font-semibold"
                        style={{ color: theme.primary }}>
                        {allExpanded ? 'Collapse all' : 'Expand all'}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
                {section.items.map(item => (
                  <FaqRow
                    key={item.id}
                    item={item}
                    expanded={openIds.has(item.id)}
                    onToggle={() => toggleItem(item.id)}
                    theme={theme}
                  />
                ))}
              </View>
            );
          })
        )}

        <View
          className="rounded-2xl p-4 mt-2 border"
          style={{
            backgroundColor: theme.cardBgLight,
            borderColor: theme.border,
          }}>
          <Text
            className="text-xs font-bold uppercase tracking-wider mb-2"
            style={{ color: theme.grey }}>
            Quick links
          </Text>
          <Text
            className="text-[14px] leading-[21px]"
            style={{ color: theme.grey }}>
            Account, theme, and sign out: Settings → Profile. Data and policies:
            Profile → Privacy & Security. AI tools: Explore tab. Hands-free
            commands: Voice tab (Android, when the voice module is available).
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default HelpAndSupportScreen;
