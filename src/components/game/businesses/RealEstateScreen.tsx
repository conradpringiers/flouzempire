import React, { useState, useRef, useLayoutEffect } from 'react';
import { useGame, formatCash } from '../../../game/GameContext';
import { BusinessInstance, Property, getPropertyImage, formatDuration } from '../../../game/GameState';
import { useHaptics } from '../../../hooks/use-haptics';
import { useSounds } from '../../../hooks/use-sounds';

const RE_TABS = ['portfolio', 'market'] as const;
type RETab = typeof RE_TABS[number];

function useCountdown(targetMs?: number) {
  const [now, setNow] = useState(Date.now());
  React.useEffect(() => {
    if (!targetMs) return;
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, [targetMs]);
  if (!targetMs) return null;
  const remaining = Math.max(0, targetMs - now);
  if (remaining <= 0) return null;
  return formatDuration(remaining);
}

export function RealEstateScreen({ biz }: { biz: BusinessInstance }) {
  const { state, dispatch } = useGame();
  const rs = biz.realEstateState!;
  const [tab, setTab] = useState<RETab>('portfolio');
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const { light, tap } = useHaptics();
  const { switchTab: soundSwitch } = useSounds();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const idx = RE_TABS.indexOf(tab);
    const el = tabRefs.current[idx];
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [tab]);

  const accent = 'hsl(142 71% 45%)';
  const selectedProp = selectedProperty ? rs.properties.find(p => p.id === selectedProperty) : null;

  // Full-page property detail view
  if (selectedProp) {
    return (
      <div className="flex flex-col h-full" style={{ backgroundColor: 'hsl(142 71% 45% / 0.04)' }}>
        {/* Property Image Header */}
        <div className="relative h-48 overflow-hidden">
          <img src={getPropertyImage(selectedProp.imageStyle)} alt={selectedProp.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute top-3 left-3">
            <button onClick={() => setSelectedProperty(null)} className="w-8 h-8 rounded-full bg-black/30 backdrop-blur text-white flex items-center justify-center">←</button>
          </div>
          <div className="absolute bottom-3 left-4 right-4">
            <div className="text-white font-bold text-lg drop-shadow">{selectedProp.street}</div>
            <div className="text-white/80 text-sm drop-shadow">📍 {selectedProp.city} · {selectedProp.type}</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Value Info */}
          <div className="grid grid-cols-2 gap-2">
            <div className="game-card text-center">
              <div className="text-xs text-muted-foreground">💎 Value</div>
              <div className="font-bold text-sm">{formatCash(selectedProp.currentValue)}</div>
            </div>
            <div className="game-card text-center">
              <div className="text-xs text-muted-foreground">📈 P&L</div>
              <div className={`font-bold text-sm ${selectedProp.currentValue - selectedProp.purchasePrice >= 0 ? 'text-gain' : 'text-loss'}`}>
                {selectedProp.currentValue - selectedProp.purchasePrice >= 0 ? '+' : ''}
                {formatCash(selectedProp.currentValue - selectedProp.purchasePrice)}
              </div>
            </div>
          </div>

          {selectedProp.status === 'rented' && (
            <div className="game-card text-center" style={{ background: 'hsl(142 71% 45% / 0.08)' }}>
              <div className="text-xs text-muted-foreground">💰 Rental Income</div>
              <div className="font-bold text-gain">{formatCash(selectedProp.rentalIncome)}/h</div>
            </div>
          )}

          {/* Upgrades */}
          <div className="text-sm font-semibold">🔧 Upgrades</div>
          <div className="space-y-2">
            {selectedProp.upgrades.map(u => (
              <UpgradeRow key={u.id} upgrade={u} bizId={biz.id} propertyId={selectedProp.id} />
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 pb-4">
            {selectedProp.status === 'vacant' && (
              <button
                onClick={() => { dispatch({ type: 'RE_RENT', bizId: biz.id, propertyId: selectedProp.id }); tap(); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white active:scale-95 transition-transform"
                style={{ backgroundColor: accent }}>
                🔑 Rent Out
              </button>
            )}
            {selectedProp.status === 'rented' && (
              <button
                onClick={() => { dispatch({ type: 'RE_UNRENT', bizId: biz.id, propertyId: selectedProp.id }); tap(); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-secondary text-secondary-foreground active:scale-95 transition-transform">
                ⏸ Stop Renting
              </button>
            )}
            <button
              onClick={() => { dispatch({ type: 'RE_SELL', bizId: biz.id, propertyId: selectedProp.id }); setSelectedProperty(null); tap(); }}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-destructive text-destructive-foreground active:scale-95 transition-transform">
              💸 Sell ({formatCash(Math.floor(selectedProp.currentValue * 0.95))})
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'hsl(142 71% 45% / 0.04)' }}>
      {/* Tab Bar */}
      <div className="relative flex border-b border-border bg-card">
        {RE_TABS.map((t, i) => (
          <button key={t}
            ref={el => { tabRefs.current[i] = el; }}
            onClick={() => { light(); soundSwitch(); setTab(t); }}
            className="flex-1 py-2.5 text-xs font-semibold capitalize transition-colors duration-200"
            style={{ color: tab === t ? accent : 'hsl(var(--muted-foreground))' }}>
            {t === 'portfolio' ? '🏘️ Portfolio' : '🏪 Market'}
          </button>
        ))}
        <div className="absolute bottom-0 h-[2px] transition-all duration-300 ease-out"
          style={{ left: indicator.left, width: indicator.width, backgroundColor: accent }} />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 tab-content-enter" key={tab}>
        {/* ===== PORTFOLIO TAB ===== */}
        {tab === 'portfolio' && (
          <>
            {rs.properties.length === 0 && (
              <div className="text-center text-muted-foreground mt-8">
                <div className="text-4xl mb-2">🏠</div>
                <div className="text-sm">No properties yet</div>
                <div className="text-xs mt-1">Browse the market to buy one!</div>
              </div>
            )}

            {/* Summary */}
            {rs.properties.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                <div className="game-card text-center">
                  <div className="text-xs text-muted-foreground">📊 Total Value</div>
                  <div className="font-bold text-sm" style={{ color: accent }}>
                    {formatCash(rs.properties.reduce((s, p) => s + p.currentValue, 0))}
                  </div>
                </div>
                <div className="game-card text-center">
                  <div className="text-xs text-muted-foreground">💰 Income/h</div>
                  <div className="font-bold text-sm text-gain">
                    {formatCash(rs.properties.filter(p => p.status === 'rented').reduce((s, p) => s + p.rentalIncome, 0))}/h
                  </div>
                </div>
              </div>
            )}

            {rs.properties.map(p => {
              const pnl = p.currentValue - p.purchasePrice;
              const installedCount = p.upgrades.filter(u => u.installed).length;
              return (
                <div key={p.id} className="game-card overflow-hidden" onClick={() => setSelectedProperty(p.id)}>
                  {/* Image */}
                  <div className="relative h-24 -mx-3 -mt-3 mb-2 overflow-hidden rounded-t-xl">
                    <img src={getPropertyImage(p.imageStyle)} alt={p.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-2 left-3 right-3 flex justify-between items-end">
                      <div>
                        <div className="text-white font-semibold text-sm drop-shadow">{p.street}</div>
                        <div className="text-white/80 text-xs drop-shadow">{p.city}</div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full backdrop-blur ${
                        p.status === 'rented' ? 'bg-green-500/30 text-green-200' :
                        'bg-white/20 text-white'
                      }`}>{p.status === 'rented' ? '🔑 Rented' : 'Vacant'}</span>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground mb-1">{p.type}</div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Value: <strong>{formatCash(p.currentValue)}</strong></span>
                    <span className={pnl >= 0 ? 'text-gain' : 'text-loss'}>{pnl >= 0 ? '+' : ''}{formatCash(pnl)}</span>
                  </div>
                  {p.status === 'rented' && (
                    <div className="text-xs text-gain mb-1">💰 {formatCash(p.rentalIncome)}/h</div>
                  )}
                  {installedCount > 0 && (
                    <div className="flex gap-1 mb-1">
                      {p.upgrades.filter(u => u.installed).map(u => (
                        <span key={u.id} className="text-xs">{u.icon}</span>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-primary font-medium mt-1">Tap for details →</div>
                </div>
              );
            })}
          </>
        )}

        {/* ===== MARKET TAB ===== */}
        {tab === 'market' && (
          <>
            <div className="text-xs text-muted-foreground mb-1">🏘️ Properties available in Morocco</div>
            {rs.marketListings.map(p => (
              <div key={p.id} className="game-card overflow-hidden">
                {/* Image */}
                <div className="relative h-28 -mx-3 -mt-3 mb-2 overflow-hidden rounded-t-xl">
                  <img src={getPropertyImage(p.imageStyle)} alt={p.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-2 right-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-black/40 text-white backdrop-blur font-semibold">
                      {formatCash(p.purchasePrice)}
                    </span>
                  </div>
                  <div className="absolute bottom-2 left-3">
                    <div className="text-white font-semibold text-sm drop-shadow">{p.street}</div>
                    <div className="text-white/80 text-xs drop-shadow">📍 {p.city} · {p.type}</div>
                  </div>
                </div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-muted-foreground">Est. rent: <strong className="text-gain">{formatCash(p.rentalIncome)}/h</strong></span>
                </div>
                <button
                  onClick={() => { dispatch({ type: 'RE_BUY_PROPERTY', bizId: biz.id, propertyId: p.id }); tap(); }}
                  disabled={state.cash < p.purchasePrice}
                  className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-transform active:scale-95 ${
                    state.cash >= p.purchasePrice ? 'text-white' : 'bg-muted text-muted-foreground'
                  }`}
                  style={state.cash >= p.purchasePrice ? { backgroundColor: accent } : undefined}
                >
                  Buy — {formatCash(p.purchasePrice)}
                </button>
              </div>
            ))}
            {rs.marketListings.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <div className="text-3xl mb-2">🏗️</div>
                <div className="text-sm">No more properties available</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function UpgradeRow({ upgrade, bizId, propertyId }: { upgrade: Property['upgrades'][0]; bizId: string; propertyId: string }) {
  const { state, dispatch } = useGame();
  const { light } = useHaptics();
  const countdown = useCountdown(upgrade.installReadyAt);

  if (upgrade.installed) {
    return (
      <div className="flex items-center gap-3 p-2.5 rounded-xl bg-primary/5 border border-primary/10">
        <span className="text-lg">{upgrade.icon}</span>
        <div className="flex-1">
          <div className="text-sm font-medium">{upgrade.name}</div>
          <div className="text-xs text-gain">✅ Installed</div>
        </div>
      </div>
    );
  }

  if (upgrade.installing && countdown) {
    return (
      <div className="flex items-center gap-3 p-2.5 rounded-xl bg-warning/5 border border-warning/10">
        <span className="text-lg">{upgrade.icon}</span>
        <div className="flex-1">
          <div className="text-sm font-medium">{upgrade.name}</div>
          <div className="text-xs text-warn">⏳ Installing... {countdown}</div>
        </div>
      </div>
    );
  }

  const canAfford = state.cash >= upgrade.cost;

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30">
      <span className="text-lg">{upgrade.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{upgrade.name}</div>
        <div className="text-xs text-muted-foreground">+{upgrade.valueBoost}% value · +{upgrade.rentBoost}% rent</div>
      </div>
      <button
        onClick={() => { dispatch({ type: 'RE_UPGRADE_PROPERTY', bizId, propertyId, upgradeId: upgrade.id }); light(); }}
        disabled={!canAfford}
        className={`text-xs py-1.5 px-3 rounded-lg font-semibold whitespace-nowrap ${
          canAfford ? 'bg-primary text-primary-foreground active:scale-95' : 'bg-muted text-muted-foreground'
        }`}>
        {formatCash(upgrade.cost)}
      </button>
    </div>
  );
}
