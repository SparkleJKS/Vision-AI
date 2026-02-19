import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

export function AlertsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>ALERTS</Text>
        </View>
        <Text style={styles.title}>Notifications</Text>
        <View style={styles.countRow}>
          <Text style={styles.countText}>3 recent alerts</Text>
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
            style={styles.alertCard}
          >
            <View style={[styles.cardAccentLine, { backgroundColor: alert.accentColor }]} />
            <View
              style={[
                styles.iconContainer,
                { borderColor: `${alert.accentColor}40` },
              ]}
            >
              <Ionicons
                name={alert.icon}
                size={22}
                color={alert.accentColor}
              />
            </View>
            <View style={styles.textBlock}>
              <Text style={styles.alertTitle}>{alert.title}</Text>
              <Text style={styles.alertSubtitle}>{alert.subtitle}</Text>
            </View>
            <View style={styles.timeBadge}>
              <Text style={styles.timeText}>{alert.timeAgo}</Text>
            </View>
          </View>
        ))}
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
    paddingBottom: 8,
  },
  headerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F59E0B18',
    borderWidth: 1,
    borderColor: '#F59E0B35',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  headerBadgeText: {
    color: '#F59E0B',
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
  countRow: {
    marginTop: 4,
  },
  countText: {
    color: '#475569',
    fontSize: 13,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  alertCard: {
    backgroundColor: '#0F1620',
    borderWidth: 1,
    borderColor: '#1E2D3D',
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
    backgroundColor: '#0A0F18',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textBlock: {
    flex: 1,
  },
  alertTitle: {
    color: '#F1F5F9',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  alertSubtitle: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '500',
  },
  timeBadge: {
    backgroundColor: '#1E2D3D',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  timeText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
  },
});
