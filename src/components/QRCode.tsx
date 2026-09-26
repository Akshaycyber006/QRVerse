import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { QRMatrix } from '../utils/qrGenerator';

interface Props {
  matrix: QRMatrix;
  size: number;
  color: string;
  backgroundColor?: string;
  rounded?: boolean;
  cellGap?: number;
  logoContent?: React.ReactNode;
  style?: ViewStyle;
}

// Premium QR rendering: rounded corners on outer cells, smooth gaps
export const QRCode: React.FC<Props> = ({
  matrix,
  size,
  color,
  backgroundColor = 'transparent',
  rounded = true,
  cellGap = 1,
  logoContent,
  style,
}) => {
  const rows = matrix.length;
  const innerSize = size - 8;
  const cellSize = innerSize / rows;

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, backgroundColor, borderRadius: rounded ? 16 : 0, padding: 4 },
        style,
      ]}
    >
      <View style={{ width: innerSize, height: innerSize, position: 'relative' }}>
        {matrix.map((row, y) =>
          row.map((on, x) => {
            if (!on) return null;
            // finder pattern cells (rounded outer)
            const isFinder =
              (x < 7 && y < 7) ||
              (x >= rows - 7 && y < 7) ||
              (x < 7 && y >= rows - 7);

            // alignment pattern cells
            const isAlign =
              x >= rows - 9 && x <= rows - 5 && y >= rows - 9 && y <= rows - 5 && rows >= 25;

            const cellRadius = rounded ? (isFinder ? 2 : isAlign ? 1.5 : 1) : 0;
            return (
              <View
                key={`${x}-${y}`}
                style={{
                  position: 'absolute',
                  left: x * cellSize + cellGap / 2,
                  top: y * cellSize + cellGap / 2,
                  width: cellSize - cellGap,
                  height: cellSize - cellGap,
                  backgroundColor: color,
                  borderRadius: cellRadius,
                }}
              />
            );
          })
        )}
        {logoContent && (
          <View
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: [{ translateX: -(innerSize * 0.18) }, { translateY: -(innerSize * 0.18) }],
            }}
          >
            {logoContent}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});