import React, { useMemo } from 'react';
import { useGame, formatCash } from '../../game/GameContext';
import { BUSINESS_TYPES, calcCashPerSec, BANK_INTEREST_RATES } from '../../game/GameState';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

function calcBizHourlyIncome(biz: any, state: any): number {
  let cps = 0;
  if (biz.type === 'cafe' && biz.cafeState) {
    const cs = biz.cafeState;
    const satisfactionMult = cs.satisfaction / 100;
    const capacityMult = cs.upgrades.website ? 1.15 : 1;
    for (const loc of cs.locations) {
      if (!loc.hasEmployee) continue;
      const hasStock = loc.stock.beans > 0 && loc.stock.milk > 0 && loc.stock.sugar > 0 && loc.stock.cups > 0;
      if (!hasStock) continue;
      const avgPrice = cs.menu.reduce((s: number, m: any) => s + m.currentPrice, 0) / cs.menu.length;
      cps += (loc.capacity * capacityMult * avgPrice * satisfactionMult) / 3600;
      cps -= loc.employeeSalary / 3600;
    }
  }
  if (biz.type === 'agency' && biz.agencyState) {
    cps -= biz.agencyState.employees.reduce((s: number, e: any) => s + e.salary, 0) / 3600;
  }
  if (biz.type === 'realestate' && biz.realEstateState) {
    for (const p of biz.realEstateState.properties) {
      if (p.status === 'rented') cps += p.rentalIncome / 3600;
    }
  }
  if (biz.type === 'bank' && biz.bankState) {
    const bs = biz.bankState;
    const rate = BANK_INTEREST_RATES[bs.upgradeLevel];
    cps += (bs.deposited * rate) / 3600;
    if (bs.upgradeLevel >= 2) cps += 500 / 3600;
    for (const c of bs.clients) {
      const netProfit = c.deposit * (rate - c.interestRate);
      if (netProfit > 0) cps += netProfit / 3600;
    }
  }
  if (biz.type === 'highway' && biz.highwayState) {
    for (const route of biz.highwayState.routes) {
      if (!route.built) continue;
      const traffic = route.baseTraffic * route.lanes * Math.max(0.1, 1 - route.tollPrice / 20);
      cps += (traffic * route.tollPrice) / 3600;
    }
  }
  if (biz.type === 'streaming' && biz.streamingState) {
    const ss = biz.streamingState;
    cps += ss.subscribers * ss.subscriptionPrice / 3600;
    if (ss.adNetwork) cps += ss.subscribers * 2 / 3600;
    cps -= ss.serverCostPerHour / 3600;
  }
  if (biz.type === 'security' && biz.securityState) {
    cps -= biz.securityState.agents.reduce((s: number, a: any) => s + a.salary, 0) / 3600;
  }
  if (biz.type === 'supermarket' && biz.supermarketState) {
    const sm = biz.supermarketState;
    const cashierCap = sm.cashiers * 50;
    let totalDemand = 0;
    const demands: number[] = [];
    for (const p of sm.products) {
      const priceFactor = Math.max(0.1, 1 - (p.retailPrice - p.wholesalePrice * 2) / (p.wholesalePrice * 3));
      const demand = p.stock > 0 ? p.salesRate * priceFactor : 0;
      demands.push(demand);
      totalDemand += demand;
    }
    const tpRatio = totalDemand > 0 ? Math.min(1, cashierCap / totalDemand) : 1;
    for (let j = 0; j < sm.products.length; j++) {
      cps += (demands[j] * tpRatio * sm.products[j].retailPrice) / 3600;
    }
    cps -= (sm.cashiers * sm.cashierSalary) / 3600;
  }
  if (biz.type === 'oil' && biz.oilState) {
    // Oil: maintenance only, no auto-sell
    const maintenance = biz.oilState.drillingSites.reduce((s: number, site: any) => s + (site.built ? site.machines * 5000 : 0), 0);
    cps -= maintenance / 3600;
  }
  if (biz.type === 'production' && biz.productionState) {
    cps -= (biz.productionState.workers * biz.productionState.workerSalary) / 3600;
  }
  if (biz.type === 'factory' && biz.factoryState) {
    cps -= (biz.factoryState.workers * biz.factoryState.workerSalary) / 3600;
  }
  if (biz.type === 'airline' && biz.airlineState) {
    const al = biz.airlineState;
    const rSupply: Record<string, number> = {};
    for (const plane of al.planes) {
      if (!plane.routeId) continue;
      const route = al.routes.find((r: any) => r.id === plane.routeId);
      if (!route) continue;
      const tH = (route.distance * 2 / plane.speed) + 1;
      rSupply[route.id] = (rSupply[route.id] || 0) + plane.capacity * (24 / tH);
    }
    for (const plane of al.planes) {
      if (!plane.routeId) { cps -= plane.maintenancePerH * 0.3 / 3600; continue; }
      const route = al.routes.find((r: any) => r.id === plane.routeId);
      if (!route) continue;
      const tH = (route.distance * 2 / plane.speed) + 1;
      const fPerH = 1 / tH;
      const bP = route.distance * 0.05 + 50;
      const pF = Math.max(0.1, 2 - route.ticketPrice / bP);
      const lF = Math.min(0.95, (route.demand * pF) / (rSupply[route.id] || 1));
      const fM = al.fuelEfficiency ? 0.8 : 1;
      cps += (plane.capacity * lF * route.ticketPrice * fPerH) / 3600;
      cps -= (plane.fuelPerKm * route.distance * 2 * fPerH * fM + plane.maintenancePerH) / 3600;
    }
  }
  if (biz.type === 'casino' && biz.casinoState) {
    const cs2 = biz.casinoState;
    let occ = 0.5;
    if (cs2.upgrades.security) occ += 0.15;
    if (cs2.upgrades.freeBar) occ += 0.10;
    if (cs2.upgrades.loyalty) occ += 0.20;
    occ = Math.min(0.95, occ);
    const dealerTables = cs2.tables.filter((t: any) => { const info = [{ type: 'slots', needsDealer: false }, { type: 'blackjack', needsDealer: true }, { type: 'poker', needsDealer: true }, { type: 'roulette', needsDealer: true }, { type: 'baccarat', needsDealer: true }].find((ct: any) => ct.type === t.type); return info?.needsDealer; }).reduce((s: number, t: any) => s + t.count, 0);
    const dealerRatio = dealerTables > 0 ? Math.min(1, cs2.dealers / dealerTables) : 1;
    const vipMult = cs2.upgrades.vipLounge ? 1.25 : 1;
    const revPerH = [{ type: 'slots', r: 200 }, { type: 'blackjack', r: 500 }, { type: 'poker', r: 800 }, { type: 'roulette', r: 700 }, { type: 'baccarat', r: 1200 }];
    for (const t of cs2.tables) {
      const info = revPerH.find((ct: any) => ct.type === t.type);
      const needsD = ['blackjack', 'poker', 'roulette', 'baccarat'].includes(t.type);
      const eff = needsD ? dealerRatio : 1;
      cps += (t.count * (info?.r || 200) * occ * eff * vipMult) / 3600;
    }
    cps -= (cs2.dealers * cs2.dealerSalary) / 3600;
  }
  if (biz.type === 'nightclub' && biz.nightClubState) {
    const nc = biz.nightClubState;
    let q = 30;
    const avgDJ = nc.djs.length > 0 ? nc.djs.reduce((s: number, d: any) => s + d.quality, 0) / nc.djs.length : 0;
    q += avgDJ * 4;
    if (nc.upgrades.soundSystem) q += 20;
    if (nc.upgrades.lighting) q += 15;
    if (nc.upgrades.smokeMachine) q += 10;
    q = Math.min(100, q);
    const capM = nc.upgrades.rooftop ? 1.3 : 1;
    const effCap = nc.capacity * capM;
    const ncOcc = Math.min(0.95, q * 0.01 * Math.max(0.2, 2 - nc.entryFee / 30));
    const nightly = effCap * ncOcc;
    const entryRev = nightly * nc.entryFee;
    const drinkRev = Math.min(nightly * 2, nc.drinkStock) * nc.drinkPrice;
    cps += (entryRev + drinkRev) / (6 * 3600);
    cps -= (nc.djs.reduce((s: number, d: any) => s + d.salary, 0) + nc.bartenders * nc.bartenderSalary) / 3600;
  }
  return cps * 3600;
}

