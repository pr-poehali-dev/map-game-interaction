import { useState } from 'react';
import Icon from '@/components/ui/icon';

export interface Clan {
  id: number;
  name: string;
  tag: string;
  members: string[];
  color: string;
}

const SEED_CLANS: Clan[] = [
  { id: 1, name: 'НЕОНОВЫЕ ВОЛКИ', tag: 'NEO', members: ['NEO_42', 'gh0st', 'mintik'], color: '#c26bff' },
  { id: 2, name: 'ПИКСЕЛЬ ОРДА', tag: 'PXL', members: ['pixelKa', 'dr_bit'], color: '#2bdc87' },
  { id: 3, name: 'РЕТРО ЛЕГИОН', tag: 'RTR', members: ['retr0'], color: '#ffd84d' },
];

const ClansScreen = ({ username, myClan, onJoin, onLeave, onClose }: {
  username: string;
  myClan: Clan | null;
  onJoin: (c: Clan) => void;
  onLeave: () => void;
  onClose: () => void;
}) => {
  const [query, setQuery] = useState('');
  const [newName, setNewName] = useState('');
  const [requested, setRequested] = useState<number[]>([]);
  const [clans, setClans] = useState<Clan[]>(SEED_CLANS);

  const filtered = clans.filter((c) =>
    (c.name + c.tag).toLowerCase().includes(query.toLowerCase()),
  );

  const createClan = () => {
    if (!newName.trim() || myClan) return;
    const c: Clan = {
      id: Date.now(),
      name: newName.trim().toUpperCase(),
      tag: newName.trim().slice(0, 3).toUpperCase(),
      members: [username],
      color: '#4dc9ff',
    };
    setClans((p) => [c, ...p]);
    onJoin(c);
    setNewName('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-card border-2 border-secondary pixel-shadow max-w-md w-full p-5 animate-scale-in max-h-[88vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-pixel text-xs text-secondary neon-glow flex items-center gap-2">
            <Icon name="Shield" size={16} /> КЛАНЫ
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-destructive">
            <Icon name="X" size={20} />
          </button>
        </div>

        {myClan ? (
          <div className="border-2 border-primary bg-background p-3 mb-4 flex items-center justify-between">
            <div>
              <p className="font-mono text-base text-muted-foreground">ТВОЙ КЛАН</p>
              <p className="font-pixel text-[11px]" style={{ color: myClan.color }}>[{myClan.tag}] {myClan.name}</p>
              <p className="font-mono text-base text-muted-foreground">{myClan.members.length} участников</p>
            </div>
            <button
              onClick={onLeave}
              className="font-mono text-base border-2 border-border px-3 py-2 hover:border-destructive hover:text-destructive transition-colors"
            >
              выйти
            </button>
          </div>
        ) : (
          <div className="flex gap-2 mb-4">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="название нового клана"
              className="flex-1 bg-background border-2 border-border px-3 py-2 font-mono text-lg outline-none placeholder:text-muted-foreground"
            />
            <button onClick={createClan} className="font-pixel text-[9px] bg-secondary text-secondary-foreground px-3 pixel-shadow">
              СОЗДАТЬ
            </button>
          </div>
        )}

        <div className="flex items-center border-2 border-border bg-background mb-3">
          <span className="px-3 text-muted-foreground"><Icon name="Search" size={16} /></span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="поиск по названию..."
            className="flex-1 bg-transparent py-2 font-mono text-lg outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="space-y-2 overflow-y-auto flex-1">
          {filtered.map((c) => {
            const mine = myClan?.id === c.id;
            const req = requested.includes(c.id);
            return (
              <div key={c.id} className="flex items-center gap-3 border-2 border-border bg-background px-3 py-2">
                <span className="font-pixel text-[10px]" style={{ color: c.color }}>[{c.tag}]</span>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-lg truncate">{c.name}</p>
                  <p className="font-mono text-sm text-muted-foreground">{c.members.length} в составе</p>
                </div>
                {mine ? (
                  <span className="font-mono text-base text-primary flex items-center gap-1"><Icon name="Check" size={14} /> ваш</span>
                ) : req ? (
                  <span className="font-mono text-base text-accent">заявка ↑</span>
                ) : (
                  <button
                    disabled={!!myClan}
                    onClick={() => setRequested((p) => [...p, c.id])}
                    className="font-mono text-base border-2 border-border px-3 py-1 hover:border-primary hover:text-primary disabled:opacity-40 transition-colors"
                  >
                    заявка
                  </button>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="font-mono text-lg text-muted-foreground text-center py-6">кланы не найдены</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClansScreen;
