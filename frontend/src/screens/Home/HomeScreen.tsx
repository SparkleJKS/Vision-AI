import { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch } from "react-redux";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme";
import { useBackHandler } from "@/navigators";
import { useAuth } from "@/auth/AuthContext";
import { navigationActions } from "@/store/actions/navigation";
import type { AppDispatch } from "@/store";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

const QUICK_ACTIONS = [
  {
    id: "detect",
    label: "Detect",
    sublabel: "Objects",
    icon: "scan",
    accent: "#22C55E",
  },
  {
    id: "read",
    label: "Read",
    sublabel: "Text & Docs",
    icon: "document-text",
    accent: "#38BDF8",
  },
  {
    id: "scene",
    label: "Describe",
    sublabel: "Scene",
    icon: "eye",
    accent: "#A855F7",
  },
  {
    id: "navigate",
    label: "Navigate",
    sublabel: "Safely",
    icon: "navigate",
    accent: "#06B6D4",
  },
] as const;

const STATS = [
  {
    id: "sessions",
    label: "Sessions",
    value: "12",
    icon: "flash",
    accent: "#22C55E",
  },
  {
    id: "detected",
    label: "Detected",
    value: "284",
    icon: "cube",
    accent: "#38BDF8",
  },
  {
    id: "accuracy",
    label: "Accuracy",
    value: "97%",
    icon: "checkmark-done",
    accent: "#A855F7",
  },
] as const;

const RECENT_ACTIVITY = [
  {
    id: "1",
    action: "Detected",
    object: "6 objects",
    timeAgo: "2m ago",
    accent: "#22C55E",
  },
  {
    id: "2",
    action: "Read",
    object: "Restaurant menu",
    timeAgo: "18m ago",
    accent: "#38BDF8",
  },
  {
    id: "3",
    action: "Described",
    object: "Living room",
    timeAgo: "1h ago",
    accent: "#A855F7",
  },
] as const;

const AI_TIP = {
  text: "Point camera at any object and tap Detect for instant AI identification.",
  accent: "#6366F1",
} as const;

const HomeScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user } = useAuth();
  const greeting = useMemo(() => getGreeting(), []);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const gridAnim = useRef(new Animated.Value(0)).current;
  const activityAnim = useRef(new Animated.Value(0)).current;

  const handlePressProfile = () => {
    dispatch(navigationActions.toProfile());
  };
  const displayName = user?.displayName ?? user?.email?.split("@")[0] ?? "User";

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
    <View
      className="flex-1"
      style={{ paddingTop: insets.top, backgroundColor: theme.screenBg }}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: insets.bottom + 90,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          className="flex-row justify-between items-start mb-7"
          style={sectionAnimStyle(headerAnim)}
        >
          <View className="flex-1">
            <Text
              className="text-sm font-medium mb-1"
              style={{ color: theme.grey }}
            >
              {greeting},
            </Text>
            <Text
              className="text-3xl font-black tracking-tight"
              style={{ color: theme.primary }}
            >
              {displayName}
            </Text>
            <View className="flex-row items-center mt-1.5">
              <View
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: theme.primary }}
              />
              <Text
                className="text-xs font-semibold ml-1.5"
                style={{ color: theme.primary }}
              >
                Vision AI Active
              </Text>
            </View>
          </View>
          <Pressable
            className="w-12 h-12 rounded-[14px] justify-center items-center"
            style={{ backgroundColor: theme.primary }}
            onPress={handlePressProfile}
          >
            <Text
              className="text-[17px] font-extrabold"
              style={{ color: theme.screenBg }}
            >
              {displayName[0]?.toUpperCase() ?? "U"}
            </Text>
          </Pressable>
        </Animated.View>

        <Animated.View className="mb-6" style={sectionAnimStyle(statsAnim)}>
          <View className="flex-row gap-2.5">
            {STATS.map((stat) => (
              <View
                key={stat.id}
                className="flex-1 rounded-[14px] p-3.5 items-start overflow-hidden border"
                style={{
                  backgroundColor: theme.cardBg,
                  borderColor: theme.border,
                }}
              >
                <View
                  className="absolute top-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: theme.primary }}
                />
                <Ionicons
                  name={stat.icon as any}
                  size={16}
                  color={theme.primary}
                  className="mb-2"
                />
                <Text
                  className="text-[22px] font-black tracking-tight"
                  style={{ color: theme.white }}
                >
                  {stat.value}
                </Text>
                <Text
                  className="text-[10px] font-semibold tracking-wider uppercase mt-0.5"
                  style={{ color: theme.grey }}
                >
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View style={sectionAnimStyle(gridAnim)}>
          <View className="flex-row justify-between items-center mb-3.5">
            <Text
              className="text-[10px] font-bold tracking-widest"
              style={{ color: theme.grey }}
            >
              QUICK ACTIONS
            </Text>
            <Text
              className="text-[11px] font-semibold"
              style={{ color: theme.muted }}
            >
              See all →
            </Text>
          </View>

          <View className="flex-row flex-wrap gap-2.5 mb-6">
            {QUICK_ACTIONS.map((action, index) => {
              const isHighlighted = index === 0;
              return (
                <TouchableOpacity
                  key={action.id}
                  className="w-[47.5%] rounded-2xl p-4 overflow-hidden min-h-[110px] border"
                  style={{
                    backgroundColor: isHighlighted
                      ? theme.primary
                      : theme.cardBg,
                    borderColor: isHighlighted ? theme.primary : theme.border,
                  }}
                  activeOpacity={0.85}
                  onPress={() => {}}
                >
                  <View
                    className="absolute -top-5 -right-5 w-[60px] h-[60px] rounded-full"
                    style={{
                      backgroundColor: isHighlighted
                        ? `${theme.primary}50`
                        : `${theme.primary}18`,
                    }}
                  />
                  {!isHighlighted && (
                    <View
                      className="absolute top-0 left-0 right-0 h-0.5"
                      style={{ backgroundColor: theme.primary }}
                    />
                  )}
                  <View
                    className="w-10 h-10 rounded-[10px] border justify-center items-center mb-3"
                    style={{
                      backgroundColor: isHighlighted
                        ? "rgba(0,0,0,0.2)"
                        : `${theme.primary}15`,
                      borderColor: isHighlighted
                        ? "rgba(0,0,0,0.25)"
                        : `${theme.primary}30`,
                    }}
                  >
                    <Ionicons
                      name={action.icon as any}
                      size={20}
                      color={isHighlighted ? theme.screenBg : theme.primary}
                    />
                  </View>
                  <Text
                    className="text-[15px] font-extrabold tracking-tight"
                    style={{
                      color: isHighlighted ? theme.screenBg : theme.white,
                    }}
                  >
                    {action.label}
                  </Text>
                  <Text
                    className="text-[11px] font-medium mt-0.5"
                    style={{
                      color: isHighlighted ? "rgba(0,0,0,0.7)" : theme.grey,
                    }}
                  >
                    {action.sublabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View
            className="mb-6 rounded-2xl p-4 overflow-hidden flex-row items-center gap-3.5 border"
            style={{
              backgroundColor: theme.cardBg,
              borderColor: `${theme.primary}35`,
            }}
          >
            <View
              className="absolute left-0 top-0 bottom-0 w-0.5"
              style={{ backgroundColor: theme.primary }}
            />
            <View
              className="w-9 h-9 rounded-[10px] border justify-center items-center"
              style={{
                backgroundColor: `${theme.primary}18`,
                borderColor: `${theme.primary}35`,
              }}
            >
              <Ionicons name="sparkles" size={18} color={theme.primary} />
            </View>
            <View className="flex-1">
              <Text
                className="text-[9px] font-bold tracking-widest mb-1"
                style={{ color: theme.primary }}
              >
                AI TIP
              </Text>
              <Text
                className="text-xs font-medium leading-[18px]"
                style={{ color: theme.grey }}
              >
                {AI_TIP.text}
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={sectionAnimStyle(activityAnim)}>
          <Text
            className="text-[10px] font-bold tracking-widest mb-3.5"
            style={{ color: theme.grey }}
          >
            RECENT ACTIVITY
          </Text>

          {RECENT_ACTIVITY.map((item, index) => (
            <View key={item.id} className="mb-4">
              <View className="flex-row items-center">
                <View
                  className="w-2 h-2 rounded-full mr-3"
                  style={{ backgroundColor: theme.primary }}
                />
                <View className="flex-1">
                  <Text
                    className="text-[13px] font-medium"
                    style={{ color: theme.grey }}
                  >
                    {item.action}
                    <Text
                      className="text-[13px] font-bold"
                      style={{ color: theme.white }}
                    >
                      {" "}
                      {item.object}
                    </Text>
                  </Text>
                </View>
                <Text
                  className="text-[11px] font-medium"
                  style={{ color: theme.muted }}
                >
                  {item.timeAgo}
                </Text>
              </View>
              {index < RECENT_ACTIVITY.length - 1 && (
                <View
                  className="h-px ml-5 mt-4"
                  style={{ backgroundColor: theme.cardBg }}
                />
              )}
            </View>
          ))}
        </Animated.View>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;
