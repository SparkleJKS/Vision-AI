import { useState } from "react";
import { Pressable, Text } from "react-native";
import { useTheme } from "@/theme";
import { APP_VERSION } from "@/configs/appVersion";

const toVersionText = (version: { label: string; value: string }) => {
  return `${version.label}:  ${version.value}`;
};

const Version = () => {
  const { theme } = useTheme();
  const [vIndex, setVIndex] = useState<number>(0);

  const versions = [{ label: "Version", value: APP_VERSION }];

  const versionText = toVersionText(versions[vIndex]);

  const toggleVersion = () => {
    const nextIndex = vIndex + 1 >= versions.length ? 0 : vIndex + 1;
    setVIndex(nextIndex);
  };

  return (
    <Pressable onPress={toggleVersion}>
      <Text className="text-sm tracking-wide" style={{ color: theme.grey }}>
        {versionText}
      </Text>
    </Pressable>
  );
};

export default Version;
