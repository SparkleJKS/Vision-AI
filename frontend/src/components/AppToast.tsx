import Toast, {
  BaseToast,
  type ToastConfigParams,
} from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';

const ThemedBaseToast = ({
  accent,
  theme,
  params,
}: {
  accent: string;
  theme: ReturnType<typeof useTheme>['theme'];
  params: ToastConfigParams<unknown>;
}) => (
  <BaseToast
    {...params}
    style={[
      (params.props as { style?: object } | undefined)?.style,
      {
        borderLeftColor: accent,
        backgroundColor: theme.cardBg,
        borderLeftWidth: 4,
        minHeight: 58,
      },
    ]}
    contentContainerStyle={{ paddingHorizontal: 14 }}
    text1Style={[
      { color: theme.white, fontSize: 15, fontWeight: '600' },
      params.text1Style,
    ]}
    text2Style={[
      { color: theme.grey, fontSize: 13, marginTop: 2 },
      params.text2Style,
    ]}
  />
);

export const AppToast = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const toastConfig = {
    success: (p: ToastConfigParams<unknown>) => (
      <ThemedBaseToast accent={theme.success} theme={theme} params={p} />
    ),
    error: (p: ToastConfigParams<unknown>) => (
      <ThemedBaseToast accent={theme.error} theme={theme} params={p} />
    ),
    info: (p: ToastConfigParams<unknown>) => (
      <ThemedBaseToast accent={theme.primary} theme={theme} params={p} />
    ),
  };

  return (
    <Toast
      config={toastConfig}
      position="bottom"
      bottomOffset={Math.max(insets.bottom, 12) + 16}
      keyboardOffset={14}
    />
  );
};
