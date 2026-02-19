import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBackHandler } from '@/navigators';
import { useAuth } from '@/auth/AuthContext';
import { navigationActions } from '@/store/actions/navigation';
import type { AppDispatch } from '@/store';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

const QUICK_ACTIONS = [
  {
    id: 'detect',
    label: 'Detect',
    sublabel: 'Objects',
    icon: 'scan',
    accent: '#22C55E',
  },
  {
    id: 'read',
    label: 'Read',
    sublabel: 'Text & Docs',
    icon: 'document-text',
    accent: '#38BDF8',
  },
  {
    id: 'scene',
    label: 'Describe',
    sublabel: 'Scene',
    icon: 'eye',
    accent: '#A855F7',
  },
  {
    id: 'navigate',
    label: 'Navigate',
    sublabel: 'Safely',
    icon: 'navigate',
    accent: '#06B6D4',
  },
] as const;

const STATS = [
  { id: 'sessions', label: 'Sessions', value: '12', icon: 'flash', accent: '#22C55E' },
  { id: 'detected', label: 'Detected', value: '284', icon: 'cube', accent: '#38BDF8' },
  { id: 'accuracy', label: 'Accuracy', value: '97%', icon: 'checkmark-done', accent: '#A855F7' },
] as const;

const RECENT_ACTIVITY = [
  { id: '1', action: 'Detected', object: '6 objects', timeAgo: '2m ago', accent: '#22C55E' },
  { id: '2', action: 'Read', object: 'Restaurant menu', timeAgo: '18m ago', accent: '#38BDF8' },
  { id: '3', action: 'Described', object: 'Living room', timeAgo: '1h ago', accent: '#A855F7' },
] as const;

const AI_TIP = {
  text: 'Point camera at any object and tap Detect for instant AI identification.',
  accent: '#6366F1',
} as const;

