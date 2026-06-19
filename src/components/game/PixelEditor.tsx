import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { SpriteData } from './sprites';

const SIZE = 8;
const PALETTE = [
  { ch: '.', color: '' },
  { ch: 'a', color: '#2bdc87' },
  { ch: 'b', color: '#6effb0' },
  { ch: 'c', color: '#c26bff' },
  { ch: 'd', color: '#ff5d6c' },
  { ch: 'e', color: '#ffd84d' },
  { ch: 'f', color: '#4dc9ff' },
  { ch: 'g', color: '#ffffff' },
  { ch: 'h', color: '#0b0f1a' },
  { ch: 'i', color: '#8a5a2b' },
];

const empty = () => Array.from({ length: SIZE }, () => '.'.repeat(SIZE).split(''));

const PixelEditor = ({ onSave, onClose }: { onSave: (s: SpriteData) => void; onClose: () => void }) => {
  const [cells, setCells] = useState<string[][]>(empty);
  const [active, setActive] = useState('a');
  const [drawing, setDrawing] = useState(false);

  const paint = (y: number, x: number) => {
    setCells((prev) => {
      const next = prev.map((r) => [...r]);
      next[y][x] = active;
      return next;
    });
  };

  const save = () => {
    const palette: Record<string, string> = { '.': '' };
    PALETTE.forEach((p) => p.ch !== '.' && (palette[p.ch] = p.color));
    onSave({ grid: cells.map((r) => r.join('')), palette });
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-card border-2 border-primary pixel-shadow max-w-md w-full p-5 animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-pixel text-xs text-primary neon-glow flex items-center gap-2">
            <Icon name="Brush" size={16} /> НАРИСУЙ ПРЕДМЕТ
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
              const color = PALETTE.find((p) => p.ch === ch)?.color;
              return (
                <button
                  key={`${y}-${x}`}
                  onMouseDown={() => { setDrawing(true); paint(y, x); }}
                  onMouseEnter={() => drawing && paint(y, x)}
                  onMouseUp={() => setDrawing(false)}
                  className="w-9 h-9 border border-border/40"
                  style={{ background: color || 'transparent' }}
                />
              );
            }),
          )}
        </div>

        {/* палитра */}
        <div className="flex flex-wrap gap-2 justify-center mt-4">
          {PALETTE.map((p) => (
            <button
              key={p.ch}
              onClick={() => setActive(p.ch)}
              className={`w-8 h-8 border-2 transition-all ${active === p.ch ? 'border-primary scale-110' : 'border-border'} ${
                p.ch === '.' ? 'bg-background' : ''
              }`}
              style={{ background: p.color || undefined }}
              title={p.ch === '.' ? 'ластик' : 'цвет'}
            >
              {p.ch === '.' && <Icon name="Eraser" size={14} className="mx-auto text-muted-foreground" />}
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
            СОЗДАТЬ И ВЗЯТЬ В РУКУ
          </button>
        </div>
      </div>
    </div>
  );
};

export default PixelEditor;
