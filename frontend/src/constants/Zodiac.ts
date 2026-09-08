// The 12 Chinese zodiac animals and 5 Wu Xing elements, used to auto-select
// the gold emblem icon on the home hero / Energía del Día screens from the
// admin's structured animal+element picks instead of parsing free text.
// See rork/DESIGN_NOTES.md for the visual reference this was built from.

export type ZodiacAnimalKey =
  | 'rat' | 'ox' | 'tiger' | 'rabbit' | 'dragon' | 'snake'
  | 'horse' | 'goat' | 'monkey' | 'rooster' | 'dog' | 'pig';

export type ElementKey = 'wood' | 'fire' | 'earth' | 'metal' | 'water';

export const ZODIAC_ANIMALS: { key: ZodiacAnimalKey; label: string }[] = [
  { key: 'rat', label: 'Rata' },
  { key: 'ox', label: 'Búfalo' },
  { key: 'tiger', label: 'Tigre' },
  { key: 'rabbit', label: 'Conejo' },
  { key: 'dragon', label: 'Dragón' },
  { key: 'snake', label: 'Serpiente' },
  { key: 'horse', label: 'Caballo' },
  { key: 'goat', label: 'Cabra' },
  { key: 'monkey', label: 'Mono' },
  { key: 'rooster', label: 'Gallo' },
  { key: 'dog', label: 'Perro' },
  { key: 'pig', label: 'Cerdo' },
];

export const ELEMENTS: { key: ElementKey; label: string; icon: string; color: string }[] = [
  { key: 'wood', label: 'Madera', icon: 'leaf', color: '#5B9A6F' },
  { key: 'fire', label: 'Fuego', icon: 'fire', color: '#D8683F' },
  { key: 'earth', label: 'Tierra', icon: 'terrain', color: '#B08D57' },
  { key: 'metal', label: 'Metal', icon: 'circle-slice-8', color: '#B9B4A6' },
  { key: 'water', label: 'Agua', icon: 'water', color: '#4E85AC' },
];

export function zodiacAnimalLabel(key?: string | null): string | undefined {
  return ZODIAC_ANIMALS.find((a) => a.key === key)?.label;
}

export function elementLabel(key?: string | null): string | undefined {
  return ELEMENTS.find((e) => e.key === key)?.label;
}

export function elementColor(key?: string | null): string | undefined {
  return ELEMENTS.find((e) => e.key === key)?.color;
}

export function elementIcon(key?: string | null): string | undefined {
  return ELEMENTS.find((e) => e.key === key)?.icon;
}

/** "Caballo de Fuego" style composed label, for auto-filling the free-text display field. */
export function composeAnimalLabel(animal?: string | null, element?: string | null): string {
  const animalName = zodiacAnimalLabel(animal);
  const elementName = elementLabel(element);
  if (animalName && elementName) return `${animalName} de ${elementName}`;
  return animalName || '';
}
