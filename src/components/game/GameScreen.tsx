import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import PixelSprite from './PixelSprite';
import { CHARACTERS, SpriteData, GameItem } from './sprites';
import { isFrame, sectorOf, hash2 } from './world';
import { Clan } from './ClansScreen';
import { apiSync, apiDrop, apiPick, apiEditItem, apiSolid, apiChat, apiPrivatize, apiExtend } from './api';

interface FloorItem {
  id: number;
  x: number;
  y: number;
  sprite: SpriteData;
  creator: string;
  editors: string[];
  solid: boolean;
}

interface Player {
  name: string;
  x: number;
  y: number;
  char: number;
}

interface ChatMsg {
  id: number;
  name: string;
  text: string;
}

export interface Privat {
  col: number;
  row: number;
  owner: string;
  clanTag: string;
  clanName: string;
  color: string;
  until: number;
}

const VIEW_W = 13;
const VIEW_H = 9;
const DAY = 86400000;

const GameScreen = ({
  username, charIndex, startX, startY, newItem, onConsumeNewItem,
  myClan, onOpenEditor, onOpenLeaders, onOpenClans, onEditItem,
}: {
  username: string;
  charIndex: number;
  startX: number;
  startY: number;
  newItem: GameItem | null;
  onConsumeNewItem: () => void;
  myClan: Clan | null;
  onOpenEditor: () => void;
  onOpenLeaders: () => void;
  onOpenClans: () => void;
  onEditItem: (item: GameItem, apply: (s: SpriteData) => void) => void;
}) => {
  const [pos, setPos] = useState({ x: startX, y: startY });
  const [others, setOthers] = useState<Player[]>([]);
  const [floor, setFloor] = useState<FloorItem[]>([]);
  const [privats, setPrivats] = useState<Privat[]>([]);
  const [messages, setMessages] = useState<ChatMsg[]>([]);

  const [inv, setInv] = useState<(GameItem | null)[]>(() => Array(10).fill(null));
  const [slot, setSlot] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const [hover, setHover] = useState<FloorItem | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const posRef = useRef(pos);
  posRef.current = pos;

  // периодическая синхронизация мира
  const doSync = useCallback(async () => {
    try {
      const p = posRef.current;
      const data = await apiSync(p.x, p.y);
      setOthers(data.players || []);
      setFloor(data.items || []);
      setPrivats(data.privats || []);
      setMessages((data.chat || []).map((m: ChatMsg) => ({ id: m.id, name: m.name, text: m.text })));
    } catch {
      /* тихо игнорируем сетевые сбои */
    }
  }, []);

  useEffect(() => {
    doSync();
    const t = setInterval(doSync, 1500);
    return () => clearInterval(t);
  }, [doSync]);

  // новый созданный предмет в свободный слот
  useEffect(() => {
    if (!newItem) return;
    setInv((prev) => {
      const n = [...prev];
      if (n[slot]) {
        const free = n.findIndex((x) => !x);
        if (free >= 0) { n[free] = newItem; setSlot(free); }
        else n[slot] = newItem;
      } else n[slot] = newItem;
      return n;
    });
    onConsumeNewItem();
    /* eslint-disable-next-line */
  }, [newItem]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const setSlotItem = (i: GameItem | null) =>
    setInv((prev) => { const n = [...prev]; n[slot] = i; return n; });

  const curSector = sectorOf(pos.x, pos.y);
  const curPrivat = useMemo(() => {
    if (!curSector) return null;
    return privats.find((p) => p.col === curSector.col && p.row === curSector.row && p.until > Date.now()) || null;
  }, [curSector, privats]);

  const canBuildHere = () => {
    if (isFrame(pos.x, pos.y)) return false;
    if (curPrivat) {
      if (myClan && myClan.tag === curPrivat.clanTag) return true;
      return curPrivat.owner === username && !curPrivat.clanTag;
    }
    return true;
  };

  const move = (dx: number, dy: number) =>
    setPos((p) => {
      const nx = p.x + dx;
      const ny = p.y + dy;
      if (floor.some((f) => f.x === nx && f.y === ny && f.solid)) return p;
      return { x: nx, y: ny };
    });

  const pickOrDrop = async () => {
    const hereItem = floor.find((f) => f.x === pos.x && f.y === pos.y);
    const cur = inv[slot];
    if (cur) {
      if (!canBuildHere() || hereItem) return;
      setSlotItem(null);
      try {
        await apiDrop({ x: pos.x, y: pos.y, sprite: cur.sprite, creator: cur.creator, editors: cur.editors, solid: cur.solid });
        doSync();
      } catch { setSlotItem(cur); }
    } else if (hereItem) {
      if (curPrivat && !(myClan && myClan.tag === curPrivat.clanTag) && curPrivat.owner !== username) return;
      try {
        await apiPick(hereItem.id);
        setSlotItem({ id: hereItem.id, sprite: hereItem.sprite, creator: hereItem.creator, editors: hereItem.editors, solid: hereItem.solid });
        doSync();
      } catch { /* занято кем-то ещё */ }
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (['arrowup', 'w', 'ц'].includes(k)) { e.preventDefault(); move(0, -1); }
      else if (['arrowdown', 's', 'ы'].includes(k)) { e.preventDefault(); move(0, 1); }
      else if (['arrowleft', 'a', 'ф'].includes(k)) { e.preventDefault(); move(-1, 0); }
      else if (['arrowright', 'd', 'в'].includes(k)) { e.preventDefault(); move(1, 0); }
      else if (/^[0-9]$/.test(k)) setSlot(k === '0' ? 9 : parseInt(k) - 1);
      else if (k === 'e' || k === 'у') { e.preventDefault(); pickOrDrop(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    /* eslint-disable-next-line */
  }, [pos, inv, slot, privats, floor]);

  const toggleSolid = async (item: FloorItem) => {
    try { await apiSolid(item.id, !item.solid); doSync(); } catch { /* */ }
  };

  const editFloorItem = (item: FloorItem) => {
    onEditItem(
      { id: item.id, sprite: item.sprite, creator: item.creator, editors: item.editors, solid: item.solid },
      async (s) => { try { await apiEditItem(item.id, s); doSync(); } catch { /* */ } },
    );
  };

  const privatizeCurrent = async () => {
    if (!curSector || curPrivat) return;
    try { await apiPrivatize(curSector.col, curSector.row); doSync(); } catch { /* */ }
  };

  const extendCurrent = async () => {
    if (!curPrivat) return;
    try { await apiExtend(curPrivat.col, curPrivat.row); doSync(); } catch { /* */ }
  };

  const sendMsg = async () => {
    const text = chatInput.trim();
    if (!text) return;
    setChatInput('');
    setMessages((prev) => [...prev, { id: Date.now(), name: username, text }]);
    try { await apiChat(text); doSync(); } catch { /* */ }
  };

  const cell = 'min(7vw, 54px)';
  const ox = pos.x - Math.floor(VIEW_W / 2);
  const oy = pos.y - Math.floor(VIEW_H / 2);

  const tiles = [];
  for (let vy = 0; vy < VIEW_H; vy++) {
    for (let vx = 0; vx < VIEW_W; vx++) {
      const wx = ox + vx;
      const wy = oy + vy;
      tiles.push({ vx, vy, wx, wy, frame: isFrame(wx, wy) });
    }
  }

  const privatAt = (wx: number, wy: number) => {
    const s = sectorOf(wx, wy);
    if (!s) return null;
    return privats.find((p) => p.col === s.col && p.row === s.row && p.until > Date.now()) || null;
  };

  const daysLeft = curPrivat ? Math.max(0, Math.ceil((curPrivat.until - Date.now()) / DAY)) : 0;

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-4 max-w-[1200px] mx-auto w-full">
      <div className="flex flex-col gap-3 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-pixel text-primary text-xs neon-glow flex items-center gap-2">
            <Icon name="Compass" size={16} /> X:{pos.x} Y:{pos.y}
          </h2>
          <div className="flex items-center gap-2 font-mono text-lg text-muted-foreground">
            <Icon name="Users" size={16} className="text-primary" /> {others.length + 1} онлайн ·
            <Icon name="Map" size={16} className="text-primary" />
            {curSector ? `сектор ${curSector.col}:${curSector.row}` : 'рамка'}
          </div>
        </div>

        {curPrivat && (
          <div
            className="font-pixel text-[10px] px-3 py-2 border-2 animate-fade-in flex items-center gap-2"
            style={{ borderColor: curPrivat.color, color: curPrivat.color, background: 'hsl(var(--card))' }}
          >
            <Icon name="ShieldCheck" size={14} />
            ПРИВАТ {curPrivat.clanTag ? `[${curPrivat.clanTag}] ${curPrivat.clanName}` : curPrivat.owner} · ещё {daysLeft} дн.
          </div>
        )}

        <div
          className="relative bg-card border-2 border-border pixel-shadow overflow-hidden mx-auto"
          style={{ width: `calc(${cell} * ${VIEW_W})`, height: `calc(${cell} * ${VIEW_H})` }}
          onMouseLeave={() => setHover(null)}
        >
          {tiles.map((t) => {
            const pr = !t.frame ? privatAt(t.wx, t.wy) : null;
            const decor = !t.frame && hash2(t.wx, t.wy) > 0.88;
            return (
              <div
                key={`${t.vx}-${t.vy}`}
                className="absolute"
                style={{
                  left: `calc(${cell} * ${t.vx})`,
                  top: `calc(${cell} * ${t.vy})`,
                  width: cell,
                  height: cell,
                  background: t.frame
                    ? 'repeating-linear-gradient(45deg, hsl(var(--muted)) 0 6px, hsl(var(--background)) 6px 12px)'
                    : pr ? `${pr.color}14` : 'transparent',
                  boxShadow: pr ? `inset 0 0 0 1px ${pr.color}55` : 'inset 0 0 0 1px hsl(var(--border) / 0.25)',
                }}
              >
                {decor && <div className="w-1.5 h-1.5 bg-muted-foreground/30 m-1" />}
              </div>
            );
          })}

          {floor.map((f) => {
            const vx = f.x - ox;
            const vy = f.y - oy;
            if (vx < 0 || vy < 0 || vx >= VIEW_W || vy >= VIEW_H) return null;
            return (
              <div
                key={f.id}
                className="absolute flex items-center justify-center cursor-pointer"
                style={{ left: `calc(${cell} * ${vx})`, top: `calc(${cell} * ${vy})`, width: cell, height: cell }}
                onMouseEnter={() => setHover(f)}
              >
                <PixelSprite grid={f.sprite.grid} palette={f.sprite.palette} size={1.4} className={f.solid ? 'ring-1 ring-destructive/60' : 'opacity-95'} />
              </div>
            );
          })}

          {others.map((p) => {
            const vx = p.x - ox;
            const vy = p.y - oy;
            if (vx < 0 || vy < 0 || vx >= VIEW_W || vy >= VIEW_H) return null;
            return (
              <div
                key={p.name}
                className="absolute flex flex-col items-center justify-center transition-all duration-300"
                style={{ left: `calc(${cell} * ${vx})`, top: `calc(${cell} * ${vy})`, width: cell, height: cell, zIndex: 10 }}
              >
                <span className="absolute -top-1 font-mono text-[11px] leading-none text-muted-foreground whitespace-nowrap">{p.name}</span>
                <PixelSprite grid={CHARACTERS[p.char % CHARACTERS.length].grid} palette={CHARACTERS[p.char % CHARACTERS.length].palette} size={4} />
              </div>
            );
          })}

          <div
            className="absolute flex flex-col items-center justify-center"
            style={{
              left: `calc(${cell} * ${Math.floor(VIEW_W / 2)})`,
              top: `calc(${cell} * ${Math.floor(VIEW_H / 2)})`,
              width: cell, height: cell, zIndex: 20,
            }}
          >
            <span className="absolute -top-1 font-mono text-[11px] leading-none text-primary whitespace-nowrap">{username}</span>
            <div className="animate-float-bob drop-shadow-[0_0_6px_rgba(43,220,135,0.8)]">
              <PixelSprite grid={CHARACTERS[charIndex].grid} palette={CHARACTERS[charIndex].palette} size={4.4} />
            </div>
          </div>

          {hover && (
            <div className="absolute bottom-1 left-1 right-1 bg-background/95 border-2 border-primary p-2 z-30 animate-fade-in">
              <p className="font-mono text-base text-primary">Создатель: <span className="text-foreground">{hover.creator}</span></p>
              <p className="font-mono text-sm text-muted-foreground">
                Меняли: {hover.editors.length ? hover.editors.join(', ') : '—'}
              </p>
              <p className="font-mono text-sm text-muted-foreground flex items-center gap-1">
                <Icon name={hover.solid ? 'Ban' : 'Footprints'} size={12} />
                {hover.solid ? 'непроходимый' : 'проходимый'}
              </p>
              {curPrivat && (myClan?.tag === curPrivat.clanTag || curPrivat.owner === username) && (
                <div className="flex gap-2 mt-1">
                  <button onClick={() => toggleSolid(hover)} className="font-mono text-sm border border-border px-2 py-0.5 hover:border-primary">
                    {hover.solid ? 'сделать проходимым' : 'непроходимым'}
                  </button>
                  <button onClick={() => editFloorItem(hover)} className="font-mono text-sm border border-border px-2 py-0.5 hover:border-accent">
                    редактировать
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-start justify-between flex-wrap gap-3 mt-1">
          <div className="grid grid-cols-3 gap-1 w-[132px] select-none">
            <span />
            <DPad onClick={() => move(0, -1)} icon="ChevronUp" />
            <span />
            <DPad onClick={() => move(-1, 0)} icon="ChevronLeft" />
            <DPad onClick={pickOrDrop} icon={inv[slot] ? 'Hand' : 'Grab'} active />
            <DPad onClick={() => move(1, 0)} icon="ChevronRight" />
            <span />
            <DPad onClick={() => move(0, 1)} icon="ChevronDown" />
            <span />
          </div>

          <div className="flex flex-col gap-2 flex-1 min-w-[160px]">
            {curSector ? (
              curPrivat ? (
                (curPrivat.owner === username || myClan?.tag === curPrivat.clanTag) ? (
                  <button onClick={extendCurrent} className="font-pixel text-[9px] bg-secondary text-secondary-foreground py-3 pixel-shadow active:translate-y-[2px] active:shadow-none">
                    ПРОДЛИТЬ ПРИВАТ (+3 ДНЯ)
                  </button>
                ) : (
                  <p className="font-mono text-base text-muted-foreground text-center">сектор занят</p>
                )
              ) : (
                <button onClick={privatizeCurrent} className="font-pixel text-[9px] bg-accent text-accent-foreground py-3 pixel-shadow active:translate-y-[2px] active:shadow-none">
                  ПРИВАТИЗИРОВАТЬ (3 ДНЯ)
                </button>
              )
            ) : (
              <p className="font-mono text-base text-muted-foreground text-center">в рамке нельзя строить</p>
            )}
            <button
              onClick={pickOrDrop}
              className="font-pixel text-[9px] bg-primary text-primary-foreground py-3 pixel-shadow active:translate-y-[2px] active:shadow-none"
            >
              {inv[slot] ? 'ПОЛОЖИТЬ' : 'ВЗЯТЬ'}
            </button>
          </div>
        </div>

        <div className="flex gap-1.5 justify-center flex-wrap">
          {inv.map((it, i) => (
            <button
              key={i}
              onClick={() => setSlot(i)}
              className={`w-12 h-12 border-2 flex items-center justify-center relative pixel-shadow transition-all ${
                slot === i ? 'border-primary bg-background scale-105' : 'border-border bg-card hover:border-muted-foreground'
              }`}
            >
              <span className="absolute top-0 left-0.5 font-mono text-xs text-muted-foreground">{i === 9 ? 0 : i + 1}</span>
              {it && <PixelSprite grid={it.sprite.grid} palette={it.sprite.palette} size={1.1} />}
            </button>
          ))}
        </div>
        <p className="font-mono text-base text-muted-foreground text-center">
          WASD — ходить · 1–0 — слот · E — взять/положить · мир бесконечен и общий для всех
        </p>
      </div>

      <div className="flex flex-col gap-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="grid grid-cols-3 gap-2">
          <SideBtn icon="Brush" label="СОЗДАТЬ" onClick={onOpenEditor} accent />
          <SideBtn icon="Shield" label="КЛАНЫ" onClick={onOpenClans} />
          <SideBtn icon="Trophy" label="ТОП" onClick={onOpenLeaders} />
        </div>

        {myClan && (
          <div className="border-2 border-border bg-card px-3 py-2 font-mono text-base flex items-center justify-between">
            <span style={{ color: myClan.color }}>[{myClan.tag}] {myClan.name}</span>
            <span className="text-muted-foreground">{privats.filter((p) => p.clanTag === myClan.tag && p.until > Date.now()).length} секторов</span>
          </div>
        )}

        <div className="bg-card border-2 border-border flex flex-col flex-1 min-h-[260px] pixel-shadow">
          <div className="font-pixel text-[10px] text-secondary px-3 py-2 border-b-2 border-border flex items-center gap-2">
            <Icon name="MessagesSquare" size={14} /> ОБЩИЙ ЧАТ
          </div>
          <div ref={chatRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2 max-h-[300px]">
            {messages.map((m) => (
              <div key={m.id} className="font-mono text-lg leading-tight animate-fade-in">
                <span className={`font-bold ${m.name === username ? 'text-primary' : 'text-secondary'}`}>{m.name}:</span>{' '}
                <span className="text-foreground/90">{m.text}</span>
              </div>
            ))}
            {messages.length === 0 && (
              <p className="font-mono text-base text-muted-foreground text-center py-4">сообщений пока нет</p>
            )}
          </div>
          <div className="flex border-t-2 border-border">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMsg()}
              placeholder="написать всем..."
              className="flex-1 bg-background px-3 py-2 font-mono text-lg outline-none placeholder:text-muted-foreground"
            />
            <button onClick={sendMsg} className="bg-secondary text-secondary-foreground px-3 hover:opacity-90">
              <Icon name="Send" size={16} />
            </button>
          </div>
        </div>

        <a
          href="#"
          className="font-mono text-base text-center text-muted-foreground border-2 border-border py-2 hover:border-accent hover:text-accent transition-colors flex items-center justify-center gap-2"
        >
          <Icon name="LifeBuoy" size={16} /> Поддержка администрации
        </a>
      </div>
    </div>
  );
};

const DPad = ({ onClick, icon, active }: { onClick: () => void; icon: string; active?: boolean }) => (
  <button
    onClick={onClick}
    className={`aspect-square flex items-center justify-center border-2 pixel-shadow active:translate-y-[2px] active:shadow-none transition-all ${
      active ? 'bg-accent text-accent-foreground border-accent' : 'bg-card text-foreground border-border hover:border-primary'
    }`}
  >
    <Icon name={icon} size={20} />
  </button>
);

const SideBtn = ({ icon, label, onClick, accent }: { icon: string; label: string; onClick: () => void; accent?: boolean }) => (
  <button
    onClick={onClick}
    className={`font-pixel text-[8px] py-3 flex flex-col items-center gap-2 pixel-shadow active:translate-y-[2px] active:shadow-none transition-all ${
      accent ? 'bg-accent text-accent-foreground' : 'bg-card text-foreground border-2 border-border hover:border-primary'
    }`}
  >
    <Icon name={icon} size={18} />
    {label}
  </button>
);

export default GameScreen;
