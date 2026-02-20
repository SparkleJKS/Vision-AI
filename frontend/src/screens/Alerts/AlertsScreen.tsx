import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';

const ALERTS = [
  {
    id: '1',
    type: 'warning',
    title: 'Obstacle Detected',
    subtitle: 'Object in path ahead',
    timeAgo: '2m ago',
    icon: 'warning' as const,
    accentColor: '#F43F5E',
  },
  {
    id: '2',
    type: 'info',
    title: 'Route Updated',
    subtitle: 'New path calculated',
    timeAgo: '15m ago',
    icon: 'information-circle' as const,
    accentColor: '#06B6D4',
  },
  {
    id: '3',
    type: 'success',
    title: 'Destination Reached',
    subtitle: 'Navigation complete',
    timeAgo: '1h ago',
    icon: 'checkmark-circle' as const,
    accentColor: '#22C55E',
  },
];

const AlertsScreen = () => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  return (
    <View style={[styles.screen, { paddingTop: insets.top, backgroundColor: theme.screenBg }]}>
      <View style={styles.header}>
        <View
          style={[
            styles.headerBadge,
            { backgroundColor: `${theme.tabAlerts}18`, borderColor: `${theme.tabAlerts}35` },
          ]}
        >
          <Text style={[styles.headerBadgeText, { color: theme.tabAlerts }]}>ALERTS</Text>
        </View>
        <Text style={[styles.title, { color: theme.white }]}>Notifications</Text>
        <View style={styles.countRow}>
          <Text style={[styles.countText, { color: theme.grey }]}>3 recent alerts</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {ALERTS.map((alert) => (
          <View
            key={alert.id}
            style={[
              styles.alertCard,
              { backgroundColor: theme.cardBg, borderColor: theme.border },
            ]}
          >
            <View style={[styles.cardAccentLine, { backgroundColor: alert.accentColor }]} />
            <View
              style={[
                styles.iconContainer,
                { borderColor: `${alert.accentColor}40`, backgroundColor: theme.darkBg },
              ]}
            >
              <Ionicons
                name={alert.icon}
                size={22}
                color={alert.accentColor}
              />
            </View>
            <View style={styles.textBlock}>
              <Text style={[styles.alertTitle, { color: theme.white }]}>{alert.title}</Text>
              <Text style={[styles.alertSubtitle, { color: theme.grey }]}>{alert.subtitle}</Text>
            </View>
            <View style={[styles.timeBadge, { backgroundColor: theme.border }]}>
              <Text style={[styles.timeText, { color: theme.muted }]}>{alert.timeAgo}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default AlertsScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  headerBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  headerBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  countRow: {
    marginTop: 4,
  },
  countText: {
    fontSize: 13,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  alertCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textBlock: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  alertSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  timeBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  timeText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
