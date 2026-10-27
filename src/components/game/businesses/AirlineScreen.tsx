import React, { useState } from 'react';
import { useGame, formatCash } from '../../../game/GameContext';
import { BusinessInstance, AIRLINE_PLANE_TYPES, AIRLINE_CITIES, getAirlineRouteDistance, getAirlineRouteOpenCost } from '../../../game/GameState';
import { useHaptics } from '../../../hooks/use-haptics';
import { useSounds } from '../../../hooks/use-sounds';

interface Props { biz: BusinessInstance; }

export function AirlineScreen({ biz }: Props) {
  const { state, dispatch } = useGame();
  const { tap, light } = useHaptics();
  const { switchTab: soundSwitch } = useSounds();
  const al = biz.airlineState!;
  const [tab, setTab] = useState<'fleet' | 'routes' | 'upgrades'>('fleet');
  const [showBuyPlane, setShowBuyPlane] = useState(false);
  const [showNewRoute, setShowNewRoute] = useState(false);
  const [routeCityA, setRouteCityA] = useState('');
  const [routeCityB, setRouteCityB] = useState('');
  const [assigningPlane, setAssigningPlane] = useState<string | null>(null);

  const hourlyRev = (() => {
    let rev = 0, cost = 0;
    const rSupply: Record<string, number> = {};
    for (const plane of al.planes) {
      if (!plane.routeId) continue;
      const route = al.routes.find(r => r.id === plane.routeId);
      if (!route) continue;
      const tH = (route.distance * 2 / plane.speed) + 1;
      rSupply[route.id] = (rSupply[route.id] || 0) + plane.capacity * (24 / tH);
    }
    for (const plane of al.planes) {
      if (!plane.routeId) { cost += plane.maintenancePerH * 0.3; continue; }
      const route = al.routes.find(r => r.id === plane.routeId);
      if (!route) continue;
      const tH = (route.distance * 2 / plane.speed) + 1;
      const fPerH = 1 / tH;
      const bP = route.distance * 0.05 + 50;
      const pF = Math.max(0.1, 2 - route.ticketPrice / bP);
      const lF = Math.min(0.95, (route.demand * pF) / (rSupply[route.id] || 1));
      const fM = al.fuelEfficiency ? 0.8 : 1;
      rev += plane.capacity * lF * route.ticketPrice * fPerH;
      cost += plane.fuelPerKm * route.distance * 2 * fPerH * fM + plane.maintenancePerH;
    }
    return { rev, cost, net: rev - cost };
  })();

  const routeDistance = routeCityA && routeCityB && routeCityA !== routeCityB
    ? getAirlineRouteDistance(routeCityA, routeCityB) : 0;
  const routeCost = routeDistance > 0
    ? getAirlineRouteOpenCost(routeDistance, (AIRLINE_CITIES.find(c => c.id === routeCityA)?.tier || 2) + (AIRLINE_CITIES.find(c => c.id === routeCityB)?.tier || 2))
    : 0;

  return (
    <div className="p-4 space-y-4">
      {/* Overview */}
      <div className="game-card p-3 text-center" style={{ background: 'linear-gradient(135deg, hsl(210 90% 55% / 0.1), hsl(210 90% 55% / 0.03))' }}>
        <div className="text-xs text-muted-foreground mb-1">Airline Revenue</div>
        <div className={`text-2xl font-bold ${hourlyRev.net >= 0 ? 'text-gain' : 'text-loss'}`}>
          {hourlyRev.net >= 0 ? '+' : ''}{formatCash(hourlyRev.net)}/h
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          ✈️ {al.planes.length} planes • 🗺️ {al.routes.length} routes
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary rounded-xl p-1">
        {(['fleet', 'routes', 'upgrades'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); light(); soundSwitch(); }}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              tab === t ? 'bg-primary text-primary-foreground' : 'text-secondary-foreground'
            }`}>
            {t === 'fleet' ? '✈️ Fleet' : t === 'routes' ? '🗺️ Routes' : '⬆️ Upgrades'}
          </button>
        ))}
      </div>

      {/* Fleet Tab */}
      {tab === 'fleet' && (
        <div className="space-y-3">
          <button onClick={() => setShowBuyPlane(!showBuyPlane)}
            className="w-full py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground active:scale-95 transition-all">
            + Buy Plane
          </button>

          {showBuyPlane && (
            <div className="space-y-2">
              {AIRLINE_PLANE_TYPES.map(pt => (
                <div key={pt.type} className="game-card p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{pt.icon}</span>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{pt.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {pt.capacity} pax • {pt.speed} km/h • Range: {pt.range.toLocaleString()} km
                      </div>
                    </div>
                    <button onClick={() => { dispatch({ type: 'AIRLINE_BUY_PLANE', bizId: biz.id, planeType: pt.type }); tap(); setShowBuyPlane(false); }}
                      disabled={state.cash < pt.cost}
                      className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                        state.cash >= pt.cost ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                      {formatCash(pt.cost)}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {al.planes.length === 0 && !showBuyPlane && (
            <div className="text-center text-muted-foreground py-6 text-sm">
              <div className="text-3xl mb-2">✈️</div>
              Buy your first plane to start flying!
            </div>
          )}

          {al.planes.map(plane => {
            const pt = AIRLINE_PLANE_TYPES.find(p => p.type === plane.type);
            const route = plane.routeId ? al.routes.find(r => r.id === plane.routeId) : null;
            const routeCityNames = route
              ? `${AIRLINE_CITIES.find(c => c.id === route.cityAId)?.name} ↔ ${AIRLINE_CITIES.find(c => c.id === route.cityBId)?.name}`
              : null;
            return (
              <div key={plane.id} className="game-card p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{pt?.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{plane.name}</div>
                    <div className="text-[10px] text-muted-foreground">{plane.capacity} pax • {plane.speed} km/h</div>
                  </div>
                  {route ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gain/20 text-gain font-semibold">Flying</span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">Parked</span>
                  )}
                </div>
                {route && <div className="text-xs text-muted-foreground mb-2">🗺️ {routeCityNames}</div>}
                {assigningPlane === plane.id ? (
                  <div className="space-y-1">
                    <div className="text-xs font-semibold mb-1">Select route:</div>
                    {al.routes.map(r => {
                      const cA = AIRLINE_CITIES.find(c => c.id === r.cityAId);
                      const cB = AIRLINE_CITIES.find(c => c.id === r.cityBId);
                      const inRange = pt ? r.distance <= pt.range : true;
                      return (
                        <button key={r.id} onClick={() => { dispatch({ type: 'AIRLINE_ASSIGN_PLANE', bizId: biz.id, planeId: plane.id, routeId: r.id }); setAssigningPlane(null); tap(); }}
                          disabled={!inRange}
                          className={`w-full py-1.5 px-2 rounded-lg text-xs text-left transition-all ${inRange ? 'bg-secondary hover:bg-secondary/80' : 'bg-muted text-muted-foreground'}`}>
                          {cA?.country} {cA?.name} ↔ {cB?.name} {cB?.country} ({r.distance.toLocaleString()} km)
                          {!inRange && ' ⚠️ Out of range'}
                        </button>
                      );
                    })}
                    <button onClick={() => setAssigningPlane(null)} className="w-full py-1 text-xs text-muted-foreground">Cancel</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    {al.routes.length > 0 && (
                      <button onClick={() => { if (plane.routeId) { dispatch({ type: 'AIRLINE_UNASSIGN_PLANE', bizId: biz.id, planeId: plane.id }); tap(); } else { setAssigningPlane(plane.id); } }}
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-secondary text-secondary-foreground active:scale-95 transition-all">
                        {plane.routeId ? '🛬 Unassign' : '🗺️ Assign Route'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Routes Tab */}
      {tab === 'routes' && (
        <div className="space-y-3">
          <button onClick={() => setShowNewRoute(!showNewRoute)}
            className="w-full py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground active:scale-95 transition-all">
            + Open Route
          </button>

          {showNewRoute && (
            <div className="game-card p-3">
              <div className="text-sm font-semibold mb-2">Select Cities</div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <div className="text-[10px] text-muted-foreground mb-1">From</div>
                  <select value={routeCityA} onChange={e => setRouteCityA(e.target.value)}
                    className="w-full bg-muted rounded-lg px-2 py-1.5 text-xs">
                    <option value="">Select...</option>
                    {AIRLINE_CITIES.map(c => <option key={c.id} value={c.id}>{c.country} {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground mb-1">To</div>
                  <select value={routeCityB} onChange={e => setRouteCityB(e.target.value)}
                    className="w-full bg-muted rounded-lg px-2 py-1.5 text-xs">
                    <option value="">Select...</option>
                    {AIRLINE_CITIES.filter(c => c.id !== routeCityA).map(c => <option key={c.id} value={c.id}>{c.country} {c.name}</option>)}
                  </select>
                </div>
              </div>
              {routeDistance > 0 && (
                <div className="text-xs text-muted-foreground mb-2">
                  Distance: {routeDistance.toLocaleString()} km • Cost: {formatCash(routeCost)}
                </div>
              )}
              <button onClick={() => {
                dispatch({ type: 'AIRLINE_OPEN_ROUTE', bizId: biz.id, cityAId: routeCityA, cityBId: routeCityB });
                tap(); setShowNewRoute(false); setRouteCityA(''); setRouteCityB('');
              }}
                disabled={!routeCityA || !routeCityB || routeCityA === routeCityB || state.cash < routeCost}
                className={`w-full py-2 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                  routeCityA && routeCityB && routeCityA !== routeCityB && state.cash >= routeCost
                    ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                Open Route — {formatCash(routeCost)}
              </button>
            </div>
          )}

          {al.routes.length === 0 && !showNewRoute && (
            <div className="text-center text-muted-foreground py-6 text-sm">
              <div className="text-3xl mb-2">🗺️</div>
              Open your first route to start flying passengers!
            </div>
          )}

          {al.routes.map(route => {
            const cA = AIRLINE_CITIES.find(c => c.id === route.cityAId);
            const cB = AIRLINE_CITIES.find(c => c.id === route.cityBId);
            const planesOnRoute = al.planes.filter(p => p.routeId === route.id);
            return (
              <div key={route.id} className="game-card p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-semibold">{cA?.country} {cA?.name} ↔ {cB?.name} {cB?.country}</div>
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  {route.distance.toLocaleString()} km • Demand: {route.demand} pax/day • {planesOnRoute.length} plane{planesOnRoute.length !== 1 ? 's' : ''} assigned
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Ticket:</span>
                  <input type="range" min={10} max={Math.round(route.distance * 0.15 + 100)}
                    value={route.ticketPrice}
                    onChange={e => dispatch({ type: 'AIRLINE_SET_TICKET', bizId: biz.id, routeId: route.id, price: parseInt(e.target.value) })}
                    className="flex-1 h-1.5 accent-primary" />
                  <span className="text-xs font-bold w-16 text-right">{formatCash(route.ticketPrice)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upgrades Tab */}
      {tab === 'upgrades' && (
        <div className="space-y-3">
          <div className="game-card p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">⛽ Fuel Efficiency</div>
                <div className="text-xs text-muted-foreground">-20% fuel costs on all routes</div>
              </div>
              {al.fuelEfficiency ? (
                <span className="text-[10px] px-2 py-1 rounded-full bg-gain/20 text-gain font-semibold">Owned</span>
              ) : (
                <button onClick={() => { dispatch({ type: 'AIRLINE_UPGRADE', bizId: biz.id, upgrade: 'fuel' }); tap(); }}
                  disabled={state.cash < 200000}
                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                    state.cash >= 200000 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                  {formatCash(200000)}
                </button>
              )}
            </div>
          </div>

          <div className="game-card p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">🎫 Frequent Flyer Program</div>
                <div className="text-xs text-muted-foreground">+15% demand on all routes</div>
              </div>
              {al.frequentFlyer ? (
                <span className="text-[10px] px-2 py-1 rounded-full bg-gain/20 text-gain font-semibold">Owned</span>
              ) : (
                <button onClick={() => { dispatch({ type: 'AIRLINE_UPGRADE', bizId: biz.id, upgrade: 'loyalty' }); tap(); }}
                  disabled={state.cash < 150000}
                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                    state.cash >= 150000 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                  {formatCash(150000)}
                </button>
              )}
            </div>
          </div>

          <div className="game-card p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">🛋️ Airport Lounge (Lv.{al.loungeLevel})</div>
                <div className="text-xs text-muted-foreground">Premium passenger experience</div>
              </div>
              <button onClick={() => { dispatch({ type: 'AIRLINE_UPGRADE', bizId: biz.id, upgrade: 'lounge' }); tap(); }}
                disabled={state.cash < (al.loungeLevel + 1) * 100000}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                  state.cash >= (al.loungeLevel + 1) * 100000 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                {formatCash((al.loungeLevel + 1) * 100000)}
              </button>
            </div>
          </div>

          {/* Revenue Stats */}
          <div className="game-card p-3">
            <div className="text-sm font-semibold mb-2">📊 Financial Summary</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Gross Revenue/h</span><span className="font-semibold text-gain">{formatCash(hourlyRev.rev)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Operating Costs/h</span><span className="font-semibold text-loss">-{formatCash(hourlyRev.cost)}</span></div>
              <div className="flex justify-between border-t border-border pt-1 mt-1"><span className="font-semibold">Net Profit/h</span><span className={`font-bold ${hourlyRev.net >= 0 ? 'text-gain' : 'text-loss'}`}>{hourlyRev.net >= 0 ? '+' : ''}{formatCash(hourlyRev.net)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total Earned</span><span className="font-semibold">{formatCash(al.totalRevenue)}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
