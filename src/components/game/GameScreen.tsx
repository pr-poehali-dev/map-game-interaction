import { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import PixelSprite from './PixelSprite';
import { CHARACTERS, ITEMS, SpriteData } from './sprites';

interface FloorItem {
  id: number;
  x: number;
  y: number;
  sprite: SpriteData;
  owner: string;
}

interface Player {
  id: number;
  name: string;
  x: number;
  y: number;
  char: number;
  me?: boolean;
}

interface ChatMsg {
  id: number;
  name: string;
  text: string;
  color: string;
}

const GRID_W = 14;
const GRID_H = 9;

const GameScreen = ({ username, charIndex, customItem, onOpenEditor, onOpenLeaders }: {
  username: string;
  charIndex: number;
  customItem: SpriteData | null;
  onOpenEditor: () => void;
  onOpenLeaders: () => void;
}) => {
  const [players, setPlayers] = useState<Player[]>([
    { id: 1, name: username, x: 6, y: 4, char: charIndex, me: true },
    { id: 2, name: 'NEO_42', x: 2, y: 2, char: 1 },
    { id: 3, name: 'pixelKa', x: 10, y: 6, char: 2 },
    { id: 4, name: 'retr0', x: 11, y: 1, char: 3 },
  ]);

  const [floor, setFloor] = useState<FloorItem[]>([
    { id: 101, x: 4, y: 5, sprite: ITEMS[0], owner: 'NEO_42' },
    { id: 102, x: 8, y: 3, sprite: ITEMS[1], owner: 'pixelKa' },
    { id: 103, x: 3, y: 7, sprite: ITEMS[2], owner: 'retr0' },
  ]);

  const [hand, setHand] = useState<SpriteData | null>(customItem);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: 1, name: 'NEO_42', text: 'кто кинул сундук возле фонтана?', color: 'text-secondary' },
    { id: 2, name: 'pixelKa', text: 'я зелье оставила, забирайте', color: 'text-primary' },
    { id: 3, name: 'retr0', text: 'го фарм предметов на лидерборд', color: 'text-accent' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);

  const me = players.find((p) => p.me)!;

  useEffect(() => {
    setHand(customItem);
  }, [customItem]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const move = (dx: number, dy: number) => {
    setPlayers((prev) =>
      prev.map((p) =>
        p.me
          ? {
              ...p,
              x: Math.max(0, Math.min(GRID_W - 1, p.x + dx)),
              y: Math.max(0, Math.min(GRID_H - 1, p.y + dy)),
            }
          : p,
      ),
    );
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (['arrowup', 'w', 'ц'].includes(k)) { e.preventDefault(); move(0, -1); }
      if (['arrowdown', 's', 'ы'].includes(k)) { e.preventDefault(); move(0, 1); }
      if (['arrowleft', 'a', 'ф'].includes(k)) { e.preventDefault(); move(-1, 0); }
      if (['arrowright', 'd', 'в'].includes(k)) { e.preventDefault(); move(1, 0); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const pickOrDrop = () => {
    if (hand) {
      setFloor((prev) => [...prev, { id: Date.now(), x: me.x, y: me.y, sprite: hand, owner: username }]);
      setHand(null);
    } else {
      const under = floor.find((f) => f.x === me.x && f.y === me.y);
      if (under) {
        setHand(under.sprite);
        setFloor((prev) => prev.filter((f) => f.id !== under.id));
      }
    }
  };

  const sendMsg = () => {
    if (!chatInput.trim()) return;
    setMessages((prev) => [...prev, { id: Date.now(), name: username, text: chatInput.trim(), color: 'text-foreground' }]);
    setChatInput('');
  };

  const cell = 'min(6.5vw, 52px)';

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-4 max-w-[1200px] mx-auto w-full">
      {/* ИГРОВАЯ ЗОНА */}
      <div className="flex flex-col gap-3 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-pixel text-primary text-xs neon-glow">СЕРВЕР · ПЛОЩАДЬ</h2>
          <div className="flex items-center gap-2 font-mono text-lg text-muted-foreground">
            <Icon name="Users" size={18} className="text-primary" />
            {players.length} онлайн
          </div>
        </div>

        {/* КАРТА */}
        <div
          className="relative grid-floor bg-card border-2 border-border pixel-shadow overflow-hidden mx-auto"
          style={{
            width: `calc(${cell} * ${GRID_W})`,
            height: `calc(${cell} * ${GRID_H})`,
            backgroundSize: `${cell} ${cell}`,
          }}
        >
          {/* предметы на полу */}
          {floor.map((f) => (
            <div
              key={f.id}
              className="absolute flex items-center justify-center"
              style={{ left: `calc(${cell} * ${f.x})`, top: `calc(${cell} * ${f.y})`, width: cell, height: cell }}
              title={`предмет от ${f.owner}`}
            >
              <PixelSprite grid={f.sprite.grid} palette={f.sprite.palette} size={4} className="opacity-90" />
            </div>
          ))}

          {/* игроки */}
          {players.map((p) => (
            <div
              key={p.id}
              className="absolute flex flex-col items-center justify-center transition-all duration-150 ease-out"
              style={{ left: `calc(${cell} * ${p.x})`, top: `calc(${cell} * ${p.y})`, width: cell, height: cell, zIndex: p.me ? 20 : 10 }}
            >
              <span className={`absolute -top-1 font-mono text-[11px] leading-none px-1 whitespace-nowrap ${p.me ? 'text-primary' : 'text-muted-foreground'}`}>
                {p.name}
              </span>
              <div className={p.me ? 'animate-float-bob drop-shadow-[0_0_6px_rgba(43,220,135,0.8)]' : ''}>
                <PixelSprite grid={CHARACTERS[p.char].grid} palette={CHARACTERS[p.char].palette} size={5} />
              </div>
            </div>
          ))}

          {/* подсветка моей клетки */}
          <div
            className="absolute border-2 border-primary/60 pointer-events-none animate-flicker"
            style={{ left: `calc(${cell} * ${me.x})`, top: `calc(${cell} * ${me.y})`, width: cell, height: cell }}
          />
        </div>

        {/* УПРАВЛЕНИЕ */}
        <div className="flex items-center justify-between flex-wrap gap-3 mt-1">
          {/* D-pad */}
          <div className="grid grid-cols-3 gap-1 w-[132px] select-none">
            <span />
            <DPad onClick={() => move(0, -1)} icon="ChevronUp" />
            <span />
            <DPad onClick={() => move(-1, 0)} icon="ChevronLeft" />
            <DPad onClick={pickOrDrop} icon={hand ? 'Hand' : 'Grab'} active />
            <DPad onClick={() => move(1, 0)} icon="ChevronRight" />
            <span />
            <DPad onClick={() => move(0, 1)} icon="ChevronDown" />
            <span />
          </div>

          {/* рука / инвентарь */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1">
              <span className="font-mono text-base text-muted-foreground">В РУКЕ</span>
              <div className="w-14 h-14 border-2 border-dashed border-border bg-background flex items-center justify-center pixel-shadow">
                {hand ? (
                  <PixelSprite grid={hand.grid} palette={hand.palette} size={5} className="animate-scale-in" />
                ) : (
                  <Icon name="Hand" size={20} className="text-muted-foreground/50" />
                )}
              </div>
            </div>
            <button
              onClick={pickOrDrop}
              className="font-pixel text-[10px] bg-primary text-primary-foreground px-4 py-3 pixel-shadow hover:translate-y-[2px] hover:shadow-none transition-all"
            >
              {hand ? 'ПОЛОЖИТЬ' : 'ВЗЯТЬ'}
            </button>
          </div>
        </div>
        <p className="font-mono text-base text-muted-foreground text-center">
          WASD / стрелки — ходить · Е или кнопка — взять/положить предмет
        </p>
      </div>

      {/* БОКОВАЯ ПАНЕЛЬ */}
      <div className="flex flex-col gap-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="grid grid-cols-2 gap-2">
          <SideBtn icon="Brush" label="СОЗДАТЬ" onClick={onOpenEditor} accent />
          <SideBtn icon="Trophy" label="ТОП" onClick={onOpenLeaders} />
        </div>

        {/* ЧАТ */}
        <div className="bg-card border-2 border-border flex flex-col flex-1 min-h-[280px] pixel-shadow">
          <div className="font-pixel text-[10px] text-secondary px-3 py-2 border-b-2 border-border flex items-center gap-2">
            <Icon name="MessagesSquare" size={14} /> ОБЩИЙ ЧАТ
          </div>
          <div ref={chatRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2 max-h-[320px]">
            {messages.map((m) => (
              <div key={m.id} className="font-mono text-lg leading-tight animate-fade-in">
                <span className={`${m.color} font-bold`}>{m.name}:</span>{' '}
                <span className="text-foreground/90">{m.text}</span>
              </div>
            ))}
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

        {/* поддержка */}
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
    className={`font-pixel text-[10px] py-3 flex flex-col items-center gap-2 pixel-shadow active:translate-y-[2px] active:shadow-none transition-all ${
      accent ? 'bg-accent text-accent-foreground' : 'bg-card text-foreground border-2 border-border hover:border-primary'
    }`}
  >
    <Icon name={icon} size={20} />
    {label}
  </button>
);

export default GameScreen;
