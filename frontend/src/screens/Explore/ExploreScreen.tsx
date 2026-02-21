import React, { useEffect, useRef } from "react";
import { Animated, Pressable, ScrollView, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme";
import { ScreenNames } from "@/configs/navigation";

type FeatureId = "objectDetection" | "ocr" | "tts";

type Feature = {
  id: FeatureId;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  status: "active" | "coming_soon";
  accentColor: string;
  stats?: { label: string; value: string }[];
};

const FEATURES: Feature[] = [
  {
    id: "objectDetection",
    title: "Object Detection",
    subtitle: "Real-time AI Vision",
    description:
      "Detect and identify objects in your environment instantly using YOLOv8 neural network.",
    icon: "⬡",
    status: "active",
    accentColor: "#22C55E",
    stats: [
      { label: "Model", value: "YOLOv8n" },
      { label: "Classes", value: "80" },
      { label: "Input", value: "320px" },
    ],
  },
  {
    id: "ocr",
    title: "Photo to Text",
    subtitle: "Optical Character Recognition",
    description:
      "Extract and digitize text from images, documents, signs, and handwriting with high accuracy.",
    icon: "◈",
    status: "coming_soon",
    accentColor: "#6366F1",
    stats: [
      { label: "Languages", value: "50+" },
      { label: "Mode", value: "Offline" },
      { label: "Format", value: "PDF/IMG" },
    ],
  },
  {
    id: "tts",
    title: "Text to Speech",
    subtitle: "Neural Voice Synthesis",
    description:
      "Convert any text into natural-sounding speech with multiple voice profiles and languages.",
    icon: "◎",
    status: "coming_soon",
    accentColor: "#F59E0B",
    stats: [
      { label: "Voices", value: "12" },
      { label: "Languages", value: "30+" },
      { label: "Quality", value: "Neural" },
    ],
  },
];

function FeatureCard({
  feature,
  onSelect,
  index,
  theme,
  themeId,
}: {
  feature: Feature;
  onSelect: (id: FeatureId) => void;
  index: number;
  theme: import("@/theme/tokens").ThemeTokens;
  themeId: "accessibility" | "neon";
}) {
  const accent =
    themeId === "accessibility" ? theme.primary : feature.accentColor;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 120,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        delay: index * 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const isActive = feature.status === "active";

  return (
    <Animated.View
      className="rounded-2xl overflow-hidden"
      style={{
        opacity: fadeAnim,
        transform: [{ translateY }, { scale: scaleAnim }],
      }}
    >
      <Pressable
        onPress={() => onSelect(feature.id)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className={`rounded-2xl p-5 overflow-hidden border ${!isActive ? "opacity-65" : ""}`}
        style={{ backgroundColor: theme.cardBg, borderColor: theme.border }}
      >
        <View
          className="absolute top-0 left-5 right-5 h-px"
          style={{ backgroundColor: accent }}
        />
        <View className="flex-row justify-between items-center">
          <View
            className="w-11 h-11 rounded-xl border justify-center items-center"
            style={{
              borderColor: accent + "40",
              backgroundColor: theme.darkBg,
            }}
          >
            <Text className="text-[22px]" style={{ color: accent }}>
              {feature.icon}
            </Text>
          </View>
          <View
            className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-full"
            style={{
              backgroundColor: isActive ? accent + "20" : theme.cardBg,
            }}
          >
            {!isActive && (
              <View
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: theme.muted }}
              />
            )}
            <Text
              className="text-[10px] font-bold tracking-wider"
              style={{ color: isActive ? accent : theme.muted }}
            >
              {isActive ? "LIVE" : "SOON"}
            </Text>
          </View>
        </View>
        <Text
          className="text-xl font-bold tracking-tight mt-1"
          style={{ color: theme.white }}
        >
          {feature.title}
        </Text>
        <Text
          className="text-xs font-medium tracking-wide -mt-1.5"
          style={{ color: theme.grey }}
        >
          {feature.subtitle}
        </Text>
        <Text
          className="text-[13px] leading-5 mt-0.5"
          style={{ color: theme.muted }}
        >
          {feature.description}
        </Text>
        {feature.stats && (
          <View
            className="flex-row gap-0 mt-1 border-t pt-3.5"
            style={{ borderColor: theme.border }}
          >
            {feature.stats.map((stat, i) => (
              <View key={i} className="flex-1 items-center gap-0.5">
                <Text
                  className="text-[15px] font-bold"
                  style={{ color: accent }}
                >
                  {stat.value}
                </Text>
                <Text
                  className="text-[10px] font-medium tracking-wider"
                  style={{ color: theme.grey }}
                >
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
        )}
        {isActive && (
          <View
            className="border rounded-[10px] py-2.5 items-center mt-1"
            style={{
              backgroundColor: accent + "15",
              borderColor: accent + "40",
            }}
          >
            <Text
              className="text-[13px] font-bold tracking-wide"
              style={{ color: accent }}
            >
              Launch →
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const FEATURE_TO_SCREEN: Record<FeatureId, keyof typeof ScreenNames> = {
  objectDetection: ScreenNames.ExploreObjectDetection,
  ocr: ScreenNames.ExploreOcr,
  tts: ScreenNames.ExploreTts,
};

const ExploreScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { theme, themeId } = useTheme();

  const handleSelectFeature = (id: FeatureId) => {
    navigation.navigate(FEATURE_TO_SCREEN[id] as never);
  };

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: theme.screenBg, paddingTop: insets.top }}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="py-6 gap-2">
          <Text
            className="text-3xl font-extrabold tracking-tight"
            style={{ color: theme.white }}
          >
            AI Tools
          </Text>
          <Text className="text-sm" style={{ color: theme.grey }}>
            Select a feature to get started
          </Text>
        </View>

        <View className="gap-3.5">
          {FEATURES.map((feature, index) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              onSelect={handleSelectFeature}
              index={index}
              theme={theme}
              themeId={themeId}
            />
          ))}
        </View>

        <Text
          className="text-xs text-center mt-6 tracking-wide"
          style={{ color: theme.border }}
        >
          More AI capabilities coming soon
        </Text>
      </ScrollView>
    </View>
  );
};

export default ExploreScreen;