export function HomeScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const greeting = useMemo(() => getGreeting(), []);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const gridAnim = useRef(new Animated.Value(0)).current;
  const activityAnim = useRef(new Animated.Value(0)).current;

  const handlePressProfile = () => {
    dispatch(navigationActions.toProfile());
  };
  const displayName = user?.displayName ?? user?.email?.split('@')[0] ?? 'User';

  useBackHandler({
    showExitPrompt: true,
  });

  useEffect(() => {
    const animateIn = (value: Animated.Value, delay: number) =>
      Animated.timing(value, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      });

    Animated.parallel([
      animateIn(headerAnim, 0),
      animateIn(statsAnim, 100),
      animateIn(gridAnim, 200),
      animateIn(activityAnim, 320),
    ]).start();
  }, [activityAnim, gridAnim, headerAnim, statsAnim]);

  const sectionAnimStyle = (value: Animated.Value) => ({
    opacity: value,
    transform: [
      {
        translateY: value.interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0],
        }),
      },
    ],
  });

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.headerSection, sectionAnimStyle(headerAnim)]}>
          <View style={styles.headerLeft}>
            <Text style={styles.greetingText}>{greeting},</Text>
            <Text style={styles.displayNameText}>{displayName}</Text>
            <View style={styles.activeRow}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>Vision AI Active</Text>
            </View>
          </View>
          <Pressable style={styles.profileButton} onPress={handlePressProfile}>
            <View style={styles.profileInner}>
              <Text style={styles.profileInitial}>{displayName[0]?.toUpperCase() ?? 'U'}</Text>
              <View style={styles.profileOnlineDot} />
            </View>
          </Pressable>
        </Animated.View>

        <Animated.View style={[styles.statsSection, sectionAnimStyle(statsAnim)]}>
          <View style={styles.statsRow}>
            {STATS.map((stat) => (
              <View key={stat.id} style={styles.statCard}>
                <View style={[styles.statAccentLine, { backgroundColor: stat.accent }]} />
                <Ionicons name={stat.icon as any} size={16} color={stat.accent} style={styles.statIcon} />
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View style={[styles.quickActionsSection, sectionAnimStyle(gridAnim)]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeaderLabel}>QUICK ACTIONS</Text>
            <Text style={styles.sectionHeaderLink}>See all →</Text>
          </View>

          <View style={styles.actionsGrid}>
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity key={action.id} activeOpacity={0.85} style={styles.actionCard} onPress={() => {}}>
                <View style={[styles.actionGlow, { backgroundColor: `${action.accent}18` }]} />
                <View style={[styles.actionAccentLine, { backgroundColor: action.accent }]} />
                <View
                  style={[
                    styles.actionIconContainer,
                    {
                      backgroundColor: `${action.accent}15`,
                      borderColor: `${action.accent}30`,
                    },
                  ]}
                >
                  <Ionicons name={action.icon as any} size={20} color={action.accent} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
                <Text style={styles.actionSublabel}>{action.sublabel}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.tipCard}>
            <View style={[styles.tipAccentBar, { backgroundColor: AI_TIP.accent }]} />
            <View
              style={[
                styles.tipIconContainer,
                {
                  backgroundColor: `${AI_TIP.accent}18`,
                  borderColor: `${AI_TIP.accent}35`,
                },
              ]}
            >
              <Ionicons name="sparkles" size={18} color={AI_TIP.accent} />
            </View>
            <View style={styles.tipTextContent}>
              <Text style={[styles.tipLabel, { color: AI_TIP.accent }]}>AI TIP</Text>
              <Text style={styles.tipText}>{AI_TIP.text}</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.activitySection, sectionAnimStyle(activityAnim)]}>
          <Text style={styles.activityHeader}>RECENT ACTIVITY</Text>

          {RECENT_ACTIVITY.map((item, index) => (
            <View key={item.id} style={styles.activityItemBlock}>
              <View style={styles.activityRow}>
                <View style={[styles.activityDot, { backgroundColor: item.accent }]} />
                <View style={styles.activityTextWrap}>
                  <Text style={styles.activityActionText}>
                    {item.action}
                    <Text style={styles.activityObjectText}> {item.object}</Text>
                  </Text>
                </View>
                <Text style={styles.activityTimeText}>{item.timeAgo}</Text>
              </View>
              {index < RECENT_ACTIVITY.length - 1 && <View style={styles.activitySeparator} />}
            </View>
          ))}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#080B10',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  headerLeft: {
    flex: 1,
  },
  greetingText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  displayNameText: {
    color: '#F1F5F9',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  activeText: {
    color: '#22C55E',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  profileButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#0F1620',
    borderWidth: 1,
    borderColor: '#1E2D3D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInner: {
    alignItems: 'center',
  },
  profileInitial: {
    color: '#F1F5F9',
    fontSize: 17,
    fontWeight: '800',
  },
  profileOnlineDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#22C55E',
    marginTop: 3,
  },
  statsSection: {
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#0F1620',
    borderWidth: 1,
    borderColor: '#1E2D3D',
    borderRadius: 14,
    padding: 14,
    alignItems: 'flex-start',
    overflow: 'hidden',
  },
  statAccentLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    color: '#F1F5F9',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statLabel: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  quickActionsSection: {
    marginBottom: 0,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionHeaderLabel: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
  },
  sectionHeaderLink: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  actionCard: {
    width: '47.5%',
    backgroundColor: '#0F1620',
    borderWidth: 1,
    borderColor: '#1E2D3D',
    borderRadius: 16,
    padding: 18,
    overflow: 'hidden',
    minHeight: 110,
  },
  actionGlow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  actionAccentLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  actionIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionLabel: {
    color: '#F1F5F9',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  actionSublabel: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  tipCard: {
    marginBottom: 24,
    backgroundColor: '#0F1620',
    borderWidth: 1,
    borderColor: '#6366F135',
    borderRadius: 16,
    padding: 18,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  tipAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  tipIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipTextContent: {
    flex: 1,
  },
  tipLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 5,
  },
  tipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
  activitySection: {
    marginBottom: 0,
  },
  activityHeader: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 14,
  },
  activityItemBlock: {
    marginBottom: 16,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  activityTextWrap: {
    flex: 1,
  },
  activityActionText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
  },
  activityObjectText: {
    color: '#F1F5F9',
    fontSize: 13,
    fontWeight: '700',
  },
  activityTimeText: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '500',
  },
  activitySeparator: {
    height: 1,
    backgroundColor: '#0F1620',
    marginLeft: 20,
    marginTop: 16,
  },
});
