import React, { useState, useMemo, useEffect, useRef, useLayoutEffect } from 'react';
import { useGame, formatCash } from '../../../game/GameContext';
import { BusinessInstance, generateCafeMarketplace, getCafeBuildTime } from '../../../game/GameState';
import { useHaptics } from '../../../hooks/use-haptics';
import { useSounds } from '../../../hooks/use-sounds';

function useCountdown(targetMs?: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!targetMs) return;
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, [targetMs]);
  if (!targetMs) return null;
  const remaining = Math.max(0, targetMs - now);
  if (remaining <= 0) return null;
  const secs = Math.floor(remaining / 1000);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const CAFE_TABS = ['locations', 'menu', 'upgrades'] as const;

export function CafeScreen({ biz }: { biz: BusinessInstance }) {
  const { state, dispatch } = useGame();
  const cs = biz.cafeState!;
  const [tab, setTab] = useState<'locations' | 'menu' | 'upgrades'>('locations');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [showMarketplace, setShowMarketplace] = useState(false);
  const { light } = useHaptics();
  const { switchTab: soundSwitch } = useSounds();
  const cafeTabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [cafeIndicator, setCafeIndicator] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const idx = CAFE_TABS.indexOf(tab);
    const el = cafeTabRefs.current[idx];
    if (el) {
      setCafeIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    }
  }, [tab]);

  const selectedLoc = cs.locations.find(l => l.id === selectedLocation);

  const ownedCombos = cs.locations.map(l => l.name);
  const marketplace = useMemo(
    () => generateCafeMarketplace(ownedCombos),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [showMarketplace, cs.locations.length]
  );

  const accent = 'hsl(25 95% 53%)';

  return (
    <div className="flex flex-col" style={{ backgroundColor: 'hsl(25 95% 53% / 0.04)' }}>
      <div className="relative flex border-b border-border bg-card">
        {CAFE_TABS.map((t, i) => (
          <button key={t}
            ref={el => { cafeTabRefs.current[i] = el; }}
            onClick={() => { light(); soundSwitch(); setTab(t); setSelectedLocation(null); }}
            className="flex-1 py-2.5 text-xs font-semibold capitalize transition-colors duration-200"
            style={{ color: tab === t ? accent : 'hsl(var(--muted-foreground))' }}>
            {t}
          </button>
        ))}
        <div
          className="absolute bottom-0 h-[2px] transition-all duration-300 ease-out"
          style={{ left: cafeIndicator.left, width: cafeIndicator.width, backgroundColor: accent }}
        />
      </div>

      <div className="p-4 space-y-3 tab-content-enter" key={tab}>
        {/* LOCATIONS LIST */}
        {tab === 'locations' && !selectedLocation && !showMarketplace && (
          <>
            <button onClick={() => setShowMarketplace(true)}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white active:scale-95 transition-transform"
              style={{ backgroundColor: accent }}>
              + Open New Location
            </button>
            {cs.locations.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <div className="text-3xl mb-2">☕</div>
                <p className="text-sm">No locations yet. Open your first café!</p>
              </div>
            )}
            {cs.locations.map(loc => {
              const isBuilding = loc.status === 'building';
              return (
                <button key={loc.id} onClick={() => !isBuilding && setSelectedLocation(loc.id)}
                  className={`game-card flex items-center gap-3 w-full text-left ${isBuilding ? 'opacity-70' : ''}`}
                  disabled={isBuilding}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: 'hsl(25 95% 53% / 0.15)' }}>
                    {isBuilding ? '🚧' : '📍'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{loc.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {isBuilding ? <BuildingCountdown target={loc.buildReadyAt} /> : `Cap: ${loc.capacity}/h${loc.hasEmployee ? '' : ' • No employee'}`}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    loc.status === 'open' ? 'bg-primary/20 text-gain' :
                    loc.status === 'building' ? 'bg-secondary text-muted-foreground' :
                    loc.status === 'no-employee' ? 'bg-secondary text-muted-foreground' :
                    'bg-loss/20 text-loss'
                  }`}>
                    {loc.status === 'open' ? '● Open' : loc.status === 'building' ? '🔨 Building' : loc.status === 'no-employee' ? '👤 Need Staff' : '⚠ Restock'}
                  </span>
                </button>
              );
            })}
          </>
        )}

        {/* MARKETPLACE */}
        {tab === 'locations' && showMarketplace && (
          <>
            <button onClick={() => setShowMarketplace(false)} className="text-sm text-muted-foreground mb-2">← Back</button>
            <h3 className="font-bold text-sm">Available Locations</h3>
            {marketplace.map(loc => {
              const canBuy = state.cash >= loc.price;
              return (
                <div key={loc.id} className="game-card">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: 'hsl(25 95% 53% / 0.15)' }}>🏙️</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{loc.street}</div>
                      <div className="text-xs text-muted-foreground">{loc.city} — Cap: {loc.capacity}/h</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      dispatch({ type: 'CAFE_BUY_LOCATION', bizId: biz.id, city: loc.city, street: loc.street, price: loc.price, capacity: loc.capacity });
                      setShowMarketplace(false);
                    }}
                    disabled={!canBuy}
                    className={`w-full py-2 rounded-lg text-sm font-semibold ${canBuy ? 'text-white active:scale-95 transition-transform' : 'bg-muted text-muted-foreground'}`}
                    style={canBuy ? { backgroundColor: accent } : undefined}>
                    Buy — {formatCash(loc.price)}
                  </button>
                </div>
              );
            })}
          </>
        )}

        {/* LOCATION DETAIL */}
        {tab === 'locations' && selectedLoc && (
          <LocationDetail biz={biz} loc={selectedLoc} accent={accent} onBack={() => setSelectedLocation(null)} />
        )}

        {/* MENU TAB */}
        {tab === 'menu' && (
          <>
            <div className="game-card">
              <div className="text-xs text-muted-foreground">Adjust prices. Higher prices reduce customer satisfaction.</div>
            </div>
            {cs.menu.map(item => {
              const priceDiff = ((item.currentPrice - item.basePrice) / item.basePrice * 100).toFixed(0);
              const isUp = item.currentPrice > item.basePrice;
              return (
                <div key={item.id} className="game-card">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-sm">{item.name}</span>
                    <span className="text-xs text-muted-foreground">Base: {formatCash(item.basePrice)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => dispatch({ type: 'CAFE_SET_MENU_PRICE', bizId: biz.id, itemId: item.id, price: Math.max(0.5, item.currentPrice - 0.5) })}
                      className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground font-bold">−</button>
                    <div className="flex-1 text-center">
                      <div className="font-bold text-lg">{formatCash(item.currentPrice)}</div>
                      {isUp && <div className="text-xs text-loss">+{priceDiff}%</div>}
                    </div>
                    <button onClick={() => dispatch({ type: 'CAFE_SET_MENU_PRICE', bizId: biz.id, itemId: item.id, price: item.currentPrice + 0.5 })}
                      className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground font-bold">+</button>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* UPGRADES TAB */}
        {tab === 'upgrades' && (
          <UpgradesTab biz={biz} cs={cs} accent={accent} />
        )}
      </div>
    </div>
  );
}

/* ---- Location Detail Sub-component ---- */
function LocationDetail({ biz, loc, accent, onBack }: { biz: BusinessInstance; loc: any; accent: string; onBack: () => void }) {
  const { state, dispatch } = useGame();
  const [subTab, setSubTab] = useState<'stock' | 'upgrades'>('stock');

  return (
    <>
      <button onClick={onBack} className="text-sm text-muted-foreground mb-2">← Back</button>
      <div className="game-card">
        <div className="font-bold text-sm">{loc.name}</div>
        <div className="text-xs text-muted-foreground mb-2">Capacity: {loc.capacity} sales/h</div>

        {/* Employee section */}
        {!loc.hasEmployee ? (
          <button onClick={() => dispatch({ type: 'CAFE_HIRE_EMPLOYEE', bizId: biz.id, locationId: loc.id })}
            className="w-full py-2 rounded-lg text-sm font-semibold text-white active:scale-95"
            style={{ backgroundColor: accent }}>
            👤 Hire Employee — {formatCash(loc.employeeSalary)}/h
          </button>
        ) : (
          <div className="flex justify-between items-center">
            <span className="text-xs text-gain font-semibold">👤 Employee active — {formatCash(loc.employeeSalary)}/h</span>
            <button onClick={() => dispatch({ type: 'CAFE_FIRE_EMPLOYEE', bizId: biz.id, locationId: loc.id })}
              className="text-xs text-loss underline">Fire</button>
          </div>
        )}
      </div>

      {/* Sub-tabs for stock vs location upgrades */}
      <div className="flex gap-2">
        {(['stock', 'upgrades'] as const).map(t => (
          <button key={t} onClick={() => setSubTab(t)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize ${subTab === t ? 'text-white' : 'bg-secondary text-secondary-foreground'}`}
            style={subTab === t ? { backgroundColor: accent } : undefined}>
            {t === 'stock' ? '📦 Stock' : '⬆ Upgrades'}
          </button>
        ))}
      </div>

      {subTab === 'stock' && (
        <>
          {(['beans', 'milk', 'sugar', 'cups'] as const).map(item => {
            const stockVal = loc.stock[item];
            const label = item === 'beans' ? '☕ Beans' : item === 'milk' ? '🥛 Milk' : item === 'sugar' ? '🍬 Sugar' : '🥤 Cups';
            return (
              <div key={item} className="game-card">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold">{label}</span>
                  <span className="text-sm tabular-nums">{Math.floor(stockVal)}/100</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden mb-2">
                  <div className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${stockVal}%`, backgroundColor: stockVal > 30 ? accent : stockVal > 10 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))' }} />
                </div>
                <div className="flex gap-2">
                  {[10, 25, 50].map(qty => {
                    const cost = qty * 0.5;
                    const canBuy = state.cash >= cost && stockVal + qty <= 100;
                    return (
                      <button key={qty}
                        onClick={() => dispatch({ type: 'CAFE_RESTOCK_LOCATION', bizId: biz.id, locationId: loc.id, item, qty })}
                        disabled={!canBuy}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${canBuy ? 'active:scale-95' : 'bg-muted text-muted-foreground'}`}
                        style={canBuy ? { backgroundColor: 'hsl(25 95% 53% / 0.12)', color: accent } : undefined}>
                        +{qty} ({formatCash(cost)})
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </>
      )}

      {subTab === 'upgrades' && (
        <>
          {[
            { key: 'wifi', name: '📶 WiFi', desc: '+8% satisfaction', cost: 150, bought: loc.upgrades.wifi },
            { key: 'decor', name: '🎨 Interior Decor', desc: '+6% satisfaction', cost: 200, bought: loc.upgrades.decor },
            { key: 'aircon', name: '❄️ Air Conditioning', desc: '+4% satisfaction', cost: 250, bought: loc.upgrades.aircon },
            { key: 'music', name: '🎵 Ambient Music', desc: '+5% satisfaction', cost: 100, bought: loc.upgrades.music },
          ].map(u => (
            <div key={u.key} className="game-card">
              <div className="font-semibold text-sm">{u.name}</div>
              <div className="text-xs text-muted-foreground mb-2">{u.desc}</div>
              {u.bought ? (
                <div className="text-xs text-gain font-semibold">✓ Installed</div>
              ) : (
                <button onClick={() => dispatch({ type: 'CAFE_LOCATION_UPGRADE', bizId: biz.id, locationId: loc.id, upgrade: u.key })}
                  disabled={state.cash < u.cost}
                  className={`text-xs py-1.5 px-4 rounded-lg font-semibold ${state.cash >= u.cost ? 'text-white active:scale-95' : 'bg-muted text-muted-foreground'}`}
                  style={state.cash >= u.cost ? { backgroundColor: accent } : undefined}>
                  {formatCash(u.cost)}
                </button>
              )}
            </div>
          ))}
        </>
      )}
    </>
  );
}

/* ---- Building Countdown ---- */
function BuildingCountdown({ target }: { target?: number }) {
  const cd = useCountdown(target);
  if (!cd) return <span>Ready!</span>;
  return <span>🔨 Building... {cd}</span>;
}

/* ---- Upgrades Tab Sub-component ---- */
function UpgradesTab({ biz, cs, accent }: { biz: BusinessInstance; cs: any; accent: string }) {
  const { state, dispatch } = useGame();
  const hqBuilding = !!cs.upgrades.hqBuildReadyAt && !cs.upgrades.hasHQ;

  return (
    <>
      {/* Satisfaction bar */}
      <div className="game-card">
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold text-sm">😊 Customer Satisfaction</span>
          <span className={`font-bold text-sm ${cs.satisfaction >= 60 ? 'text-gain' : cs.satisfaction >= 40 ? 'text-warn' : 'text-loss'}`}>
            {cs.satisfaction}%
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${cs.satisfaction}%`, backgroundColor: cs.satisfaction >= 60 ? accent : cs.satisfaction >= 40 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))' }} />
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          50% = normal capacity. Upgrades & fair pricing increase it.
        </div>
      </div>

      {/* HQ Gate */}
      {!cs.upgrades.hasHQ ? (
        <div className="game-card border-2 border-dashed" style={{ borderColor: accent }}>
          <div className="text-center py-4">
            <div className="text-3xl mb-2">🏢</div>
            <div className="font-bold text-sm mb-1">Build Headquarters</div>
            <div className="text-xs text-muted-foreground mb-3">Unlock chain-wide upgrades by building your HQ</div>
            {hqBuilding ? (
              <div className="text-sm font-semibold" style={{ color: accent }}>
                <BuildingCountdown target={cs.upgrades.hqBuildReadyAt} />
              </div>
            ) : (
              <button
                onClick={() => dispatch({ type: 'CAFE_BUILD_HQ', bizId: biz.id })}
                disabled={state.cash < 1000}
                className={`py-2 px-6 rounded-lg text-sm font-semibold ${state.cash >= 1000 ? 'text-white active:scale-95' : 'bg-muted text-muted-foreground'}`}
                style={state.cash >= 1000 ? { backgroundColor: accent } : undefined}>
                Build HQ — {formatCash(1000)}
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="game-card">
            <div className="text-xs font-semibold text-gain">🏢 HQ Active — Chain upgrades unlocked</div>
          </div>

          {[
            { key: 'premiumBeans', name: '☕ Premium Beans', desc: '+10% satisfaction chain-wide', cost: 400, bought: cs.upgrades.premiumBeans },
            { key: 'website', name: '🌐 Website & App', desc: '+15% customer capacity', cost: 600, bought: cs.upgrades.website },
            { key: 'loyaltyProgram', name: '💳 Loyalty Program', desc: '+8% satisfaction chain-wide', cost: 500, bought: cs.upgrades.loyaltyProgram },
            { key: 'training', name: '👨‍🍳 Staff Training', desc: '-20% stock consumption', cost: 500, bought: cs.upgrades.training },
          ].map(u => (
            <div key={u.key} className="game-card">
              <div className="font-semibold text-sm">{u.name}</div>
              <div className="text-xs text-muted-foreground mb-2">{u.desc}</div>
              {u.bought ? (
                <div className="text-xs text-gain font-semibold">✓ Purchased</div>
              ) : (
                <button onClick={() => dispatch({ type: 'CAFE_UPGRADE', bizId: biz.id, upgrade: u.key })}
                  disabled={state.cash < u.cost}
                  className={`text-xs py-1.5 px-4 rounded-lg font-semibold ${state.cash >= u.cost ? 'text-white active:scale-95' : 'bg-muted text-muted-foreground'}`}
                  style={state.cash >= u.cost ? { backgroundColor: accent } : undefined}>
                  {formatCash(u.cost)}
                </button>
              )}
            </div>
          ))}

          <div className="game-card">
            <div className="font-semibold text-sm">🍰 New Products</div>
            <div className="text-xs text-muted-foreground mb-2">Tier {cs.upgrades.menuTier}/3 — +5% satisfaction per tier</div>
            {cs.upgrades.menuTier < 3 && (
              <button onClick={() => dispatch({ type: 'CAFE_UPGRADE', bizId: biz.id, upgrade: 'menu' })}
                disabled={state.cash < 200}
                className={`text-xs py-1.5 px-4 rounded-lg font-semibold ${state.cash >= 200 ? 'text-white active:scale-95' : 'bg-muted text-muted-foreground'}`}
                style={state.cash >= 200 ? { backgroundColor: accent } : undefined}>
                {formatCash(200)}
              </button>
            )}
          </div>
        </>
      )}
    </>
  );
}
