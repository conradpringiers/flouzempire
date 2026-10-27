import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useGame, formatCash } from '../../game/GameContext';
import { TAP_UPGRADE_COSTS, TAP_POWERS } from '../../game/GameState';
import { useHaptics } from '../../hooks/use-haptics';
import { useSounds } from '../../hooks/use-sounds';

interface FloatingText {
  id: number; x: number; y: number; amount: number;
}

interface Particle {
  id: number; x: number; y: number; dx: number; size: number; emoji: string;
}

const PARTICLE_EMOJIS = ['💵', '💰', '🪙', '✨', '💲'];

export function HustleScreen() {
  const { state, dispatch } = useGame();
  const [floats, setFloats] = useState<FloatingText[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const counter = useRef(0);
  const { tap: hapticTap } = useHaptics();
  const { tap: soundTap, coin, click: soundClick, success: soundSuccess } = useSounds();

  const handleTap = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    dispatch({ type: 'TAP' });
    hapticTap();
    soundTap();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    let x: number, y: number;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    const id = counter.current++;
    setFloats(prev => [...prev.slice(-8), { id, x: x + (Math.random() - 0.5) * 40, y, amount: state.tapPower }]);
    setTimeout(() => setFloats(prev => prev.filter(f => f.id !== id)), 800);

    // Spawn 3-5 particles
    const numParticles = 3 + Math.floor(Math.random() * 3);
    const newParticles: Particle[] = [];
    for (let i = 0; i < numParticles; i++) {
      newParticles.push({
        id: counter.current++,
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        dx: (Math.random() - 0.5) * 120,
        size: 12 + Math.random() * 8,
        emoji: PARTICLE_EMOJIS[Math.floor(Math.random() * PARTICLE_EMOJIS.length)],
      });
    }
    setParticles(prev => [...prev.slice(-20), ...newParticles]);
    setTimeout(() => {
      const ids = new Set(newParticles.map(p => p.id));
      setParticles(prev => prev.filter(p => !ids.has(p.id)));
    }, 1500);
  }, [dispatch, state.tapPower, hapticTap]);

  const nextUpgradeCost = state.tapUpgradeLevel + 1 < TAP_UPGRADE_COSTS.length
    ? TAP_UPGRADE_COSTS[state.tapUpgradeLevel + 1] : null;
  const canUpgrade = nextUpgradeCost !== null && state.cash >= nextUpgradeCost;
  const nextTapPower = state.tapUpgradeLevel + 1 < TAP_POWERS.length ? TAP_POWERS[state.tapUpgradeLevel + 1] : state.tapPower;

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* Stats */}
      <div className="px-4 pt-4 space-y-1">
        <div className="game-card flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">Tap Power</div>
            <div className="counter-medium text-gain">{formatCash(state.tapPower)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Level {state.tapUpgradeLevel}</div>
          </div>
        </div>
      </div>

      {/* Tap Area */}
      <div className="flex-1 flex items-center justify-center relative" onTouchStart={handleTap} onMouseDown={handleTap}>
        {floats.map(f => (
          <span key={f.id} className="floating-text" style={{ left: f.x, top: f.y }}>
            +{formatCash(f.amount)}
          </span>
        ))}
        {particles.map(p => (
          <span
            key={p.id}
            className="cash-particle absolute pointer-events-none"
            style={{
              left: p.x,
              top: p.y,
              fontSize: p.size,
              '--dx': `${p.dx}px`,
            } as React.CSSProperties}
          >
            {p.emoji}
          </span>
        ))}
        <div className="tap-area w-56 h-56 rounded-3xl bg-card border-2 border-dashed border-primary/30 flex flex-col items-center justify-center gap-2 active:scale-95 active:bg-primary/5 transition-all duration-75 select-none cursor-pointer">
          <span className="text-3xl opacity-60">👆</span>
          <span className="text-sm font-semibold text-muted-foreground">Tap to earn</span>
          <span className="text-lg font-bold text-gain">{formatCash(state.tapPower)}/tap</span>
        </div>
      </div>

      {/* Upgrade Button */}
      <div className="px-4 pb-6">
        {nextUpgradeCost !== null ? (
          <button
            onClick={() => { dispatch({ type: 'UPGRADE_TAP' }); soundSuccess(); }}
            disabled={!canUpgrade}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
              canUpgrade
                ? 'bg-primary text-primary-foreground active:scale-95'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            Upgrade Tap → {formatCash(nextTapPower)}/tap — {formatCash(nextUpgradeCost)}
          </button>
        ) : (
          <div className="text-center text-muted-foreground text-sm">Max level reached!</div>
        )}
      </div>
    </div>
  );
}
