import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ZodiacGlyph from './ZodiacGlyph';
import { ZodiacAnimalKey, ElementKey, elementIcon, elementColor } from '@/src/constants/Zodiac';

interface Props {
  animal: ZodiacAnimalKey;
  element?: ElementKey | null;
  size?: number;
  ringColor?: string;
  backgroundColor?: string;
}

/**
 * The day's zodiac animal in its gold circular emblem (ring baked into the
 * artwork - see ZodiacGlyph) with its element as a small corner badge. The
 * badge reflects whatever element is picked for that day, so it stays a
 * separately drawn overlay rather than part of the emblem image.
 */
export default function ZodiacEmblem({
  animal,
  element,
  size = 96,
  ringColor = '#C8A24A',
  backgroundColor = '#0A1424',
}: Props) {
  const badgeSize = size * 0.32;
  const badgeIcon = elementIcon(element) || 'circle-outline';
  const badgeColor = elementColor(element) || ringColor;

  return (
    <View style={{ width: size, height: size }}>
      <ZodiacGlyph animal={animal} size={size} />
      {element && (
        <View
          style={[
            styles.badge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              right: -badgeSize * 0.12,
              bottom: -badgeSize * 0.12,
              backgroundColor,
              borderColor: badgeColor,
            },
          ]}
        >
          <MaterialCommunityIcons name={badgeIcon as any} size={badgeSize * 0.56} color={badgeColor} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
