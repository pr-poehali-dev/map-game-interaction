export interface SpriteData {
  grid: string[];
  palette: Record<string, string>;
}

// Цвета: . = прозрачный
export const CHARACTERS: SpriteData[] = [
  {
    // Зелёный рыцарь
    palette: { '.': '', s: '#2bdc87', d: '#16915a', e: '#0b0f1a', a: '#ffd84d' },
    grid: [
      '..ssss..',
      '.ssssss.',
      '.sesese.',
      '.ssssss.',
      '..aaaa..',
      '.daaaad.',
      '.d.dd.d.',
      '..d..d..',
    ],
  },
  {
    // Фиолетовый маг
    palette: { '.': '', s: '#c26bff', d: '#7d2fc7', e: '#0b0f1a', a: '#ffd84d' },
    grid: [
      '...dd...',
      '..dddd..',
      '.ssssss.',
      '.sesese.',
      '.ssssss.',
      '.daaaad.',
      '.d.aa.d.',
      '..d..d..',
    ],
  },
  {
    // Красный воин
    palette: { '.': '', s: '#ff5d6c', d: '#c4283c', e: '#0b0f1a', a: '#4dc9ff' },
    grid: [
      '..ssss..',
      '.ssssss.',
      '.sesese.',
      '.ssssss.',
      '.aaaaaa.',
      '.daaaad.',
      '.d.dd.d.',
      '..d..d..',
    ],
  },
  {
    // Золотой герой
    palette: { '.': '', s: '#ffd84d', d: '#d49b1a', e: '#0b0f1a', a: '#2bdc87' },
    grid: [
      '..ssss..',
      '.ssssss.',
      '.sesese.',
      '.ssssss.',
      '..aaaa..',
      '.daaaad.',
      '.d.dd.d.',
      '..d..d..',
    ],
  },
];

export const ITEMS: SpriteData[] = [
  {
    // Сундук
    palette: { '.': '', w: '#8a5a2b', d: '#5c3a16', a: '#ffd84d' },
    grid: [
      '........',
      '.wwwwww.',
      '.wdddwd.',
      '.wwawww.',
      '.wwawww.',
      '.dddddd.',
      '........',
      '........',
    ],
  },
  {
    // Зелье
    palette: { '.': '', g: '#6effb0', d: '#2bdc87', a: '#ffffff' },
    grid: [
      '...aa...',
      '...dd...',
      '..gggg..',
      '.gggggg.',
      '.gaaggg.',
      '.gggggg.',
      '..dddd..',
      '........',
    ],
  },
  {
    // Меч
    palette: { '.': '', m: '#cfd8ff', a: '#ffd84d', d: '#7d2fc7' },
    grid: [
      '...mm...',
      '...mm...',
      '...mm...',
      '...mm...',
      '..aaaa..',
      '...dd...',
      '...dd...',
      '........',
    ],
  },
];
