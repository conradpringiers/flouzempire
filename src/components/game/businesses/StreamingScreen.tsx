import React, { useState, useRef, useLayoutEffect } from 'react';
import { useGame, formatCash } from '../../../game/GameContext';
import { BusinessInstance } from '../../../game/GameState';
import { useHaptics } from '../../../hooks/use-haptics';
import { useSounds } from '../../../hooks/use-sounds';

const TABS = ['catalog', 'store', 'upgrades'] as const;
type Tab = typeof TABS[number];

export function StreamingScreen({ biz }: { biz: BusinessInstance }) {
  const { state, dispatch } = useGame();
  const ss = biz.streamingState!;
  const [tab, setTab] = useState<Tab>('catalog');
  const { light, tap } = useHaptics();
  const { switchTab: soundSwitch } = useSounds();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const idx = TABS.indexOf(tab);
    const el = tabRefs.current[idx];
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [tab]);

  const accent = 'hsl(340 80% 55%)';
  const catIcon = ss.category === 'music' ? '🎵' : ss.category === 'gaming' ? '🎮' : '🎬';
  const catLabel = ss.category === 'music' ? 'Music' : ss.category === 'gaming' ? 'Gaming' : 'Films';

  const catalogPop = ss.catalog.reduce((s, c) => s + c.popularity, 0);
  const priceFactor = Math.max(0.1, 1 - ss.subscriptionPrice / 30);
  const recoMult = ss.recommendationEngine ? 2 : 1;
  const growthPerHour = catalogPop * priceFactor * recoMult;
  const hourlySubRevenue = ss.subscribers * ss.subscriptionPrice;
  const hourlyAdRevenue = ss.adNetwork ? ss.subscribers * 2 : 0;
  const hourlyServerCost = ss.serverCostPerHour;
  const hourlyProfit = hourlySubRevenue + hourlyAdRevenue - hourlyServerCost;
  const serverUpgradeCost = ss.serverLevel * 2000;

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'hsl(340 80% 55% / 0.04)' }}>
      {/* Summary */}
      <div className="px-4 py-3 bg-card/50 border-b border-border">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-[10px] text-muted-foreground">{catIcon} {catLabel}</div>
            <div className="text-lg font-bold tabular-nums">{Math.round(ss.subscribers)} subs</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-muted-foreground">Catalog</div>
            <div className="text-sm font-bold tabular-nums">{ss.catalog.length} titles</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground">Profit/h</div>
            <div className={`text-lg font-bold tabular-nums ${hourlyProfit >= 0 ? 'text-gain' : 'text-loss'}`}>
              {hourlyProfit >= 0 ? '+' : ''}{formatCash(hourlyProfit)}
            </div>
          </div>
        </div>
        <div className="mt-1 h-1.5 bg-secondary rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{
            width: `${Math.min(100, (ss.subscribers / ss.maxSubscribers) * 100)}%`,
            backgroundColor: accent
          }} />
        </div>
        <div className="text-[10px] text-muted-foreground text-center mt-0.5">
          {Math.round(ss.subscribers)}/{ss.maxSubscribers} max · Growth: +{Math.round(growthPerHour)}/h
        </div>
      </div>

      {/* Tabs */}
      <div className="relative flex border-b border-border bg-card">
        {TABS.map((t, i) => (
          <button key={t}
            ref={el => { tabRefs.current[i] = el; }}
            onClick={() => { light(); soundSwitch(); setTab(t); }}
            className="flex-1 py-2.5 text-xs font-semibold capitalize transition-colors duration-200"
            style={{ color: tab === t ? accent : 'hsl(var(--muted-foreground))' }}>
            {t === 'catalog' ? '📚 Catalog' : t === 'store' ? '🛒 Store' : '⚙️ Upgrades'}
          </button>
        ))}
        <div className="absolute bottom-0 h-[2px] transition-all duration-300 ease-out"
          style={{ left: indicator.left, width: indicator.width, backgroundColor: accent }} />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 tab-content-enter" key={tab}>
        {tab === 'catalog' && (
          <>
            {/* Subscription price */}
            <div className="game-card">
              <div className="text-xs font-semibold mb-2">💰 Subscription Price</div>
              <input type="range" min={1} max={50} step={1} value={ss.subscriptionPrice}
                onChange={e => dispatch({ type: 'STREAMING_SET_PRICE', bizId: biz.id, price: Number(e.target.value) })}
                className="w-full accent-primary" />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>{formatCash(1)}/mo</span>
                <span className="font-bold" style={{ color: accent }}>{formatCash(ss.subscriptionPrice)}/mo</span>
                <span>{formatCash(50)}/mo</span>
              </div>
            </div>

            {ss.catalog.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <div className="text-3xl mb-2">📭</div>
                <p className="text-sm">No content yet. Visit the Store to license titles!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {ss.catalog.map((c, i) => (
                  <div key={c.id} className="game-card flex items-center gap-3 animate-fade-in"
                    style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}>
                    <span className="text-lg">{catIcon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs">{c.name}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        {Array.from({ length: 10 }, (_, j) => (
                          <div key={j} className="w-1.5 h-1.5 rounded-full" style={{
                            backgroundColor: j < c.popularity ? accent : 'hsl(var(--secondary))'
                          }} />
                        ))}
                        <span className="text-[10px] text-muted-foreground ml-1">{c.popularity}/10</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'store' && (
          <>
            {ss.availableContent.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <div className="text-3xl mb-2">✅</div>
                <p className="text-sm">All content has been licensed!</p>
              </div>
            ) : (
              ss.availableContent.map((c, i) => (
                <div key={c.id} className="game-card animate-fade-in"
                  style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}>
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{catIcon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs">{c.name}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        {Array.from({ length: 10 }, (_, j) => (
                          <div key={j} className="w-1.5 h-1.5 rounded-full" style={{
                            backgroundColor: j < c.popularity ? accent : 'hsl(var(--secondary))'
                          }} />
                        ))}
                        <span className="text-[10px] text-muted-foreground ml-1">{c.popularity}/10</span>
                      </div>
                    </div>
                    <button
                      onClick={() => { dispatch({ type: 'STREAMING_LICENSE', bizId: biz.id, contentId: c.id }); tap(); }}
                      disabled={state.cash < c.licenseCost}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold active:scale-95 transition-transform ${
                        state.cash >= c.licenseCost ? 'text-white' : 'bg-muted text-muted-foreground'
                      }`}
                      style={state.cash >= c.licenseCost ? { backgroundColor: accent } : undefined}>
                      {formatCash(c.licenseCost)}
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {tab === 'upgrades' && (
          <>
            <div className="game-card">
              <div className="text-xs font-semibold mb-2">🖥️ Server — Level {ss.serverLevel}</div>
              <div className="text-[10px] text-muted-foreground mb-1">Max subscribers: {ss.maxSubscribers} · Cost: {formatCash(ss.serverCostPerHour)}/h</div>
              <div className="text-[10px] text-muted-foreground mb-3">Upgrade = +500 max subs, +$5/h server cost</div>
              <button
                onClick={() => { dispatch({ type: 'STREAMING_UPGRADE_SERVER', bizId: biz.id }); tap(); }}
                disabled={state.cash < serverUpgradeCost}
                className={`w-full py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-transform ${
                  state.cash >= serverUpgradeCost ? 'text-white' : 'bg-muted text-muted-foreground'
                }`}
                style={state.cash >= serverUpgradeCost ? { backgroundColor: accent } : undefined}>
                Upgrade Server — {formatCash(serverUpgradeCost)}
              </button>
            </div>

            <div className="game-card">
              <div className="text-xs font-semibold mb-1">🤖 Recommendation Engine</div>
              <div className="text-[10px] text-muted-foreground mb-3">2x subscriber growth rate</div>
              {ss.recommendationEngine ? (
                <div className="text-center text-[10px] text-gain font-semibold">✅ Installed</div>
              ) : (
                <button
                  onClick={() => { dispatch({ type: 'STREAMING_BUY_RECOMMENDATION', bizId: biz.id }); tap(); }}
                  disabled={state.cash < 5000}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-transform ${
                    state.cash >= 5000 ? 'text-white' : 'bg-muted text-muted-foreground'
                  }`}
                  style={state.cash >= 5000 ? { backgroundColor: accent } : undefined}>
                  Buy — {formatCash(5000)}
                </button>
              )}
            </div>

            <div className="game-card">
              <div className="text-xs font-semibold mb-1">📺 Ad Network</div>
              <div className="text-[10px] text-muted-foreground mb-3">Earn +$2/subscriber/h from ads</div>
              {ss.adNetwork ? (
                <div className="text-center text-[10px] text-gain font-semibold">✅ Installed</div>
              ) : (
                <button
                  onClick={() => { dispatch({ type: 'STREAMING_BUY_ADS', bizId: biz.id }); tap(); }}
                  disabled={state.cash < 3000}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-transform ${
                    state.cash >= 3000 ? 'text-white' : 'bg-muted text-muted-foreground'
                  }`}
                  style={state.cash >= 3000 ? { backgroundColor: accent } : undefined}>
                  Buy — {formatCash(3000)}
                </button>
              )}
            </div>

            <div className="game-card">
              <div className="font-semibold text-sm mb-3">📊 Revenue Breakdown</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Subscription revenue</span><span className="font-bold tabular-nums text-gain">{formatCash(hourlySubRevenue)}/h</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Ad revenue</span><span className="font-bold tabular-nums text-gain">{formatCash(hourlyAdRevenue)}/h</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Server costs</span><span className="font-bold tabular-nums text-loss">-{formatCash(hourlyServerCost)}/h</span></div>
                <div className="flex justify-between border-t border-border pt-1"><span className="text-muted-foreground">Net profit</span>
                  <span className={`font-bold tabular-nums ${hourlyProfit >= 0 ? 'text-gain' : 'text-loss'}`}>{hourlyProfit >= 0 ? '+' : ''}{formatCash(hourlyProfit)}/h</span>
                </div>
                <div className="flex justify-between"><span className="text-muted-foreground">Total earned</span><span className="font-bold tabular-nums">{formatCash(ss.totalRevenue)}</span></div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}