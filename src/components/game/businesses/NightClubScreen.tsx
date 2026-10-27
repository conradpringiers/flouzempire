import React, { useState } from 'react';
import { useGame, formatCash } from '../../../game/GameContext';
import { BusinessInstance, NIGHTCLUB_DJ_POOL } from '../../../game/GameState';
import { useHaptics } from '../../../hooks/use-haptics';
import { useSounds } from '../../../hooks/use-sounds';

interface Props { biz: BusinessInstance; }

const NC_UPGRADE_INFO = [
  { key: 'soundSystem', name: '🔊 Sound System', desc: '+20% event quality', cost: 50000 },
  { key: 'lighting', name: '💡 LED Lighting', desc: '+15% event quality', cost: 40000 },
  { key: 'smokeMachine', name: '💨 Smoke Machine', desc: '+10% event quality', cost: 25000 },
  { key: 'rooftop', name: '🌙 Rooftop Terrace', desc: '+30% capacity', cost: 120000 },
];

export function NightClubScreen({ biz }: Props) {
  const { state, dispatch } = useGame();
  const { tap } = useHaptics();
  const { coin } = useSounds();
  const nc = biz.nightClubState!;
  const [drinkQty, setDrinkQty] = useState(50);

  const quality = calcQuality(nc);
  const capMult = nc.upgrades.rooftop ? 1.3 : 1;
  const effectiveCap = Math.round(nc.capacity * capMult);
  const occupancy = Math.min(0.95, quality * 0.01 * Math.max(0.2, 2 - nc.entryFee / 30));
  const nightly = effectiveCap * occupancy;
  const entryRev = nightly * nc.entryFee;
  const drinkRev = Math.min(nightly * 2, nc.drinkStock) * nc.drinkPrice;
  const djCost = nc.djs.reduce((s, d) => s + d.salary, 0);
  const bartenderCost = nc.bartenders * nc.bartenderSalary;
  const hourlyRev = (entryRev + drinkRev) / 6; // 6h night
  const hourlyCost = djCost + bartenderCost;

  return (
    <div className="p-4 space-y-4">
      {/* Overview */}
      <div className="game-card p-3" style={{ background: 'linear-gradient(135deg, hsl(270 80% 55% / 0.1), hsl(310 80% 55% / 0.03))' }}>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-[10px] text-muted-foreground">Quality</div>
            <div className="text-lg font-bold">{quality}%</div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground">Nightly Rev</div>
            <div className="text-lg font-bold text-gain">{formatCash(entryRev + drinkRev)}</div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground">Occupancy</div>
            <div className="text-lg font-bold">{Math.round(occupancy * 100)}%</div>
          </div>
        </div>
        <div className="text-[10px] text-muted-foreground text-center mt-1">
          Capacity: {effectiveCap} • Avg/night: {Math.round(nightly)} visitors
        </div>
      </div>

      {/* Entry Fee */}
      <div className="game-card p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold">🎫 Entry Fee</span>
          <span className="text-sm font-bold">{formatCash(nc.entryFee)}</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => dispatch({ type: 'NIGHTCLUB_SET_ENTRY', bizId: biz.id, price: Math.max(5, nc.entryFee - 5) })}
            className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground font-bold">−</button>
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${Math.min(100, nc.entryFee / 100 * 100)}%` }} />
          </div>
          <button onClick={() => dispatch({ type: 'NIGHTCLUB_SET_ENTRY', bizId: biz.id, price: Math.min(100, nc.entryFee + 5) })}
            className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground font-bold">+</button>
        </div>
        <div className="text-[10px] text-muted-foreground text-center mt-1">Higher = more revenue but lower occupancy</div>
      </div>

      {/* DJs */}
      <div className="game-card p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold">🎧 DJs ({nc.djs.length}/5)</span>
          <span className="text-xs text-muted-foreground">{formatCash(djCost)}/h total</span>
        </div>
        {nc.djs.map(dj => (
          <div key={dj.id} className="flex items-center gap-2 mb-1 p-1.5 bg-secondary/50 rounded-lg">
            <span className="text-lg">🎧</span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate">{dj.name}</div>
              <div className="text-[10px] text-muted-foreground">Quality: {dj.quality}/10 • {formatCash(dj.salary)}/h</div>
            </div>
            <button onClick={() => { dispatch({ type: 'NIGHTCLUB_FIRE_DJ', bizId: biz.id, djId: dj.id }); tap(); }}
              className="text-[10px] text-loss underline">Fire</button>
          </div>
        ))}
        {nc.djs.length < 5 && (
          <button onClick={() => { dispatch({ type: 'NIGHTCLUB_HIRE_DJ', bizId: biz.id }); tap(); coin(); }}
            disabled={state.cash < 5000}
            className={`w-full py-2 rounded-lg text-xs font-semibold mt-2 transition-all active:scale-95 ${
              state.cash >= 5000 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
            Hire DJ — {formatCash(5000)}
          </button>
        )}
      </div>

      {/* Bar */}
      <div className="game-card p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold">🍹 Bar</span>
          <span className="text-xs text-muted-foreground">
            {nc.bartenders} bartender{nc.bartenders !== 1 ? 's' : ''} • Stock: {Math.floor(nc.drinkStock)}
          </span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs">Drink price:</span>
          <button onClick={() => dispatch({ type: 'NIGHTCLUB_SET_DRINK_PRICE', bizId: biz.id, price: Math.max(3, nc.drinkPrice - 2) })}
            className="w-6 h-6 rounded-full bg-secondary text-secondary-foreground text-xs font-bold">−</button>
          <span className="text-sm font-bold flex-1 text-center">{formatCash(nc.drinkPrice)}</span>
          <button onClick={() => dispatch({ type: 'NIGHTCLUB_SET_DRINK_PRICE', bizId: biz.id, price: nc.drinkPrice + 2 })}
            className="w-6 h-6 rounded-full bg-secondary text-secondary-foreground text-xs font-bold">+</button>
        </div>
        <div className="flex gap-2 mb-2">
          <button onClick={() => { dispatch({ type: 'NIGHTCLUB_RESTOCK', bizId: biz.id, qty: drinkQty }); tap(); }}
            disabled={state.cash < drinkQty * 3}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
              state.cash >= drinkQty * 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
            Restock +{drinkQty} — {formatCash(drinkQty * 3)}
          </button>
          <button onClick={() => { dispatch({ type: 'NIGHTCLUB_HIRE_BARTENDER', bizId: biz.id }); tap(); }}
            disabled={nc.bartenders >= 6}
            className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
              nc.bartenders < 6 ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
            +👨‍🍳
          </button>
        </div>
      </div>

      {/* Upgrades */}
      <div className="game-card p-3">
        <div className="text-sm font-semibold mb-2">⬆️ Upgrades</div>
        <div className="space-y-2">
          {NC_UPGRADE_INFO.map(u => {
            const bought = (nc.upgrades as any)[u.key];
            const canAfford = state.cash >= u.cost;
            return (
              <div key={u.key} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold">{u.name}</div>
                  <div className="text-[10px] text-muted-foreground">{u.desc}</div>
                </div>
                {bought ? (
                  <span className="text-xs text-gain font-semibold">✓</span>
                ) : (
                  <button onClick={() => { dispatch({ type: 'NIGHTCLUB_UPGRADE', bizId: biz.id, upgrade: u.key }); tap(); }}
                    disabled={!canAfford}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                      canAfford ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                    {formatCash(u.cost)}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function calcQuality(nc: { djs: { quality: number }[]; upgrades: { soundSystem: boolean; lighting: boolean; smokeMachine: boolean } }): number {
  let q = 30;
  const avgDJ = nc.djs.length > 0 ? nc.djs.reduce((s, d) => s + d.quality, 0) / nc.djs.length : 0;
  q += avgDJ * 4;
  if (nc.upgrades.soundSystem) q += 20;
  if (nc.upgrades.lighting) q += 15;
  if (nc.upgrades.smokeMachine) q += 10;
  return Math.min(100, Math.round(q));
}
