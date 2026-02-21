import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { ScreenNames } from "@/configs/navigation";
import type { IHomeTabParamList } from "@/screens/screens.types";
import { HomeScreen } from "@/screens/Home";
import ExploreStack from "@/screens/Explore/ExploreStack";
import { VoiceScreen } from "@/screens/Voice";
import { AlertsScreen } from "@/screens/Alerts";
import SettingsStack from "@/screens/Settings/SettingsStack";
import { useTheme } from "@/theme/ThemeContext";

const Tab = createBottomTabNavigator<IHomeTabParamList>();

const Tabs = () => {
  const { theme } = useTheme();
  const inactiveColor = theme.tabInactive;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.tabBarBg,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
      }}
    >
      <Tab.Screen
        name={ScreenNames.Home}
        component={HomeScreen}
        options={{
          title: "HOME",
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={22}
              color={focused ? theme.tabHome : inactiveColor}
            />
          ),
          tabBarLabel: ({ focused }) => (
            <Text
              className="text-[9px] font-bold tracking-widest uppercase -mt-0.5"
              style={{ color: focused ? theme.tabHome : inactiveColor }}
            >
              HOME
            </Text>
          ),
        }}
      />
      <Tab.Screen
        name={ScreenNames.Explore}
        component={ExploreStack}
        options={{
          title: "EXPLORE",
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "compass" : "compass-outline"}
              size={22}
              color={focused ? theme.tabExplore : inactiveColor}
            />
          ),
          tabBarLabel: ({ focused }) => (
            <Text
              className="text-[9px] font-bold tracking-widest uppercase -mt-0.5"
              style={{ color: focused ? theme.tabExplore : inactiveColor }}
            >
              EXPLORE
            </Text>
          ),
        }}
      />
      <Tab.Screen
        name={ScreenNames.Voice}
        component={VoiceScreen}
        options={{
          title: "VOICE",
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "mic" : "mic-outline"}
              size={22}
              color={focused ? theme.tabVoice : inactiveColor}
            />
          ),
          tabBarLabel: ({ focused }) => (
            <Text
              className="text-[9px] font-bold tracking-widest uppercase -mt-0.5"
              style={{ color: focused ? theme.tabVoice : inactiveColor }}
            >
              VOICE
            </Text>
          ),
        }}
      />
      <Tab.Screen
        name={ScreenNames.Alerts}
        component={AlertsScreen}
        options={{
          title: "ALERTS",
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "notifications" : "notifications-outline"}
              size={22}
              color={focused ? theme.tabAlerts : inactiveColor}
            />
          ),
          tabBarLabel: ({ focused }) => (
            <Text
              className="text-[9px] font-bold tracking-widest uppercase -mt-0.5"
              style={{ color: focused ? theme.tabAlerts : inactiveColor }}
            >
              ALERTS
            </Text>
          ),
        }}
      />
      <Tab.Screen
        name={ScreenNames.Settings}
        component={SettingsStack}
        options={{
          title: "SETTINGS",
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "settings" : "settings-outline"}
              size={22}
              color={focused ? theme.tabSettings : inactiveColor}
            />
          ),
          tabBarLabel: ({ focused }) => (
            <Text
              className="text-[9px] font-bold tracking-widest uppercase -mt-0.5"
              style={{ color: focused ? theme.tabSettings : inactiveColor }}
            >
              SETTINGS
            </Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default Tabs;
