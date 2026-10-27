import React from 'react';
import { useGame, formatCash } from '../../../game/GameContext';
import { BusinessInstance, CASINO_TABLE_TYPES } from '../../../game/GameState';
import { useHaptics } from '../../../hooks/use-haptics';
import { useSounds } from '../../../hooks/use-sounds';

interface Props { biz: BusinessInstance; }

const CASINO_UPGRADE_INFO = [
  { key: 'security', name: '📷 Security System', desc: '+15% occupancy', cost: 80000 },
  { key: 'vipLounge', name: '🥂 VIP Lounge', desc: '+25% revenue from all tables', cost: 150000 },
  { key: 'freeBar', name: '🍸 Free Drinks Bar', desc: '+10% occupancy', cost: 60000 },
  { key: 'loyalty', name: '💳 Loyalty Program', desc: '+20% occupancy', cost: 100000 },
];

export function CasinoScreen({ biz }: Props) {
  const { state, dispatch } = useGame();
  const { tap } = useHaptics();
  const { coin } = useSounds();
  const cs = biz.casinoState!;

  const occupancy = calcOccupancy(cs);
  const dealerTables = cs.tables.filter(t => {
    const info = CASINO_TABLE_TYPES.find(ct => ct.type === t.type);
    return info?.needsDealer;
  }).reduce((s, t) => s + t.count, 0);
  const dealerRatio = dealerTables > 0 ? Math.min(1, cs.dealers / dealerTables) : 1;
  const vipMult = cs.upgrades.vipLounge ? 1.25 : 1;

  const hourlyRev = cs.tables.reduce((sum, t) => {
    const info = CASINO_TABLE_TYPES.find(ct => ct.type === t.type)!;
    const eff = info.needsDealer ? dealerRatio : 1;
    return sum + t.count * info.revenuePerH * occupancy * eff * vipMult;
  }, 0);
  const hourlyCost = cs.dealers * cs.dealerSalary;

  return (
    <div className="p-4 space-y-4">
      {/* Overview */}
      <div className="game-card p-3" style={{ background: 'linear-gradient(135deg, hsl(280 70% 50% / 0.1), hsl(280 70% 50% / 0.03))' }}>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-[10px] text-muted-foreground">Occupancy</div>
            <div className="text-lg font-bold">{Math.round(occupancy * 100)}%</div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground">Revenue/h</div>
            <div className="text-lg font-bold text-gain">{formatCash(hourlyRev)}</div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground">Profit/h</div>
            <div className={`text-lg font-bold ${hourlyRev - hourlyCost >= 0 ? 'text-gain' : 'text-loss'}`}>
              {formatCash(hourlyRev - hourlyCost)}
            </div>
          </div>
        </div>
      </div>

      {/* Gaming Tables */}
      <div className="game-card p-3">
        <div className="text-sm font-semibold mb-2">🎰 Gaming Tables</div>
        <div className="space-y-2">
          {CASINO_TABLE_TYPES.map(ct => {
            const owned = cs.tables.find(t => t.type === ct.type);
            const count = owned?.count || 0;
            const canBuy = state.cash >= ct.cost;
            return (
              <div key={ct.type} className="flex items-center gap-2">
                <span className="text-xl w-8 text-center">{ct.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold">{ct.name} <span className="text-muted-foreground">×{count}</span></div>
                  <div className="text-[10px] text-muted-foreground">{formatCash(ct.revenuePerH)}/h each{ct.needsDealer ? ' • needs dealer' : ''}</div>
                </div>
                <button onClick={() => { dispatch({ type: 'CASINO_BUY_TABLE', bizId: biz.id, tableType: ct.type }); tap(); coin(); }}
                  disabled={!canBuy}
                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                    canBuy ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                  {formatCash(ct.cost)}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dealers */}
      <div className="game-card p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold">🤵 Dealers ({cs.dealers}/{cs.maxDealers})</span>
          <span className="text-xs text-muted-foreground">{formatCash(cs.dealerSalary)}/h each</span>
        </div>
        {dealerTables > 0 && (
          <div className="text-[10px] text-muted-foreground mb-2">
            Coverage: {Math.round(dealerRatio * 100)}% ({cs.dealers}/{dealerTables} tables)
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={() => { dispatch({ type: 'CASINO_HIRE_DEALER', bizId: biz.id }); tap(); }}
            disabled={cs.dealers >= cs.maxDealers}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
              cs.dealers < cs.maxDealers ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
            + Hire Dealer
          </button>
          <button onClick={() => { dispatch({ type: 'CASINO_FIRE_DEALER', bizId: biz.id }); tap(); }}
            disabled={cs.dealers <= 0}
            className={`py-2 px-4 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
              cs.dealers > 0 ? 'bg-destructive/20 text-destructive' : 'bg-muted text-muted-foreground'
            }`}>
            Fire
          </button>
        </div>
      </div>

      {/* Upgrades */}
      <div className="game-card p-3">
        <div className="text-sm font-semibold mb-2">⬆️ Upgrades</div>
        <div className="space-y-2">
          {CASINO_UPGRADE_INFO.map(u => {
            const bought = (cs.upgrades as any)[u.key];
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
                  <button onClick={() => { dispatch({ type: 'CASINO_UPGRADE', bizId: biz.id, upgrade: u.key }); tap(); }}
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

      {/* Stats */}
      <div className="game-card p-3">
        <div className="text-sm font-semibold mb-2">📊 Stats</div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between"><span className="text-muted-foreground">Total Revenue</span><span className="font-semibold text-gain">{formatCash(cs.totalRevenue)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Total Tables</span><span className="font-semibold">{cs.tables.reduce((s, t) => s + t.count, 0)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Dealer Coverage</span><span className="font-semibold">{Math.round(dealerRatio * 100)}%</span></div>
        </div>
      </div>
    </div>
  );
}

function calcOccupancy(cs: { upgrades: { security: boolean; freeBar: boolean; loyalty: boolean } }): number {
  let occ = 0.5;
  if (cs.upgrades.security) occ += 0.15;
  if (cs.upgrades.freeBar) occ += 0.10;
  if (cs.upgrades.loyalty) occ += 0.20;
  return Math.min(0.95, occ);
}
