import { useState } from 'react';
import Icon from '@/components/ui/icon';
import AuthScreen, { Profile } from '@/components/game/AuthScreen';
import GameScreen from '@/components/game/GameScreen';
import PixelEditor from '@/components/game/PixelEditor';
import Leaderboard from '@/components/game/Leaderboard';
import ClansScreen, { Clan } from '@/components/game/ClansScreen';
import { SpriteData, GameItem } from '@/components/game/sprites';
import { clearToken } from '@/components/game/api';

const Index = () => {
  const [user, setUser] = useState<Profile | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [leadersOpen, setLeadersOpen] = useState(false);
  const [clansOpen, setClansOpen] = useState(false);

  const [newItem, setNewItem] = useState<GameItem | null>(null);
  const [myClan, setMyClan] = useState<Clan | null>(null);

  const [editTarget, setEditTarget] = useState<{ item: GameItem; apply: (s: SpriteData) => void } | null>(null);

  const openEditItem = (item: GameItem, apply: (s: SpriteData) => void) => {
    setEditTarget({ item, apply });
    setEditorOpen(true);
  };

  const handleSave = (sprite: SpriteData) => {
    if (editTarget) {
      editTarget.apply(sprite);
      setEditTarget(null);
    } else if (user) {
      setNewItem({ id: Date.now(), sprite, creator: user.name, editors: [], solid: false });
    }
    setEditorOpen(false);
  };

  const logout = () => {
    clearToken();
    setUser(null);
    setMyClan(null);
  };

  if (!user) {
    return (
      <div className="crt min-h-screen">
        <AuthScreen
          onEnter={(p) => { setUser(p); setMyClan(p.clan); }}
        />
      </div>
    );
  }

  return (
    <div className="crt min-h-screen flex flex-col">
      <header className="border-b-2 border-border bg-card/60 backdrop-blur-sm">
        <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-pixel text-[11px] text-primary neon-glow flex items-center gap-2">
            <Icon name="Gamepad2" size={18} /> PIXEL WORLD
          </h1>
          <div className="flex items-center gap-3">
            <span className="font-mono text-lg text-muted-foreground hidden sm:flex items-center gap-1">
              <Icon name="Wifi" size={16} className="text-primary animate-flicker" /> онлайн
            </span>
            <span className="font-mono text-xl text-foreground flex items-center gap-2">
              <Icon name="User" size={16} className="text-primary" /> {user.name}
            </span>
            <button
              onClick={logout}
              className="text-muted-foreground hover:text-destructive transition-colors"
              title="выйти"
            >
              <Icon name="LogOut" size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-5 w-full">
        <GameScreen
          username={user.name}
          charIndex={user.char}
          startX={user.x}
          startY={user.y}
          newItem={newItem}
          onConsumeNewItem={() => setNewItem(null)}
          myClan={myClan}
          onOpenEditor={() => { setEditTarget(null); setEditorOpen(true); }}
          onOpenLeaders={() => setLeadersOpen(true)}
          onOpenClans={() => setClansOpen(true)}
          onEditItem={openEditItem}
        />
      </main>

      {editorOpen && (
        <PixelEditor
          initial={editTarget?.item.sprite}
          onClose={() => { setEditorOpen(false); setEditTarget(null); }}
          onSave={handleSave}
        />
      )}
      {leadersOpen && <Leaderboard username={user.name} onClose={() => setLeadersOpen(false)} />}
      {clansOpen && (
        <ClansScreen
          myClan={myClan}
          onClanChange={setMyClan}
          onClose={() => setClansOpen(false)}
        />
      )}
    </div>
  );
};

export default Index;
