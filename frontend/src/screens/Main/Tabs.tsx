import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { ScreenNames } from '../../configs/navigation';
import type { IHomeTabParamList } from '../screens.types';
import { HomeScreen } from '../Home';
import { ExploreScreen } from '../Explore';
import { VoiceScreen } from '../Voice';
import { AlertsScreen } from '../Alerts';
import { SettingsStack } from '../Settings/SettingsStack';
import { colors } from '../../theme/colors';

const Tab = createBottomTabNavigator<IHomeTabParamList>();

export function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accentYellow,
        tabBarInactiveTintColor: colors.white,
        tabBarStyle: {
          backgroundColor: colors.tabBarBg,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          textTransform: 'uppercase',
        },
      }}
    >
      <Tab.Screen
        name={ScreenNames.Home}
        component={HomeScreen}
        options={{
          title: 'HOME',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name={ScreenNames.Explore}
        component={ExploreScreen}
        options={{
          title: 'EXPLORE',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'compass' : 'compass-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name={ScreenNames.Voice}
        component={VoiceScreen}
        options={{
          title: 'VOICE',
          tabBarIcon: ({ color }) => (
            <Ionicons name="mic-outline" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name={ScreenNames.Alerts}
        component={AlertsScreen}
        options={{
          title: 'ALERTS',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'notifications' : 'notifications-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name={ScreenNames.Settings}
        component={SettingsStack}
        options={{
          title: 'SETTINGS',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'settings' : 'settings-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
