import React, { useState, useRef, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import { useGame, formatCash } from '../../../game/GameContext';
import { BusinessInstance, HIGHWAY_CITIES, HighwayRoute, formatDuration, calcHighwayDistance, calcHighwayBuildCost, calcHighwayBuildTime } from '../../../game/GameState';
import { useHaptics } from '../../../hooks/use-haptics';
import { useSounds } from '../../../hooks/use-sounds';

const TABS = ['map', 'routes', 'stats'] as const;
type Tab = typeof TABS[number];

export function HighwayScreen({ biz }: { biz: BusinessInstance }) {
  const { state, dispatch } = useGame();
  const hs = biz.highwayState!;
  const [tab, setTab] = useState<Tab>('map');
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [creatingRoute, setCreatingRoute] = useState(false);
  const [selectedCityA, setSelectedCityA] = useState<string | null>(null);
  const [selectedCityB, setSelectedCityB] = useState<string | null>(null);
  const { light, tap } = useHaptics();
  const { switchTab: soundSwitch } = useSounds();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const idx = TABS.indexOf(tab);
    const el = tabRefs.current[idx];
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [tab]);

  const accent = 'hsl(200 70% 45%)';
  const builtRoutes = hs.routes.filter(r => r.built);
  const buildingRoutes = hs.routes.filter(r => r.building);

  const totalHourlyRevenue = builtRoutes.reduce((sum, r) => {
    const traffic = r.baseTraffic * r.lanes * Math.max(0.1, 1 - r.tollPrice / 20);
    return sum + traffic * r.tollPrice;
  }, 0);

  const getCity = (id: string) => HIGHWAY_CITIES.find(c => c.id === id)!;
  const sel = hs.routes.find(r => r.id === selectedRoute);

  const getRouteRevenue = (r: HighwayRoute) => {
    if (!r.built) return 0;
    return r.baseTraffic * r.lanes * Math.max(0.1, 1 - r.tollPrice / 20) * r.tollPrice;
  };

  const getRouteTraffic = (r: HighwayRoute) => {
    return r.baseTraffic * r.lanes * Math.max(0.1, 1 - r.tollPrice / 20);
  };

  const getLaneUpgradeCost = (r: HighwayRoute) => Math.round(r.lanes * 500 * r.distance / 100);

  const handleCityClick = (cityId: string) => {
    if (!creatingRoute) return;
    if (!selectedCityA) {
      setSelectedCityA(cityId);
      light();
    } else if (cityId !== selectedCityA) {
      const exists = hs.routes.some(r =>
        (r.cityA === selectedCityA && r.cityB === cityId) ||
        (r.cityA === cityId && r.cityB === selectedCityA)
      );
      if (!exists) {
        setSelectedCityB(cityId);
      }
      light();
    }
  };

  const confirmBuild = () => {
    if (selectedCityA && selectedCityB) {
      dispatch({ type: 'HIGHWAY_CREATE_ROUTE', bizId: biz.id, cityAId: selectedCityA, cityBId: selectedCityB });
      tap();
    }
    setSelectedCityA(null);
    setSelectedCityB(null);
    setCreatingRoute(false);
  };

  const cancelBuild = () => {
    setSelectedCityA(null);
    setSelectedCityB(null);
    setCreatingRoute(false);
  };

  // Preview data for confirmation
  const previewData = selectedCityA && selectedCityB ? (() => {
    const cA = getCity(selectedCityA);
    const cB = getCity(selectedCityB);
    const dist = calcHighwayDistance(cA, cB);
    const cost = calcHighwayBuildCost(dist);
    const time = calcHighwayBuildTime(dist);
    return { cA, cB, dist, cost, time };
  })() : null;

  // Route detail panel
  if (sel) {
    const cA = getCity(sel.cityA);
    const cB = getCity(sel.cityB);
    const now = Date.now();
    const buildProgress = sel.building && sel.buildStartedAt && sel.buildReadyAt
      ? Math.min(100, ((now - sel.buildStartedAt) / (sel.buildReadyAt - sel.buildStartedAt)) * 100) : 0;
    const remaining = sel.buildReadyAt ? Math.max(0, sel.buildReadyAt - now) : 0;

    return (
      <div className="flex flex-col h-full" style={{ backgroundColor: 'hsl(200 70% 45% / 0.04)' }}>
        <div className="px-4 py-3 border-b border-border flex items-center gap-3 bg-card">
          <button onClick={() => setSelectedRoute(null)} className="text-xl w-8 h-8 flex items-center justify-center" style={{ color: accent }}>←</button>
          <div className="flex-1">
            <h2 className="font-bold text-sm">{cA.name} → {cB.name}</h2>
            <span className="text-xs text-muted-foreground">{sel.distance} km</span>
          </div>
          <div className="text-right">
            {sel.built && <div className="text-xs font-bold" style={{ color: accent }}>{sel.lanes} lane{sel.lanes > 1 ? 's' : ''}</div>}
            <div className={`text-[10px] font-semibold ${sel.built ? 'text-gain' : 'text-warning'}`}>
              {sel.built ? '✅ Active' : '🏗️ Building'}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 tab-content-enter">
          {sel.building && (
            <div className="game-card">
              <div className="text-xs font-semibold mb-2">🏗️ Under Construction</div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden mb-1">
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${buildProgress}%`, backgroundColor: accent }} />
              </div>
              <div className="text-[10px] text-muted-foreground text-center">{Math.round(buildProgress)}% — {formatDuration(remaining)} remaining</div>
            </div>
          )}

          {sel.built && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <div className="game-card text-center py-2">
                  <div className="text-[10px] text-muted-foreground">Traffic/h</div>
                  <div className="text-xs font-bold tabular-nums">{Math.round(getRouteTraffic(sel))}</div>
                </div>
                <div className="game-card text-center py-2">
                  <div className="text-[10px] text-muted-foreground">Toll</div>
                  <div className="text-xs font-bold tabular-nums">{formatCash(sel.tollPrice)}</div>
                </div>
                <div className="game-card text-center py-2">
                  <div className="text-[10px] text-muted-foreground">Revenue/h</div>
                  <div className="text-xs font-bold tabular-nums text-gain">{formatCash(getRouteRevenue(sel))}</div>
                </div>
              </div>

              <div className="game-card">
                <div className="text-xs font-semibold mb-2">💰 Toll Price</div>
                <div className="text-[10px] text-muted-foreground mb-2">Higher toll = less traffic but more per vehicle</div>
                <input type="range" min={1} max={20} step={1} value={sel.tollPrice}
                  onChange={e => dispatch({ type: 'HIGHWAY_SET_TOLL', bizId: biz.id, routeId: sel.id, price: Number(e.target.value) })}
                  className="w-full accent-primary" />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>{formatCash(1)}</span>
                  <span className="font-bold" style={{ color: accent }}>{formatCash(sel.tollPrice)}</span>
                  <span>{formatCash(20)}</span>
                </div>
              </div>

              <div className="game-card">
                <div className="text-xs font-semibold mb-2">🚗 Lanes: {sel.lanes}/4</div>
                <div className="flex gap-1 mb-3">
                  {[1, 2, 3, 4].map(l => (
                    <div key={l} className="flex-1 h-2 rounded-full" style={{
                      backgroundColor: l <= sel.lanes ? accent : 'hsl(var(--secondary))'
                    }} />
                  ))}
                </div>
                {sel.lanes < 4 && (
                  <button
                    onClick={() => { dispatch({ type: 'HIGHWAY_UPGRADE_LANE', bizId: biz.id, routeId: sel.id }); tap(); }}
                    disabled={state.cash < getLaneUpgradeCost(sel)}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-transform ${
                      state.cash >= getLaneUpgradeCost(sel) ? 'text-white' : 'bg-muted text-muted-foreground'
                    }`}
                    style={state.cash >= getLaneUpgradeCost(sel) ? { backgroundColor: accent } : undefined}>
                    + Add Lane — {formatCash(getLaneUpgradeCost(sel))}
                  </button>
                )}
                {sel.lanes >= 4 && (
                  <div className="text-center text-[10px] text-muted-foreground">Max capacity reached ✅</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'hsl(200 70% 45% / 0.04)' }}>
      {/* Summary */}
      <div className="px-4 py-3 bg-card/50 border-b border-border">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-[10px] text-muted-foreground">Routes Built</div>
            <div className="text-lg font-bold tabular-nums">{builtRoutes.length}</div>
          </div>
          <div className="text-center">
            {buildingRoutes.length > 0 && (
              <>
                <div className="text-[10px] text-muted-foreground">Building</div>
                <div className="text-sm font-bold tabular-nums" style={{ color: 'hsl(var(--warning))' }}>{buildingRoutes.length}</div>
              </>
            )}
          </div>
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground">Revenue/h</div>
            <div className="text-lg font-bold tabular-nums text-gain">{formatCash(totalHourlyRevenue)}</div>
          </div>
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
            {t === 'map' ? '🗺️ Map' : t === 'routes' ? '📋 Routes' : '📊 Stats'}
          </button>
        ))}
        <div className="absolute bottom-0 h-[2px] transition-all duration-300 ease-out"
          style={{ left: indicator.left, width: indicator.width, backgroundColor: accent }} />
      </div>

      <div className="flex-1 overflow-y-auto tab-content-enter" key={tab}>
        {tab === 'map' && (
          <div className="p-3">
            <div className="game-card p-2">
              <svg viewBox="0 0 100 72" className="w-full h-auto">
                <path d="M5,25 Q10,10 20,5 L45,3 Q50,3 55,8 L65,10 Q80,12 92,16 L95,22 Q92,30 85,38 L70,42 Q60,48 55,58 L48,62 Q40,68 30,68 L15,65 Q8,60 5,50 Z"
                  fill="hsl(200 70% 45% / 0.06)" stroke="hsl(200 70% 45% / 0.15)" strokeWidth="0.3" />

                {/* Route lines */}
                {hs.routes.map(route => {
                  const cA = getCity(route.cityA);
                  const cB = getCity(route.cityB);
                  return (
                    <line key={route.id}
                      x1={cA.x} y1={cA.y} x2={cB.x} y2={cB.y}
                      stroke={route.built ? accent : 'hsl(var(--warning))'}
                      strokeWidth={route.built ? route.lanes * 0.4 + 0.4 : 0.6}
                      strokeDasharray={route.built ? 'none' : '1.5,1'}
                      className="cursor-pointer"
                      onClick={() => { setSelectedRoute(route.id); light(); }}
                    />
                  );
                })}

                {/* Preview line when creating */}
                {creatingRoute && selectedCityA && selectedCityB && (() => {
                  const cA = getCity(selectedCityA);
                  const cB = getCity(selectedCityB);
                  return <line x1={cA.x} y1={cA.y} x2={cB.x} y2={cB.y} stroke="hsl(var(--primary))" strokeWidth="0.8" strokeDasharray="2,1" opacity="0.7" />;
                })()}

                {/* City dots */}
                {HIGHWAY_CITIES.map(city => {
                  const isSelected = city.id === selectedCityA;
                  const isTarget = creatingRoute && selectedCityA && city.id !== selectedCityA;
                  return (
                    <g key={city.id} onClick={() => handleCityClick(city.id)} className="cursor-pointer">
                      <circle cx={city.x} cy={city.y}
                        r={isSelected ? 2.5 : city.tier === 3 ? 1.8 : city.tier === 2 ? 1.3 : 0.9}
                        fill={isSelected ? 'hsl(var(--primary))' : accent}
                        stroke={isTarget ? 'hsl(var(--primary))' : 'hsl(var(--background))'}
                        strokeWidth={isTarget ? '0.5' : '0.3'}
                        opacity={creatingRoute && !isSelected && !isTarget ? 0.5 : 1}
                      />
                      <text x={city.x} y={city.y + (city.tier === 3 ? 4 : 3.5)}
                        textAnchor="middle" fontSize={city.tier === 3 ? '2.8' : '2.2'}
                        fill="hsl(var(--foreground))" fontWeight={city.tier === 3 ? 'bold' : 'normal'}>
                        {city.name}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {!creatingRoute ? (
              <button
                onClick={() => { setCreatingRoute(true); light(); }}
                className="w-full mt-3 py-3 rounded-xl text-sm font-bold text-white active:scale-95 transition-transform"
                style={{ backgroundColor: accent }}>
                🛣️ Build New Highway
              </button>
            ) : (
              <div className="mt-3 text-center">
                <div className="text-xs font-semibold mb-2" style={{ color: accent }}>
                  {!selectedCityA ? '📍 Select first city' : !selectedCityB ? '📍 Select second city' : '✅ Confirm route'}
                </div>
                <button onClick={cancelBuild} className="text-xs text-muted-foreground underline">Cancel</button>
              </div>
            )}
          </div>
        )}

        {tab === 'routes' && (
          <div className="p-4 space-y-2">
            {hs.routes.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <div className="text-3xl mb-2">🛣️</div>
                <p className="text-sm">No highways yet. Go to the map to build your first one!</p>
              </div>
            )}
            {[...hs.routes].sort((a, b) => (b.built ? 1 : 0) - (a.built ? 1 : 0)).map((route, i) => {
              const cA = getCity(route.cityA);
              const cB = getCity(route.cityB);
              const now = Date.now();
              const buildPct = route.building && route.buildStartedAt && route.buildReadyAt
                ? Math.min(100, ((now - route.buildStartedAt) / (route.buildReadyAt - route.buildStartedAt)) * 100) : 0;
              return (
                <button key={route.id}
                  onClick={() => { setSelectedRoute(route.id); light(); }}
                  className="game-card w-full text-left active:scale-[0.98] transition-transform animate-fade-in"
                  style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                      style={{
                        backgroundColor: route.built ? 'hsl(200 70% 45% / 0.15)' : 'hsl(var(--secondary))',
                        color: route.built ? accent : 'hsl(var(--muted-foreground))'
                      }}>
                      {route.built ? '🛣️' : '🏗️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs">{cA.name} → {cB.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {route.distance}km {route.built ? `· ${route.lanes} lane${route.lanes > 1 ? 's' : ''} · ${formatCash(route.tollPrice)}/vehicle` : `· ${Math.round(buildPct)}%`}
                      </div>
                    </div>
                    {route.built && (
                      <div className="text-xs font-bold tabular-nums text-gain">{formatCash(getRouteRevenue(route))}/h</div>
                    )}
                  </div>
                  {route.building && (
                    <div className="mt-1.5 h-1 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${buildPct}%`, backgroundColor: 'hsl(var(--warning))' }} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {tab === 'stats' && (
          <div className="p-4 space-y-3">
            <div className="game-card">
              <div className="font-semibold text-sm mb-3">📊 Overview</div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Routes built</span><span className="font-bold">{builtRoutes.length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Highway km</span><span className="font-bold tabular-nums">{builtRoutes.reduce((s, r) => s + r.distance, 0)} km</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Total lanes</span><span className="font-bold tabular-nums">{builtRoutes.reduce((s, r) => s + r.lanes, 0)}</span></div>
                <div className="flex justify-between border-t border-border pt-2"><span className="text-muted-foreground">Hourly revenue</span><span className="font-bold tabular-nums text-gain">{formatCash(totalHourlyRevenue)}/h</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Total revenue</span><span className="font-bold tabular-nums">{formatCash(hs.totalRevenue)}</span></div>
              </div>
            </div>

            {builtRoutes.length > 0 && (
              <div className="game-card">
                <div className="font-semibold text-sm mb-3">🏆 Top Routes</div>
                <div className="space-y-2">
                  {[...builtRoutes].sort((a, b) => getRouteRevenue(b) - getRouteRevenue(a)).slice(0, 5).map(r => {
                    const cA = getCity(r.cityA);
                    const cB = getCity(r.cityB);
                    const rev = getRouteRevenue(r);
                    const maxRev = Math.max(...builtRoutes.map(br => getRouteRevenue(br)));
                    return (
                      <div key={r.id}>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span>{cA.name} → {cB.name}</span>
                          <span className="font-bold text-gain">{formatCash(rev)}/h</span>
                        </div>
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${maxRev > 0 ? (rev / maxRev) * 100 : 0}%`, backgroundColor: accent }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Build confirmation modal */}
      {previewData && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={cancelBuild}>
          <div className="w-[320px] bg-card rounded-2xl border border-border p-5 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">🛣️</div>
              <h2 className="text-lg font-bold">Build Highway</h2>
              <div className="text-sm font-semibold mt-1" style={{ color: accent }}>{previewData.cA.name} → {previewData.cB.name}</div>
            </div>
            <div className="space-y-2 text-xs mb-4">
              <div className="flex justify-between"><span className="text-muted-foreground">Distance</span><span className="font-bold">{previewData.dist} km</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Build time</span><span className="font-bold">{formatDuration(previewData.time)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Cost</span><span className="font-bold">{formatCash(previewData.cost)}</span></div>
            </div>
            <div className="flex gap-2">
              <button onClick={cancelBuild} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-secondary text-secondary-foreground">Cancel</button>
              <button onClick={confirmBuild}
                disabled={state.cash < previewData.cost}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold active:scale-95 transition-transform ${
                  state.cash >= previewData.cost ? 'text-white' : 'bg-muted text-muted-foreground'
                }`}
                style={state.cash >= previewData.cost ? { backgroundColor: accent } : undefined}>
                Build — {formatCash(previewData.cost)}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
