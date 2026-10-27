import React, { useState, useRef, useLayoutEffect } from 'react';
import { useGame, formatCash } from '../../../game/GameContext';
import { BusinessInstance } from '../../../game/GameState';
import { useHaptics } from '../../../hooks/use-haptics';
import { useSounds } from '../../../hooks/use-sounds';

const TABS = ['store', 'restock', 'staff'] as const;
type Tab = typeof TABS[number];

export function SupermarketScreen({ biz }: { biz: BusinessInstance }) {
  const { state, dispatch } = useGame();
  const sm = biz.supermarketState!;
  const [tab, setTab] = useState<Tab>('store');
  const { light, tap } = useHaptics();
  const { switchTab: soundSwitch } = useSounds();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const idx = TABS.indexOf(tab);
    const el = tabRefs.current[idx];
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [tab]);

  const accent = 'hsl(150 60% 45%)';
  const categories = [...new Set(sm.products.map(p => p.category))];

  const cashierCapacity = sm.cashiers * 50;
  let totalDemand = 0;
  let hourlyRevenue = 0;
  for (const p of sm.products) {
    if (p.stock <= 0) continue;
    const priceFactor = Math.max(0.1, 1 - (p.retailPrice - p.wholesalePrice * 2) / (p.wholesalePrice * 3));
    const demand = p.salesRate * priceFactor;
    totalDemand += demand;
    hourlyRevenue += demand * p.retailPrice;
  }
  const throughputRatio = totalDemand > 0 ? Math.min(1, cashierCapacity / totalDemand) : 1;
  hourlyRevenue *= throughputRatio;
  const hourlyCost = sm.cashiers * sm.cashierSalary;
  const hourlyProfit = hourlyRevenue - hourlyCost;

  let restockAllCost = 0;
  for (const p of sm.products) {
    restockAllCost += (p.maxStock - Math.round(p.stock)) * p.wholesalePrice;
  }

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'hsl(150 60% 45% / 0.04)' }}>
      <div className="px-4 py-3 bg-card/50 border-b border-border">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-[10px] text-muted-foreground">Revenue/h</div>
            <div className="text-lg font-bold tabular-nums text-gain">{formatCash(hourlyRevenue)}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-muted-foreground">Costs/h</div>
            <div className="text-sm font-bold tabular-nums text-loss">-{formatCash(hourlyCost)}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground">Profit/h</div>
            <div className={`text-lg font-bold tabular-nums ${hourlyProfit >= 0 ? 'text-gain' : 'text-loss'}`}>
              {hourlyProfit >= 0 ? '+' : ''}{formatCash(hourlyProfit)}
            </div>
          </div>
        </div>
        {throughputRatio < 1 && (
          <div className="mt-1 text-[10px] text-loss font-semibold text-center">
            ⚠️ Cashiers overloaded — {Math.round(throughputRatio * 100)}% capacity
          </div>
        )}
      </div>

      <div className="relative flex border-b border-border bg-card">
        {TABS.map((t, i) => (
          <button key={t}
            ref={el => { tabRefs.current[i] = el; }}
            onClick={() => { light(); soundSwitch(); setTab(t); }}
            className="flex-1 py-2.5 text-xs font-semibold capitalize transition-colors duration-200"
            style={{ color: tab === t ? accent : 'hsl(var(--muted-foreground))' }}>
            {t === 'store' ? '🏪 Store' : t === 'restock' ? '📦 Stock' : '👥 Staff'}
          </button>
        ))}
        <div className="absolute bottom-0 h-[2px] transition-all duration-300 ease-out"
          style={{ left: indicator.left, width: indicator.width, backgroundColor: accent }} />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 tab-content-enter" key={tab}>
        {tab === 'store' && categories.map((cat, ci) => {
          const prods = sm.products.filter(p => p.category === cat);
          return (
            <div key={cat} className="animate-fade-in" style={{ animationDelay: `${ci * 60}ms`, animationFillMode: 'both' }}>
              <div className="text-xs font-bold text-muted-foreground mb-2">{cat}</div>
              <div className="space-y-2">
                {prods.map(p => {
                  const stockPct = (p.stock / p.maxStock) * 100;
                  const margin = p.retailPrice - p.wholesalePrice;
                  return (
                    <div key={p.id} className="game-card">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{p.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-xs">{p.name}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {Math.round(p.stock)}/{p.maxStock} · Margin {formatCash(margin)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { dispatch({ type: 'SUPERMARKET_SET_PRICE', bizId: biz.id, productId: p.id, price: p.retailPrice - 1 }); light(); }}
                            disabled={p.retailPrice <= p.wholesalePrice + 1}
                            className="w-6 h-6 rounded-md bg-secondary text-xs font-bold flex items-center justify-center active:scale-90 transition-transform">−</button>
                          <span className="text-xs font-bold tabular-nums w-10 text-center">{formatCash(p.retailPrice)}</span>
                          <button
                            onClick={() => { dispatch({ type: 'SUPERMARKET_SET_PRICE', bizId: biz.id, productId: p.id, price: p.retailPrice + 1 }); light(); }}
                            className="w-6 h-6 rounded-md bg-secondary text-xs font-bold flex items-center justify-center active:scale-90 transition-transform">+</button>
                        </div>
                      </div>
                      <div className="mt-1.5 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${stockPct}%`, backgroundColor: stockPct > 50 ? 'hsl(var(--gain))' : stockPct > 20 ? 'hsl(var(--warning))' : 'hsl(var(--loss))' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {tab === 'restock' && (
          <>
            <button
              onClick={() => { dispatch({ type: 'SUPERMARKET_RESTOCK_ALL', bizId: biz.id }); tap(); }}
              disabled={restockAllCost <= 0 || state.cash < restockAllCost}
              className={`w-full py-3 rounded-xl text-sm font-bold active:scale-95 transition-transform ${
                restockAllCost > 0 && state.cash >= restockAllCost ? 'text-black' : 'bg-muted text-muted-foreground'
              }`}
              style={restockAllCost > 0 && state.cash >= restockAllCost ? { backgroundColor: accent } : undefined}>
              📦 Restock All — {formatCash(restockAllCost)}
            </button>

            {sm.products.filter(p => Math.round(p.stock) < p.maxStock).map((p, i) => {
              const needed = p.maxStock - Math.round(p.stock);
              const cost = needed * p.wholesalePrice;
              return (
                <div key={p.id} className="game-card flex items-center gap-3 animate-fade-in"
                  style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}>
                  <span className="text-lg">{p.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs">{p.name}</div>
                    <div className="text-[10px] text-muted-foreground">Need {needed} · {formatCash(p.wholesalePrice)}/ea</div>
                  </div>
                  <button
                    onClick={() => { dispatch({ type: 'SUPERMARKET_RESTOCK', bizId: biz.id, productId: p.id, qty: needed }); tap(); }}
                    disabled={state.cash < cost}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold active:scale-95 transition-transform ${
                      state.cash >= cost ? 'text-black' : 'bg-muted text-muted-foreground'
                    }`}
                    style={state.cash >= cost ? { backgroundColor: accent } : undefined}>
                    {formatCash(cost)}
                  </button>
                </div>
              );
            })}

            {sm.products.every(p => Math.round(p.stock) >= p.maxStock) && (
              <div className="text-center text-muted-foreground py-8 text-sm">
                <div className="text-3xl mb-2">✅</div>All stocked up!
              </div>
            )}
          </>
        )}

        {tab === 'staff' && (
          <>
            <div className="game-card">
              <div className="flex justify-between items-center mb-2">
                <div className="font-semibold text-sm">👥 Cashiers</div>
                <div className="text-xs text-muted-foreground">{sm.cashiers}/{sm.maxCashiers}</div>
              </div>
              <div className="text-[10px] text-muted-foreground mb-3">
                Each handles 50 items/h · Salary: {formatCash(sm.cashierSalary)}/h
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { dispatch({ type: 'SUPERMARKET_HIRE_CASHIER', bizId: biz.id }); tap(); }}
                  disabled={sm.cashiers >= sm.maxCashiers}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold active:scale-95 transition-transform ${
                    sm.cashiers < sm.maxCashiers ? 'text-black' : 'bg-muted text-muted-foreground'
                  }`}
                  style={sm.cashiers < sm.maxCashiers ? { backgroundColor: accent } : undefined}>+ Hire</button>
                <button
                  onClick={() => { dispatch({ type: 'SUPERMARKET_FIRE_CASHIER', bizId: biz.id }); tap(); }}
                  disabled={sm.cashiers <= 1}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold active:scale-95 transition-transform ${
                    sm.cashiers > 1 ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground'
                  }`}>− Fire</button>
              </div>
            </div>

            <div className="game-card">
              <div className="font-semibold text-sm mb-2">🏪 Store Level: {sm.storeLevel}</div>
              <div className="text-[10px] text-muted-foreground mb-3">Upgrade = +20% max stock + 1 cashier slot</div>
              <button
                onClick={() => { dispatch({ type: 'SUPERMARKET_UPGRADE_STORE', bizId: biz.id }); tap(); }}
                disabled={state.cash < sm.storeLevel * 1000}
                className={`w-full py-2.5 rounded-lg text-xs font-semibold active:scale-95 transition-transform ${
                  state.cash >= sm.storeLevel * 1000 ? 'text-black' : 'bg-muted text-muted-foreground'
                }`}
                style={state.cash >= sm.storeLevel * 1000 ? { backgroundColor: accent } : undefined}>
                Upgrade — {formatCash(sm.storeLevel * 1000)}
              </button>
            </div>

            <div className="game-card">
              <div className="font-semibold text-sm mb-2">📊 Statistics</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Total revenue</span><span className="font-bold tabular-nums">{formatCash(sm.totalRevenue)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Total costs</span><span className="font-bold tabular-nums text-loss">{formatCash(sm.totalCost)}</span></div>
                <div className="flex justify-between border-t border-border pt-1"><span className="text-muted-foreground">Net profit</span>
                  <span className={`font-bold tabular-nums ${sm.totalRevenue - sm.totalCost >= 0 ? 'text-gain' : 'text-loss'}`}>{formatCash(sm.totalRevenue - sm.totalCost)}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}