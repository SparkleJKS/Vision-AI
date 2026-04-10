import React, { memo, useMemo } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { CORNER_SIZE, CORNER_THICKNESS, SCAN_BOX_SIZE } from '../constants';

type CornerPosition = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

type QrScanBoxProps = {
  scanned: boolean;
  cornerColor: string;
  scanLineColor: string;
  scanLineTranslateY: Animated.AnimatedInterpolation<string | number>;
  cornerScale: Animated.AnimatedInterpolation<string | number>;
  cornerOpacity: Animated.AnimatedInterpolation<string | number>;
};

type CornerBracketProps = {
  position: CornerPosition;
  color: string;
};

const CornerBracket = memo(({ position, color }: CornerBracketProps) => {
  const style = useMemo(
    () => [
      styles.corner,
      CORNER_POSITION_STYLES[position],
      { borderColor: color },
    ],
    [position, color],
  );
  return <View style={style} />;
});
CornerBracket.displayName = 'CornerBracket';

export const QrScanBox = ({
  scanned,
  cornerColor,
  scanLineColor,
  scanLineTranslateY,
  cornerScale,
  cornerOpacity,
}: QrScanBoxProps) => {
  return (
    <Animated.View
      style={{
        width: SCAN_BOX_SIZE,
        height: SCAN_BOX_SIZE,
        transform: [{ scale: cornerScale }],
        opacity: cornerOpacity,
      }}>
      <CornerBracket position="topLeft" color={cornerColor} />
      <CornerBracket position="topRight" color={cornerColor} />
      <CornerBracket position="bottomLeft" color={cornerColor} />
      <CornerBracket position="bottomRight" color={cornerColor} />
      {!scanned && (
        <Animated.View
          style={[
            styles.scanLine,
            {
              backgroundColor: scanLineColor,
              transform: [{ translateY: scanLineTranslateY }],
            },
          ]}
        />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderBottomRightRadius: 12,
  },
  scanLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 2,
    borderRadius: 999,
  },
});

const CORNER_POSITION_STYLES: Record<CornerPosition, object> = {
  topLeft: styles.topLeft,
  topRight: styles.topRight,
  bottomLeft: styles.bottomLeft,
  bottomRight: styles.bottomRight,
};
