import { useState } from 'react';
import Icon from '@/components/ui/icon';
import AuthScreen from '@/components/game/AuthScreen';
import GameScreen from '@/components/game/GameScreen';
import PixelEditor from '@/components/game/PixelEditor';
import Leaderboard from '@/components/game/Leaderboard';
import { SpriteData } from '@/components/game/sprites';

const Index = () => {
  const [user, setUser] = useState<{ name: string; char: number } | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [leadersOpen, setLeadersOpen] = useState(false);
  const [customItem, setCustomItem] = useState<SpriteData | null>(null);

  if (!user) {
    return (
      <div className="crt min-h-screen">
        <AuthScreen onEnter={(name, char) => setUser({ name, char })} />
      </div>
    );
  }

  return (
    <div className="crt min-h-screen flex flex-col">
      {/* HEADER */}
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
              onClick={() => setUser(null)}
              className="text-muted-foreground hover:text-destructive transition-colors"
              title="выйти"
            >
              <Icon name="LogOut" size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* GAME */}
      <main className="flex-1 px-4 py-5 w-full">
        <GameScreen
          username={user.name}
          charIndex={user.char}
          customItem={customItem}
          onOpenEditor={() => setEditorOpen(true)}
          onOpenLeaders={() => setLeadersOpen(true)}
        />
      </main>

      {editorOpen && (
        <PixelEditor
          onClose={() => setEditorOpen(false)}
          onSave={(s) => {
            setCustomItem(s);
            setEditorOpen(false);
          }}
        />
      )}
      {leadersOpen && <Leaderboard username={user.name} onClose={() => setLeadersOpen(false)} />}
    </div>
  );
};

export default Index;
