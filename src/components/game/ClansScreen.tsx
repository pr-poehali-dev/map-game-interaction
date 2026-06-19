import { useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { apiClanList, apiClanCreate, apiClanRequest, apiClanRequests, apiClanAccept, apiClanLeave } from './api';

export interface Clan {
  id: number;
  name: string;
  tag: string;
  members: string[];
  color: string;
}

interface ClanRow {
  id: number;
  name: string;
  tag: string;
  color: string;
  count: number;
}

interface JoinRequest {
  id: number;
  username: string;
}

const ClansScreen = ({ myClan, onClanChange, onClose }: {
  myClan: Clan | null;
  onClanChange: (c: Clan | null) => void;
  onClose: () => void;
}) => {
  const [query, setQuery] = useState('');
  const [newName, setNewName] = useState('');
  const [requested, setRequested] = useState<number[]>([]);
  const [clans, setClans] = useState<ClanRow[]>([]);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [error, setError] = useState('');

  const load = useCallback(async (q: string) => {
    try {
      const data = await apiClanList(q);
      setClans(data.clans || []);
      setRequested(data.requested || []);
      onClanChange(data.myClan || null);
      if (data.myClan) {
        const r = await apiClanRequests();
        setRequests(r.requests || []);
      } else {
        setRequests([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    }
    /* eslint-disable-next-line */
  }, []);

  useEffect(() => { load(''); }, [load]);
  useEffect(() => {
    const t = setTimeout(() => load(query), 250);
    return () => clearTimeout(t);
  }, [query, load]);

  const createClan = async () => {
    if (!newName.trim() || myClan) return;
    setError('');
    try {
      const data = await apiClanCreate(newName.trim());
      onClanChange(data.myClan);
      setNewName('');
      load('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    }
  };

  const sendRequest = async (id: number) => {
    setRequested((p) => [...p, id]);
    try { await apiClanRequest(id); } catch { /* */ }
  };

  const accept = async (reqId: number) => {
    try { await apiClanAccept(reqId); load(''); } catch { /* */ }
  };

  const leave = async () => {
    try { await apiClanLeave(); onClanChange(null); load(''); } catch { /* */ }
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

        {error && <p className="font-mono text-base text-destructive mb-2">{error}</p>}

        {myClan ? (
          <div className="border-2 border-primary bg-background p-3 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-base text-muted-foreground">ТВОЙ КЛАН</p>
                <p className="font-pixel text-[11px]" style={{ color: myClan.color }}>[{myClan.tag}] {myClan.name}</p>
                <p className="font-mono text-base text-muted-foreground">{myClan.members.length} участников</p>
              </div>
              <button
                onClick={leave}
                className="font-mono text-base border-2 border-border px-3 py-2 hover:border-destructive hover:text-destructive transition-colors"
              >
                выйти
              </button>
            </div>
            {requests.length > 0 && (
              <div className="mt-3 border-t border-border pt-2">
                <p className="font-mono text-base text-accent mb-1">Заявки на вступление:</p>
                {requests.map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-1">
                    <span className="font-mono text-lg">{r.username}</span>
                    <button onClick={() => accept(r.id)} className="font-mono text-base border border-primary text-primary px-2 py-0.5 hover:bg-primary hover:text-primary-foreground transition-colors">
                      принять
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex gap-2 mb-4">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createClan()}
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
          {clans.map((c) => {
            const mine = myClan?.id === c.id;
            const req = requested.includes(c.id);
            return (
              <div key={c.id} className="flex items-center gap-3 border-2 border-border bg-background px-3 py-2">
                <span className="font-pixel text-[10px]" style={{ color: c.color }}>[{c.tag}]</span>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-lg truncate">{c.name}</p>
                  <p className="font-mono text-sm text-muted-foreground">{c.count} в составе</p>
                </div>
                {mine ? (
                  <span className="font-mono text-base text-primary flex items-center gap-1"><Icon name="Check" size={14} /> ваш</span>
                ) : req ? (
                  <span className="font-mono text-base text-accent">заявка ↑</span>
                ) : (
                  <button
                    disabled={!!myClan}
                    onClick={() => sendRequest(c.id)}
                    className="font-mono text-base border-2 border-border px-3 py-1 hover:border-primary hover:text-primary disabled:opacity-40 transition-colors"
                  >
                    заявка
                  </button>
                )}
              </div>
            );
          })}
          {clans.length === 0 && (
            <p className="font-mono text-lg text-muted-foreground text-center py-6">кланы не найдены</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClansScreen;