import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
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
 * Circular gold-ring emblem with the day's zodiac animal centered and its
 * element as a small corner badge - the "golden horse" mark from the home
 * mockup, generalised to all 12 animals. The ring's tick pattern stands in
 * for the mockup's meander border without hand-authoring that path exactly.
 */
export default function ZodiacEmblem({
  animal,
  element,
  size = 96,
  ringColor = '#C8A24A',
  backgroundColor = '#0A1424',
}: Props) {
  const center = size / 2;
  const outerR = size / 2 - 2;
  const tickInnerR = outerR - size * 0.08;
  const tickCount = 24;
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const angle = (i / tickCount) * Math.PI * 2;
    return {
      x1: center + tickInnerR * Math.cos(angle),
      y1: center + tickInnerR * Math.sin(angle),
      x2: center + outerR * Math.cos(angle),
      y2: center + outerR * Math.sin(angle),
    };
  });

  const badgeSize = size * 0.32;
  const badgeIcon = elementIcon(element) || 'circle-outline';
  const badgeColor = elementColor(element) || ringColor;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={center} cy={center} r={outerR} stroke={ringColor} strokeWidth={1.5} fill="none" />
        <Circle cx={center} cy={center} r={tickInnerR} stroke={ringColor} strokeWidth={1} fill="none" opacity={0.6} />
        {ticks.map((tick, i) => (
          <Line
            key={i}
            x1={tick.x1}
            y1={tick.y1}
            x2={tick.x2}
            y2={tick.y2}
            stroke={ringColor}
            strokeWidth={1}
            opacity={0.5}
          />
        ))}
      </Svg>
      <View style={styles.glyphWrap} pointerEvents="none">
        <ZodiacGlyph animal={animal} size={size * 0.52} color={ringColor} />
      </View>
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
  glyphWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
