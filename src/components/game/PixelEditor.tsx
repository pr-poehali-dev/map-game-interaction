import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { SpriteData, DRAW_PALETTE, buildPalette } from './sprites';

const SIZE = 32;

const empty = () => Array.from({ length: SIZE }, () => '.'.repeat(SIZE).split(''));
const fromSprite = (s?: SpriteData) =>
  s ? s.grid.map((r) => r.padEnd(SIZE, '.').slice(0, SIZE).split('')) : empty();

const PixelEditor = ({ initial, onSave, onClose }: {
  initial?: SpriteData | null;
  onSave: (s: SpriteData) => void;
  onClose: () => void;
}) => {
  const [cells, setCells] = useState<string[][]>(() => fromSprite(initial || undefined));
  const [active, setActive] = useState('a');
  const [drawing, setDrawing] = useState(false);

  const paint = (y: number, x: number) => {
    setCells((prev) => {
      const next = prev.map((r) => [...r]);
      next[y][x] = active;
      return next;
    });
  };

  const save = () => onSave({ grid: cells.map((r) => r.join('')), palette: buildPalette() });

  return (
    <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-card border-2 border-primary pixel-shadow max-w-lg w-full p-5 animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-pixel text-xs text-primary neon-glow flex items-center gap-2">
            <Icon name="Brush" size={16} /> ХОЛСТ 32×32
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-destructive">
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* холст */}
        <div
          className="grid mx-auto bg-background border-2 border-border pixel-shadow w-fit select-none"
          style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}
          onMouseLeave={() => setDrawing(false)}
        >
          {cells.map((row, y) =>
            row.map((ch, x) => {
              const color = DRAW_PALETTE.find((p) => p.ch === ch)?.color;
              return (
                <button
                  key={`${y}-${x}`}
                  onMouseDown={() => { setDrawing(true); paint(y, x); }}
                  onMouseEnter={() => drawing && paint(y, x)}
                  onMouseUp={() => setDrawing(false)}
                  className="w-3 h-3 sm:w-3.5 sm:h-3.5 hover:opacity-70"
                  style={{ background: color || 'transparent' }}
                />
              );
            }),
          )}
        </div>

        {/* палитра */}
        <div className="flex flex-wrap gap-2 justify-center mt-4">
          {DRAW_PALETTE.map((p) => (
            <button
              key={p.ch}
              onClick={() => setActive(p.ch)}
              className={`w-7 h-7 border-2 transition-all ${active === p.ch ? 'border-primary scale-110' : 'border-border'} ${
                p.ch === '.' ? 'bg-background' : ''
              }`}
              style={{ background: p.color || undefined }}
              title={p.ch === '.' ? 'ластик' : 'цвет'}
            >
              {p.ch === '.' && <Icon name="Eraser" size={13} className="mx-auto text-muted-foreground" />}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mt-5">
          <button
            onClick={() => setCells(empty())}
            className="flex-1 font-pixel text-[10px] border-2 border-border text-foreground py-3 hover:border-destructive hover:text-destructive transition-colors"
          >
            ОЧИСТИТЬ
          </button>
          <button
            onClick={save}
            className="flex-[2] font-pixel text-[10px] bg-primary text-primary-foreground py-3 pixel-shadow active:translate-y-[2px] active:shadow-none transition-all"
          >
            {initial ? 'СОХРАНИТЬ ИЗМЕНЕНИЯ' : 'СОЗДАТЬ И ВЗЯТЬ'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PixelEditor;
