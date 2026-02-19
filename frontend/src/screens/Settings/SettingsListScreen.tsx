import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SETTINGS_ITEMS } from './config';
import type { ISettingsStackParamList } from '@/screens/screens.types';

type NavProp = NativeStackNavigationProp<ISettingsStackParamList>;

const ITEM_ACCENT: Record<string, string> = {
  profile: '#22C55E',
  voiceAndAudio: '#6366F1',
  visionSettings: '#38BDF8',
  connectedDevices: '#14B8A6',
  accessibility: '#A855F7',
};

export function SettingsListScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>SETTINGS</Text>
        </View>
        <Text style={styles.title}>Preferences</Text>
        <Text style={styles.subtitle}>Configure your experience</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {SETTINGS_ITEMS.map((item) => {
          const accent =
            ITEM_ACCENT[item.id] ??
            ITEM_ACCENT[
              `${item.screenName.charAt(0).toLowerCase()}${item.screenName.slice(1)}`
            ] ??
            '#475569';

          return (
            <TouchableOpacity
              key={item.id}
              style={styles.rowCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate(item.screenName)}
            >
              <View style={[styles.cardAccentLine, { backgroundColor: accent }]} />
              <View style={[styles.iconContainer, { borderColor: `${accent}40` }]}>
                <Ionicons
                  name={item.icon}
                  size={22}
                  color={accent}
                />
              </View>
              <View style={styles.textBlock}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color="#334155"
              />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#080B10',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#14B8A618',
    borderWidth: 1,
    borderColor: '#14B8A635',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  headerBadgeText: {
    color: '#14B8A6',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
  },
  title: {
    color: '#F1F5F9',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#475569',
    fontSize: 13,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  rowCard: {
    backgroundColor: '#0F1620',
    borderWidth: 1,
    borderColor: '#1E2D3D',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardAccentLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#0A0F18',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textBlock: {
    flex: 1,
  },
  itemTitle: {
    color: '#F1F5F9',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  itemSubtitle: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '500',
  },
});