export { calcBizHourlyIncome };

export function StatsScreen() {
  const { state } = useGame();

  const totalCps = calcCashPerSec(state);
  const hourlyIncome = totalCps * 3600;
  const dailyIncome = hourlyIncome * 24;
  const playTime = Date.now() - state.gameStarted;
  const playDays = Math.floor(playTime / 86400000);
  const playHours = Math.floor((playTime % 86400000) / 3600000);

  const bizBreakdown = useMemo(() =>
    state.businesses.map(biz => {
      const info = BUSINESS_TYPES.find(b => b.type === biz.type);
      const hourly = calcBizHourlyIncome(biz, state);
      return { id: biz.id, name: biz.name, type: biz.type, icon: info?.icon || '🏢', hourly };
    }).sort((a, b) => b.hourly - a.hourly),
    [state.businesses]
  );

  // Fake historical revenue data for chart
  const chartData = useMemo(() => {
    const pts = [];
    const now = Date.now();
    for (let i = 23; i >= 0; i--) {
      const h = new Date(now - i * 3600000).getHours();
      const jitter = 0.7 + Math.random() * 0.6;
      pts.push({ hour: `${h}:00`, income: Math.round(hourlyIncome * jitter) });
    }
    return pts;
  }, [hourlyIncome]);

  return (
    <div className="h-full overflow-y-auto pb-4">
      {/* Summary Cards */}
      <div className="px-4 pt-4 space-y-3">
        <div className="game-card text-center py-5 animate-scale-in" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--primary) / 0.02))' }}>
          <div className="text-xs text-muted-foreground mb-1">Total Earned (Lifetime)</div>
          <div className="text-2xl font-bold tabular-nums text-gain">{formatCash(state.totalEarned)}</div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="game-card text-center py-3">
            <div className="text-[10px] text-muted-foreground mb-0.5">Per Hour</div>
            <div className="text-sm font-bold tabular-nums text-gain">{formatCash(hourlyIncome)}</div>
          </div>
          <div className="game-card text-center py-3">
            <div className="text-[10px] text-muted-foreground mb-0.5">Per Day</div>
            <div className="text-sm font-bold tabular-nums text-gain">{formatCash(dailyIncome)}</div>
          </div>
          <div className="game-card text-center py-3">
            <div className="text-[10px] text-muted-foreground mb-0.5">Play Time</div>
            <div className="text-sm font-bold tabular-nums">{playDays}d {playHours}h</div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="game-card p-3">
          <div className="text-xs font-semibold mb-2">📊 Revenue (Last 24h)</div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="hour" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval={5} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [formatCash(v), 'Revenue']}
                />
                <Area type="monotone" dataKey="income" stroke="hsl(var(--primary))" fill="url(#revGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* General Stats */}
        <div className="game-card p-3">
          <div className="text-xs font-semibold mb-2">📈 General Stats</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Current Cash</span><span className="font-semibold">{formatCash(state.cash)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Businesses Owned</span><span className="font-semibold">{state.businesses.length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Assets Owned</span><span className="font-semibold">{(state.ownedAssets || []).length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Islands Owned</span><span className="font-semibold">{(state.ownedIslands || []).length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tap Power</span><span className="font-semibold">${state.tapPower}/tap</span></div>
          </div>
        </div>

        {/* Business Breakdown */}
        <div className="game-card p-3">
          <div className="text-xs font-semibold mb-2">🏢 Income by Business</div>
          {bizBreakdown.length === 0 && <div className="text-xs text-muted-foreground text-center py-3">No businesses yet</div>}
          <div className="space-y-2">
            {bizBreakdown.map(biz => (
              <div key={biz.id} className="flex items-center gap-2">
                <span className="text-lg">{biz.icon}</span>
                <span className="text-xs flex-1 truncate">{biz.name}</span>
                <span className={`text-xs font-bold tabular-nums ${biz.hourly >= 0 ? 'text-gain' : 'text-loss'}`}>
                  {biz.hourly >= 0 ? '+' : ''}{formatCash(biz.hourly)}/h
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
