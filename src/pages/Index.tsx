import React, { useState, useRef, useLayoutEffect } from 'react';
import { GameProvider, useGame } from '../game/GameContext';
import { HustleScreen } from '../components/game/HustleScreen';
import { BusinessesScreen } from '../components/game/BusinessesScreen';
import { BusinessDetailScreen } from '../components/game/BusinessDetailScreen';
import { AssetsScreen } from '../components/game/AssetsScreen';
import { SocialScreen } from '../components/game/SocialScreen';
import { StatsScreen } from '../components/game/StatsScreen';
import { TopBar } from '../components/game/TopBar';
import { MarketEventBanner } from '../components/game/MarketEventBanner';
import { AddToHomeScreenModal } from '../components/game/AddToHomeScreenModal';
import { useHaptics } from '../hooks/use-haptics';
import { useSounds } from '../hooks/use-sounds';

type Screen = { type: 'hustle' } | { type: 'businesses' } | { type: 'assets' } | { type: 'social' } | { type: 'other' } | { type: 'business-detail'; bizId: string };

const TABS = [
  { key: 'hustle' as const, icon: '💰', label: 'Hustle' },
  { key: 'businesses' as const, icon: '🏢', label: 'Business' },
  { key: 'assets' as const, icon: '🏆', label: 'Assets' },
  { key: 'social' as const, icon: '👥', label: 'Social' },
  { key: 'other' as const, icon: '📊', label: 'Other' },
];

function GameInner() {
  const [screen, setScreen] = useState<Screen>({ type: 'hustle' });
  const [tab, setTab] = useState<'hustle' | 'businesses' | 'assets' | 'social' | 'other'>('hustle');
  const { light } = useHaptics();
  const { switchTab: soundSwitch } = useSounds();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const idx = TABS.findIndex(t => t.key === tab);
    const el = tabRefs.current[idx];
    if (el) {
      setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    }
  }, [tab]);

  const goToBusiness = (bizId: string) => {
    setScreen({ type: 'business-detail', bizId });
  };
  const goBack = () => {
    setScreen({ type: 'businesses' });
    setTab('businesses');
  };

  const switchTab = (t: 'hustle' | 'businesses' | 'assets' | 'social' | 'other') => {
    light();
    soundSwitch();
    setTab(t);
    setScreen({ type: t });
  };

  const tabIndex = TABS.findIndex(t => t.key === tab);

  return (
    <div className="flex flex-col h-[100dvh] max-w-[420px] mx-auto bg-background relative overflow-hidden">
      {screen.type !== 'business-detail' && (
        <div style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <TopBar />
          <MarketEventBanner />
        </div>
      )}
      <AddToHomeScreenModal />

      <div className="flex-1 overflow-hidden">
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{
            width: `${TABS.length * 100}%`,
            transform: `translateX(-${tabIndex * (100 / TABS.length)}%)`,
            display: screen.type === 'business-detail' ? 'none' : 'flex',
          }}
        >
          <div style={{ width: `${100 / TABS.length}%` }} className="h-full overflow-hidden">
            <HustleScreen />
          </div>
          <div style={{ width: `${100 / TABS.length}%` }} className="h-full overflow-hidden">
            <BusinessesScreen onManage={goToBusiness} />
          </div>
          <div style={{ width: `${100 / TABS.length}%` }} className="h-full overflow-hidden">
            <AssetsScreen />
          </div>
          <div style={{ width: `${100 / TABS.length}%` }} className="h-full overflow-hidden">
            <SocialScreen />
          </div>
          <div style={{ width: `${100 / TABS.length}%` }} className="h-full overflow-hidden">
            <StatsScreen />
          </div>
        </div>
        {screen.type === 'business-detail' && (
          <BusinessDetailScreen bizId={screen.bizId} onBack={goBack} />
        )}
      </div>

      {screen.type !== 'business-detail' && (
        <div className="relative border-t border-border bg-card" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {/* Animated indicator */}
          <div
            className="absolute top-0 h-[2px] bg-primary transition-all duration-300 ease-out"
            style={{ left: indicator.left, width: indicator.width }}
          />
          <div className="flex">
            {TABS.map((t, i) => (
              <button
                key={t.key}
                ref={el => { tabRefs.current[i] = el; }}
                onClick={() => switchTab(t.key)}
                className={`flex-1 py-3 text-center text-sm font-semibold transition-all duration-200 ${
                  tab === t.key
                    ? 'text-primary scale-105'
                    : 'text-muted-foreground scale-100'
                }`}
              >
                <span className={`text-lg block transition-transform duration-200 ${tab === t.key ? 'scale-110' : ''}`}>
                  {t.icon}
                </span>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Index() {
  return (
    <GameProvider>
      <GameInner />
    </GameProvider>
  );
}
