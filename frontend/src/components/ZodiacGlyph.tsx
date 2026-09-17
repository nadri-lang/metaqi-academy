import React from 'react';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { ZodiacAnimalKey } from '@/src/constants/Zodiac';

// 8 of the 12 animals have a clear, already-legible glyph in the icon fonts
// bundled with the app - use those instead of a hand-drawn silhouette; they
// read correctly at small sizes because that's what they're designed for.
// The remaining 4 (tiger, dragon, monkey, rooster) have no equivalent in
// either font, so they keep the custom flat single-color silhouette below.
const ICON_FONT_ANIMAL: Partial<Record<ZodiacAnimalKey, { Set: typeof MaterialCommunityIcons; name: string }>> = {
  rat: { Set: MaterialCommunityIcons, name: 'mouse' },
  ox: { Set: MaterialCommunityIcons, name: 'cow' },
  rabbit: { Set: MaterialCommunityIcons, name: 'rabbit' },
  snake: { Set: MaterialCommunityIcons, name: 'snake' },
  horse: { Set: MaterialCommunityIcons, name: 'horse' },
  goat: { Set: MaterialIcons as unknown as typeof MaterialCommunityIcons, name: 'goat' },
  dog: { Set: MaterialCommunityIcons, name: 'dog' },
  pig: { Set: MaterialCommunityIcons, name: 'pig' },
};

// Solid single-color silhouette icons for the remaining 4 zodiac animals,
// matching the flat gold-emblem style of the rearing-horse mockup in rork/.
// Each animal is a short recipe of filled primitives (circle/ellipse/polygon)
// plus a couple of thick rounded strokes for thin protrusions (tails,
// horns, manes) that a filled shape can't represent cleanly. No internal
// detail (eyes, stripes, whiskers) - the reference icon is a pure silhouette.

type Shape =
  | { t: 'c'; cx: number; cy: number; r: number }
  | { t: 'e'; cx: number; cy: number; rx: number; ry: number; rot?: number }
  | { t: 'p'; d: string }
  | { t: 's'; d: string; w?: number };

const RECIPES: Partial<Record<ZodiacAnimalKey, Shape[]>> = {
  tiger: [
    { t: 'p', d: 'M30,42 L38,24 L46,42 Z' },
    { t: 'p', d: 'M54,42 L62,24 L70,42 Z' },
    { t: 'e', cx: 50, cy: 60, rx: 20, ry: 18 },
    { t: 'e', cx: 50, cy: 76, rx: 8, ry: 6 },
  ],
  dragon: [
    { t: 's', d: 'M50,88 C40,70 60,55 45,35', w: 14 },
    { t: 's', d: 'M32,30 Q20,32 18,40', w: 4 },
    { t: 'e', cx: 42, cy: 28, rx: 11, ry: 9 },
    { t: 's', d: 'M38,20 L34,8', w: 5 },
    { t: 's', d: 'M46,20 L50,8', w: 5 },
  ],
  monkey: [
    { t: 's', d: 'M66,74 Q88,74 86,56 Q84,42 70,44', w: 7 },
    { t: 'c', cx: 30, cy: 52, r: 8 },
    { t: 'c', cx: 70, cy: 52, r: 8 },
    { t: 'c', cx: 50, cy: 60, r: 18 },
  ],
  rooster: [
    { t: 's', d: 'M60,60 Q84,50 82,30', w: 6 },
    { t: 's', d: 'M58,68 Q86,64 88,42', w: 6 },
    { t: 'e', cx: 48, cy: 70, rx: 16, ry: 18 },
    { t: 's', d: 'M38,30 Q42,16 48,28 Q52,14 56,26', w: 6 },
    { t: 'c', cx: 46, cy: 40, r: 10 },
    { t: 'p', d: 'M56,40 L68,36 L56,46 Z' },
    { t: 'e', cx: 52, cy: 50, rx: 4, ry: 6 },
  ],
};

interface Props {
  animal: ZodiacAnimalKey;
  size?: number;
  color?: string;
}

export default function ZodiacGlyph({ animal, size = 48, color = '#C8A24A' }: Props) {
  const iconFont = ICON_FONT_ANIMAL[animal];
  if (iconFont) {
    const { Set, name } = iconFont;
    return <Set name={name as any} size={size} color={color} />;
  }

  const shapes = RECIPES[animal] || RECIPES.tiger!;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {shapes.map((shape, i) => {
        if (shape.t === 'c') {
          return <Circle key={i} cx={shape.cx} cy={shape.cy} r={shape.r} fill={color} />;
        }
        if (shape.t === 'e') {
          return (
            <Ellipse
              key={i}
              cx={shape.cx}
              cy={shape.cy}
              rx={shape.rx}
              ry={shape.ry}
              fill={color}
              transform={shape.rot ? `rotate(${shape.rot} ${shape.cx} ${shape.cy})` : undefined}
            />
          );
        }
        if (shape.t === 'p') {
          return <Path key={i} d={shape.d} fill={color} />;
        }
        return (
          <Path
            key={i}
            d={shape.d}
            stroke={color}
            strokeWidth={shape.w ?? 4}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        );
      })}
    </Svg>
  );
}
