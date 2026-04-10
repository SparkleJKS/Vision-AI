import { Linking, Pressable, Text, View } from 'react-native';
import type { EdgeInsets } from 'react-native-safe-area-context';
import type { Code } from 'react-native-vision-camera';
import { useTheme } from '@/theme';
import { error, logEvent } from '@/utils/logger';
import { showToast } from '@/utils/toast';
import { getCodeTypeLabel } from '../helpers';

type QrResultSheetProps = {
  insets: EdgeInsets;
  logName: string;
  result: { value: string; type: Code['type'] };
  urlToOpen: string | null;
  onScanAgain: () => void;
};

export const QrResultSheet = ({
  insets,
  logName,
  result,
  urlToOpen,
  onScanAgain,
}: QrResultSheetProps) => {
  const { theme } = useTheme();

  return (
    <View
      className="absolute left-4 right-4 rounded-2xl border px-4 py-3.5 gap-3"
      style={{
        bottom: insets.bottom + 14,
        backgroundColor: theme.cardBg + 'F2',
        borderColor: theme.border,
      }}>
      <View className="flex-row items-center justify-between">
        <Text
          className="text-[12px] font-bold tracking-wider"
          style={{ color: theme.primary }}>
          CODE DETECTED
        </Text>
        <Text
          className="text-[12px] font-semibold"
          style={{ color: theme.grey }}>
          {getCodeTypeLabel(result.type)}
        </Text>
      </View>

      <View
        className="rounded-xl border px-3 py-2.5"
        style={{
          borderColor: theme.border,
          backgroundColor: theme.screenBg + 'B3',
        }}>
        <Text
          selectable
          className="text-[13px] font-medium"
          style={{ color: theme.white }}>
          {result.value}
        </Text>
      </View>

      <View className="flex-row gap-2.5">
        <Pressable
          className="flex-1 rounded-xl py-3 border items-center justify-center"
          style={{
            borderColor: theme.primary,
            backgroundColor: theme.primary + '20',
          }}
          onPress={onScanAgain}>
          <Text
            className="text-[13px] font-bold"
            style={{ color: theme.primary }}>
            Scan Again
          </Text>
        </Pressable>

        {urlToOpen && (
          <Pressable
            className="flex-1 rounded-xl py-3 border items-center justify-center"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.cardBg,
            }}
            onPress={() => {
              logEvent(`${logName}_open_link`, { url: urlToOpen });
              Linking.openURL(urlToOpen).catch(e => {
                error(logName, 'Failed to open URL', urlToOpen, e);
                showToast.error(
                  "Couldn't open link",
                  'No app can handle this URL.',
                );
              });
            }}>
            <Text
              className="text-[13px] font-bold"
              style={{ color: theme.white }}>
              Open Link
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};
