import React from 'react';
import { View } from 'react-native';
import { Colors } from '@/src/constants/Colors';

interface Props {
  lines: number[]; // 6 values, bottom to top, 1 = yang (solid), 0 = yin (broken)
  movingLines?: number[]; // 1-indexed positions (bottom = 1)
  size?: 'small' | 'large';
}

export default function HexagramBars({ lines, movingLines = [], size = 'small' }: Props) {
  const width = size === 'small' ? 40 : 88;
  const barHeight = size === 'small' ? 4 : 8;
  const gap = size === 'small' ? 3 : 7;

  return (
    <View style={{ width, gap }}>
      {[5, 4, 3, 2, 1, 0].map((i) => {
        const isYang = lines[i] === 1;
        const isMoving = movingLines.includes(i + 1);
        const color = isMoving ? Colors.accent : Colors.textSecondary;

        return isYang ? (
          <View key={i} style={{ height: barHeight, backgroundColor: color, borderRadius: 2 }} />
        ) : (
          <View key={i} style={{ flexDirection: 'row', height: barHeight, justifyContent: 'space-between' }}>
            <View style={{ width: '42%', height: barHeight, backgroundColor: color, borderRadius: 2 }} />
            <View style={{ width: '42%', height: barHeight, backgroundColor: color, borderRadius: 2 }} />
          </View>
        );
      })}
    </View>
  );
}
