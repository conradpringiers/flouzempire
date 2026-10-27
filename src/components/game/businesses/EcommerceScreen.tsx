import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { useGame, formatCash } from '../../../game/GameContext';
import { BusinessInstance } from '../../../game/GameState';
import { useHaptics } from '../../../hooks/use-haptics';
import { useSounds } from '../../../hooks/use-sounds';

const TABS = ['orders', 'inventory', 'upgrades'] as const;
type Tab = typeof TABS[number];

export function EcommerceScreen({ biz }: { biz: BusinessInstance }) {
  const { state, dispatch } = useGame();
  const es = biz.ecomState!;
  const [tab, setTab] = useState<Tab>('orders');
  const { light, tap } = useHaptics();
  const { switchTab: soundSwitch } = useSounds();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const idx = TABS.indexOf(tab);
    const el = tabRefs.current[idx];
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [tab]);

  const accent = 'hsl(280 70% 55%)';
  const pendingOrders = es.orders.filter(o => !o.fulfilled);
  const totalRevenue = es.orders.filter(o => o.fulfilled).reduce((s, o) => s + o.payout, 0);

  // Count urgent orders (< 10s)
  const urgentCount = pendingOrders.filter(o => o.deadline < 10).length;

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'hsl(280 70% 55% / 0.04)' }}>
      {/* Summary strip */}
      <div className="px-4 py-2 flex items-center gap-3 bg-card/50 border-b border-border text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">⭐</span>
          <div className="w-16 bg-muted rounded-full h-1.5 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${es.reputation}%`,
                backgroundColor: es.reputation > 70 ? 'hsl(var(--gain))' : es.reputation > 40 ? 'hsl(var(--warning))' : 'hsl(var(--loss))',
              }}
            />
          </div>
          <span className="tabular-nums font-semibold">{Math.floor(es.reputation)}%</span>
        </div>
        <span className="ml-auto">
          {pendingOrders.length > 0 && (
            <span className="inline-flex items-center gap-1">
              📦 <span className="font-semibold">{pendingOrders.length}</span>
              {urgentCount > 0 && <span className="text-loss font-bold animate-pulse">({urgentCount} urgent!)</span>}
            </span>
          )}
        </span>
      </div>

      {/* Tab Bar */}
      <div className="relative flex border-b border-border bg-card">
        {TABS.map((t, i) => (
          <button key={t}
            ref={el => { tabRefs.current[i] = el; }}
            onClick={() => { light(); soundSwitch(); setTab(t); }}
            className="flex-1 py-2.5 text-xs font-semibold capitalize transition-colors duration-200"
            style={{ color: tab === t ? accent : 'hsl(var(--muted-foreground))' }}>
            {t === 'orders' ? `📦 Orders${pendingOrders.length > 0 ? ` (${pendingOrders.length})` : ''}` : t === 'inventory' ? '📋 Stock' : '⚡ Upgrades'}
          </button>
        ))}
        <div className="absolute bottom-0 h-[2px] transition-all duration-300 ease-out"
          style={{ left: indicator.left, width: indicator.width, backgroundColor: accent }} />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 tab-content-enter" key={tab}>
        {/* ===== ORDERS TAB ===== */}
        {tab === 'orders' && (
          <>
            {pendingOrders.length === 0 && (
              <div className="text-center text-muted-foreground py-8 text-sm">
                <div className="text-3xl mb-2">📭</div>
                No pending orders. Keep your reputation high!
              </div>
            )}

            {pendingOrders.sort((a, b) => a.deadline - b.deadline).map((o, i) => {
              const isUrgent = o.deadline < 10;
              const product = es.products.find(p => p.id === o.productId);
              const hasStock = product && product.stock >= o.quantity;
              const deadlinePct = Math.max(0, Math.min(100, (o.deadline / 60) * 100));

              return (
                <div key={o.id} className={`game-card animate-fade-in ${isUrgent ? 'ring-1 ring-destructive/30' : ''}`}
                  style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                      isUrgent ? 'bg-destructive/15 animate-pulse' : 'bg-muted'
                    }`}>
                      📦
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-sm">{o.productName} ×{o.quantity}</div>
                          <div className="text-[10px] text-muted-foreground">From {o.customer}</div>
                        </div>
                        <span className="text-sm font-bold text-gain whitespace-nowrap">{formatCash(o.payout)}</span>
                      </div>

                      {/* Timer bar */}
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-1000"
                            style={{
                              width: `${deadlinePct}%`,
                              backgroundColor: isUrgent ? 'hsl(var(--loss))' : deadlinePct < 40 ? 'hsl(var(--warning))' : accent,
                            }}
                          />
                        </div>
                        <span className={`text-[10px] tabular-nums font-semibold ${isUrgent ? 'text-loss' : 'text-muted-foreground'}`}>
                          {Math.max(0, Math.floor(o.deadline))}s
                        </span>
                      </div>

                      <button
                        onClick={() => { dispatch({ type: 'ECOM_FULFILL', bizId: biz.id, orderId: o.id }); tap(); }}
                        disabled={!hasStock}
                        className={`mt-2 w-full py-2 rounded-lg text-xs font-semibold active:scale-95 transition-transform ${
                          hasStock ? 'text-white' : 'bg-muted text-muted-foreground'
                        }`}
                        style={hasStock ? { backgroundColor: accent } : undefined}>
                        {hasStock ? '✓ Fulfill Order' : `Need ${o.quantity - (product?.stock || 0)} more in stock`}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* ===== INVENTORY TAB ===== */}
        {tab === 'inventory' && (
          <>
            {es.products.map((p, i) => {
              const stockPct = (p.stock / p.maxStock) * 100;
              const isLow = stockPct < 30;
              const restockCost = Math.ceil((p.maxStock - p.stock) * p.restockCost * 0.5);
              return (
                <div key={p.id} className="game-card animate-fade-in"
                  style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold text-sm">{p.name}</div>
                      <div className="text-[10px] text-muted-foreground">Sell price: {formatCash(p.sellingPrice)}</div>
                    </div>
                    <span className={`text-xs font-bold tabular-nums px-2 py-0.5 rounded-full ${
                      isLow ? 'bg-destructive/15 text-loss' : 'bg-primary/15 text-gain'
                    }`}>
                      {p.stock}/{p.maxStock}
                    </span>
                  </div>

                  {/* Stock bar */}
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden mb-3">
                    <div className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${stockPct}%`,
                        backgroundColor: isLow ? 'hsl(var(--loss))' : accent,
                      }}
                    />
                  </div>

                  {/* Price adjustment */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] text-muted-foreground">Price:</span>
                    <button onClick={() => dispatch({ type: 'ECOM_SET_PRICE', bizId: biz.id, productId: p.id, price: Math.max(1, p.sellingPrice - 5) })}
                      className="w-7 h-7 rounded-lg bg-secondary text-xs font-bold flex items-center justify-center active:scale-90 transition-transform">−</button>
                    <span className="text-sm font-bold tabular-nums flex-1 text-center">{formatCash(p.sellingPrice)}</span>
                    <button onClick={() => dispatch({ type: 'ECOM_SET_PRICE', bizId: biz.id, productId: p.id, price: p.sellingPrice + 5 })}
                      className="w-7 h-7 rounded-lg bg-secondary text-xs font-bold flex items-center justify-center active:scale-90 transition-transform">+</button>
                  </div>

                  <button
                    onClick={() => { dispatch({ type: 'ECOM_RESTOCK', bizId: biz.id, productId: p.id }); tap(); }}
                    disabled={state.cash < restockCost || p.stock >= p.maxStock}
                    className={`w-full py-2 rounded-lg text-xs font-semibold active:scale-95 transition-transform ${
                      state.cash >= restockCost && p.stock < p.maxStock ? 'bg-secondary text-secondary-foreground border border-border' : 'bg-muted/50 text-muted-foreground'
                    }`}>
                    📦 Restock — {formatCash(restockCost)}
                  </button>
                </div>
              );
            })}
          </>
        )}

        {/* ===== UPGRADES TAB ===== */}
        {tab === 'upgrades' && (
          <>
            {/* Shipping */}
            <div className="game-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: 'hsl(280 70% 55% / 0.12)' }}>🚚</div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">Shipping Speed</div>
                  <div className="text-[10px] text-muted-foreground">Faster shipping = happier customers</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5 mb-3">
                {['Standard', 'Express', 'Same-Day'].map((name, i) => (
                  <div key={i} className={`text-center py-2 rounded-lg text-[10px] font-semibold transition-all ${
                    i <= es.shippingTier ? 'text-white' : 'bg-muted text-muted-foreground'
                  }`} style={i <= es.shippingTier ? { backgroundColor: accent } : undefined}>
                    {i < es.shippingTier ? '✓ ' : ''}{name}
                  </div>
                ))}
              </div>
              {es.shippingTier < 2 && (
                <button
                  onClick={() => { dispatch({ type: 'ECOM_UPGRADE_SHIPPING', bizId: biz.id }); tap(); }}
                  disabled={state.cash < (es.shippingTier + 1) * 500}
                  className={`w-full py-2.5 rounded-xl text-xs font-semibold active:scale-95 transition-transform ${
                    state.cash >= (es.shippingTier + 1) * 500 ? 'text-white' : 'bg-muted text-muted-foreground'
                  }`}
                  style={state.cash >= (es.shippingTier + 1) * 500 ? { backgroundColor: accent } : undefined}>
                  Upgrade — {formatCash((es.shippingTier + 1) * 500)}
                </button>
              )}
            </div>

            {/* Warehouse */}
            <div className="game-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: 'hsl(280 70% 55% / 0.12)' }}>🏭</div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">Warehouse Lv.{es.warehouseLevel}</div>
                  <div className="text-[10px] text-muted-foreground">+25 max stock per product per level</div>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-3">
                {Array.from({ length: Math.min(8, es.warehouseLevel + 3) }, (_, i) => (
                  <div key={i} className={`flex-1 h-2 rounded-full transition-all ${
                    i < es.warehouseLevel ? '' : 'bg-muted'
                  }`} style={i < es.warehouseLevel ? { backgroundColor: accent } : undefined} />
                ))}
              </div>
              <button
                onClick={() => { dispatch({ type: 'ECOM_UPGRADE_WAREHOUSE', bizId: biz.id }); tap(); }}
                disabled={state.cash < es.warehouseLevel * 800}
                className={`w-full py-2.5 rounded-xl text-xs font-semibold active:scale-95 transition-transform ${
                  state.cash >= es.warehouseLevel * 800 ? 'text-white' : 'bg-muted text-muted-foreground'
                }`}
                style={state.cash >= es.warehouseLevel * 800 ? { backgroundColor: accent } : undefined}>
                Upgrade — {formatCash(es.warehouseLevel * 800)}
              </button>
            </div>

            {/* Auto-fulfill */}
            <div className="game-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: 'hsl(280 70% 55% / 0.12)' }}>🤖</div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">Auto-Fulfill</div>
                  <div className="text-[10px] text-muted-foreground">Automatically fulfill orders (−10% revenue)</div>
                </div>
                <button onClick={() => { dispatch({ type: 'ECOM_TOGGLE_AUTO', bizId: biz.id }); light(); }}
                  className="w-12 h-7 rounded-full transition-all relative"
                  style={{ backgroundColor: es.autoFulfill ? accent : 'hsl(var(--muted))' }}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-1 transition-transform duration-200 ${
                    es.autoFulfill ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
