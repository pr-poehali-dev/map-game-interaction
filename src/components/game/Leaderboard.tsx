import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { apiLeaderboard } from './api';

interface Row { name: string; items: number; }

const medal = ['#ffd84d', '#cfd8ff', '#cd7f32'];

const Leaderboard = ({ onClose, username }: { onClose: () => void; username: string }) => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiLeaderboard()
      .then((d) => setRows(d.leaders || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-card border-2 border-accent pixel-shadow max-w-md w-full p-5 animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-pixel text-xs text-accent neon-glow flex items-center gap-2">
            <Icon name="Trophy" size={16} /> ЛИДЕРЫ
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-destructive">
            <Icon name="X" size={20} />
          </button>
        </div>
        <p className="font-mono text-base text-muted-foreground mb-4">По количеству созданных предметов</p>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {loading && <p className="font-mono text-lg text-muted-foreground text-center py-6">загрузка...</p>}
          {!loading && rows.length === 0 && (
            <p className="font-mono text-lg text-muted-foreground text-center py-6">пока никто не создавал предметы</p>
          )}
          {rows.map((r, i) => (
            <div
              key={r.name}
              className={`flex items-center gap-3 px-3 py-2 border-2 animate-fade-in ${
                r.name === username ? 'border-primary bg-background' : 'border-border'
              }`}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <span className="font-pixel text-[11px] w-6 text-center" style={{ color: medal[i] || 'hsl(var(--muted-foreground))' }}>
                {i + 1}
              </span>
              <span className="font-mono text-xl flex-1 truncate">{r.name}</span>
              <span className="font-mono text-xl text-accent flex items-center gap-1">
                <Icon name="Package" size={14} /> {r.items}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
