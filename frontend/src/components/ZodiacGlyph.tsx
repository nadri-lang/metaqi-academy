import React from 'react';
import { Image } from 'react-native';
import { ZodiacAnimalKey } from '@/src/constants/Zodiac';

// Cropped from the gold-on-navy zodiac emblem artwork (see capturi.png) -
// ring + animal baked into the image, background made transparent so it
// drops onto any screen background. The per-day element badge is drawn
// separately by ZodiacEmblem, not baked into these.
const ZODIAC_IMAGES: Record<ZodiacAnimalKey, any> = {
  rat: require('../../assets/images/zodiac/rat.png'),
  ox: require('../../assets/images/zodiac/ox.png'),
  tiger: require('../../assets/images/zodiac/tiger.png'),
  rabbit: require('../../assets/images/zodiac/rabbit.png'),
  dragon: require('../../assets/images/zodiac/dragon.png'),
  snake: require('../../assets/images/zodiac/snake.png'),
  horse: require('../../assets/images/zodiac/horse.png'),
  goat: require('../../assets/images/zodiac/goat.png'),
  monkey: require('../../assets/images/zodiac/monkey.png'),
  rooster: require('../../assets/images/zodiac/rooster.png'),
  dog: require('../../assets/images/zodiac/dog.png'),
  pig: require('../../assets/images/zodiac/pig.png'),
};

interface Props {
  animal: ZodiacAnimalKey;
  size?: number;
}

export default function ZodiacGlyph({ animal, size = 48 }: Props) {
  const source = ZODIAC_IMAGES[animal];
  if (!source) return null;
  return (
    <Image
      source={source}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}
