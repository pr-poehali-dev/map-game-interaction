import { useState } from 'react';
import Icon from '@/components/ui/icon';
import PixelSprite from './PixelSprite';
import { CHARACTERS } from './sprites';

const AuthScreen = ({ onEnter }: { onEnter: (name: string, char: number) => void }) => {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [name, setName] = useState('');
  const [char, setChar] = useState(Math.floor(Math.random() * CHARACTERS.length));

  const enter = () => onEnter(name.trim() || 'Игрок_' + Math.floor(Math.random() * 999), char);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-scale-in">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="font-pixel text-2xl text-primary neon-glow leading-relaxed">PIXEL<br />WORLD</h1>
          <p className="font-mono text-xl text-muted-foreground mt-2">ретро-мультиплеер · онлайн-карта</p>
        </div>

        <div className="bg-card border-2 border-border pixel-shadow p-6 space-y-5">
          {/* выбор персонажа */}
          <div>
            <p className="font-mono text-base text-muted-foreground mb-2 text-center">ТВОЙ ПЕРСОНАЖ (СЛУЧАЙНЫЙ)</p>
            <div className="flex justify-center gap-3">
              {CHARACTERS.map((c, i) => (
                <button
                  key={i}
                  onClick={() => setChar(i)}
                  className={`p-2 border-2 transition-all ${char === i ? 'border-primary scale-110 bg-background' : 'border-border opacity-60 hover:opacity-100'}`}
                >
                  <PixelSprite grid={c.grid} palette={c.palette} size={5} />
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center border-2 border-border bg-background">
            <span className="px-3 text-muted-foreground"><Icon name="User" size={18} /></span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && enter()}
              placeholder="никнейм"
              className="flex-1 bg-transparent py-3 font-mono text-xl outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex items-center border-2 border-border bg-background">
            <span className="px-3 text-muted-foreground"><Icon name="Lock" size={18} /></span>
            <input
              type="password"
              placeholder="пароль"
              className="flex-1 bg-transparent py-3 font-mono text-xl outline-none placeholder:text-muted-foreground"
            />
          </div>

          <button
            onClick={enter}
            className="w-full font-pixel text-[11px] bg-primary text-primary-foreground py-4 pixel-shadow active:translate-y-[2px] active:shadow-none transition-all"
          >
            {mode === 'register' ? 'НАЧАТЬ ИГРУ' : 'ВОЙТИ'}
          </button>

          <button
            onClick={() => setMode((m) => (m === 'login' ? 'register' : 'login'))}
            className="w-full font-mono text-lg text-muted-foreground hover:text-primary transition-colors"
          >
            {mode === 'register' ? 'уже есть аккаунт? войти' : 'нет аккаунта? регистрация'}
          </button>
        </div>

        <p className="font-mono text-base text-center text-muted-foreground mt-4 animate-flicker">
          ▸ press start to enter the world ◂
        </p>
      </div>
    </div>
  );
};

export default AuthScreen;
