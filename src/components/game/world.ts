// Геометрия бесконечного мира.
// Сектор = 10×10 клеток. Между секторами рамка толщиной 2 блока (только проход).
// Период = 12. В ячейке периода [0,1] — рамка, [2..11] — внутренность сектора.

export const SECTOR = 10;
export const FRAME = 2;
export const PERIOD = SECTOR + FRAME; // 12

const mod = (n: number, m: number) => ((n % m) + m) % m;

// Является ли мировая клетка частью рамки сетки (ходить можно, ставить нельзя)
export const isFrame = (wx: number, wy: number): boolean =>
  mod(wx, PERIOD) < FRAME || mod(wy, PERIOD) < FRAME;

// Координаты сектора, которому принадлежит клетка (null если это рамка)
export const sectorOf = (wx: number, wy: number): { col: number; row: number } | null => {
  if (isFrame(wx, wy)) return null;
  return { col: Math.floor(wx / PERIOD), row: Math.floor(wy / PERIOD) };
};

export const sectorKey = (col: number, row: number) => `${col}:${row}`;

// Простой детерминированный шум для процедурной генерации декора
export const hash2 = (x: number, y: number): number => {
  let h = x * 374761393 + y * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  return mod((h ^ (h >> 16)), 1000) / 1000;
};
