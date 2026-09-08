import React from 'react';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { ZodiacAnimalKey } from '@/src/constants/Zodiac';

// Solid single-color silhouette icons for the 12 zodiac animals, matching
// the flat gold-emblem style of the rearing-horse mockup in rork/. Each
// animal is a short recipe of filled primitives (circle/ellipse/polygon)
// plus a couple of thick rounded strokes for thin protrusions (tails,
// horns, manes) that a filled shape can't represent cleanly. No internal
// detail (eyes, stripes, whiskers) - the reference icon is a pure silhouette.

type Shape =
  | { t: 'c'; cx: number; cy: number; r: number }
  | { t: 'e'; cx: number; cy: number; rx: number; ry: number; rot?: number }
  | { t: 'p'; d: string }
  | { t: 's'; d: string; w?: number };

const RECIPES: Record<ZodiacAnimalKey, Shape[]> = {
  rat: [
    { t: 's', d: 'M68,68 Q85,60 88,75 Q90,88 78,85', w: 6 },
    { t: 'e', cx: 50, cy: 60, rx: 19, ry: 16 },
    { t: 'e', cx: 50, cy: 73, rx: 8, ry: 6 },
    { t: 'c', cx: 36, cy: 45, r: 8 },
    { t: 'c', cx: 64, cy: 45, r: 8 },
  ],
  ox: [
    { t: 's', d: 'M38,42 Q28,28 20,32', w: 7 },
    { t: 's', d: 'M62,42 Q72,28 80,32', w: 7 },
    { t: 'e', cx: 50, cy: 62, rx: 19, ry: 17 },
    { t: 'e', cx: 50, cy: 78, rx: 11, ry: 7 },
    { t: 'e', cx: 32, cy: 50, rx: 6, ry: 9, rot: -25 },
    { t: 'e', cx: 68, cy: 50, rx: 6, ry: 9, rot: 25 },
  ],
  tiger: [
    { t: 'p', d: 'M30,42 L38,24 L46,42 Z' },
    { t: 'p', d: 'M54,42 L62,24 L70,42 Z' },
    { t: 'e', cx: 50, cy: 60, rx: 20, ry: 18 },
    { t: 'e', cx: 50, cy: 76, rx: 8, ry: 6 },
  ],
  rabbit: [
    { t: 'e', cx: 41, cy: 34, rx: 6, ry: 22, rot: -6 },
    { t: 'e', cx: 59, cy: 34, rx: 6, ry: 22, rot: 6 },
    { t: 'e', cx: 50, cy: 66, rx: 16, ry: 14 },
    { t: 'e', cx: 50, cy: 78, rx: 6, ry: 5 },
  ],
  dragon: [
    { t: 's', d: 'M50,88 C40,70 60,55 45,35', w: 14 },
    { t: 's', d: 'M32,30 Q20,32 18,40', w: 4 },
    { t: 'e', cx: 42, cy: 28, rx: 11, ry: 9 },
    { t: 's', d: 'M38,20 L34,8', w: 5 },
    { t: 's', d: 'M46,20 L50,8', w: 5 },
  ],
  snake: [
    { t: 's', d: 'M30,85 C30,65 70,65 70,45 C70,30 40,30 45,15', w: 13 },
    { t: 'e', cx: 46, cy: 14, rx: 9, ry: 7 },
  ],
  horse: [
    { t: 's', d: 'M64,62 Q82,64 80,84 Q78,96 64,92', w: 7 },
    { t: 's', d: 'M40,78 L28,58', w: 7 },
    { t: 's', d: 'M46,80 L36,62', w: 7 },
    { t: 's', d: 'M60,80 L64,95', w: 7 },
    { t: 's', d: 'M66,78 L72,92', w: 7 },
    { t: 'e', cx: 52, cy: 68, rx: 17, ry: 14, rot: -10 },
    { t: 's', d: 'M60,58 C66,42 62,28 50,18', w: 15 },
    { t: 's', d: 'M56,40 Q68,34 66,22', w: 6 },
    { t: 's', d: 'M52,28 Q64,22 62,12', w: 5 },
    { t: 'e', cx: 48, cy: 16, rx: 9, ry: 8 },
  ],
  goat: [
    { t: 's', d: 'M42,48 Q30,34 36,20', w: 6 },
    { t: 's', d: 'M58,48 Q70,34 64,20', w: 6 },
    { t: 'e', cx: 50, cy: 62, rx: 17, ry: 15 },
    { t: 'e', cx: 33, cy: 56, rx: 6, ry: 8, rot: -20 },
    { t: 'e', cx: 67, cy: 56, rx: 6, ry: 8, rot: 20 },
    { t: 'p', d: 'M44,76 L50,90 L56,76 Z' },
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
  dog: [
    { t: 'e', cx: 32, cy: 52, rx: 7, ry: 15, rot: -25 },
    { t: 'e', cx: 68, cy: 52, rx: 7, ry: 15, rot: 25 },
    { t: 'e', cx: 50, cy: 60, rx: 18, ry: 16 },
    { t: 'e', cx: 50, cy: 76, rx: 9, ry: 7 },
  ],
  pig: [
    { t: 'p', d: 'M34,44 L28,30 L42,38 Z' },
    { t: 'p', d: 'M66,44 L72,30 L58,38 Z' },
    { t: 'c', cx: 50, cy: 60, r: 19 },
    { t: 'e', cx: 50, cy: 76, rx: 10, ry: 7 },
  ],
};

interface Props {
  animal: ZodiacAnimalKey;
  size?: number;
  color?: string;
}

export default function ZodiacGlyph({ animal, size = 48, color = '#C8A24A' }: Props) {
  const shapes = RECIPES[animal] || RECIPES.horse;
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
