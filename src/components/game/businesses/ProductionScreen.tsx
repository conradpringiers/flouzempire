import React, { useState } from 'react';
import { useGame, formatCash } from '../../../game/GameContext';
import { BusinessInstance, PRODUCTION_TYPES, FACTORY_TYPES } from '../../../game/GameState';
import { useHaptics } from '../../../hooks/use-haptics';

interface Props { biz: BusinessInstance; }

const PROD_UPGRADE_INFO = {
  efficiency: { name: '⚡ Efficiency', desc: '+25% production rate', costs: [8000, 20000, 50000], maxLevel: 3 },
  workerCapacity: { name: '👥 Worker Slots', desc: '+5 max workers (up to 50)', costs: [10000, 25000, 50000, 80000, 120000, 180000, 260000, 360000], maxLevel: 8 },
  harvestTech: { name: '🔧 Harvest Tech', desc: '-15% worker salary', costs: [6000, 15000, 40000], maxLevel: 3 },
};

export function ProductionScreen({ biz }: Props) {
  const { state, dispatch } = useGame();
  const { tap } = useHaptics();
  const ps = biz.productionState!;
  const pInfo = PRODUCTION_TYPES.find(p => p.type === ps.productionType)!;
  const [sellQty, setSellQty] = useState(50);

  const effMult = 1 + (ps.upgrades?.efficiency || 0) * 0.25;
  const salaryMult = 1 - (ps.upgrades?.harvestTech || 0) * 0.15;
  const totalProd = ps.workers * ps.productionRate * effMult;
  const totalSalary = ps.workers * ps.workerSalary * salaryMult;
  const storagePct = (ps.stored / ps.storageCapacity) * 100;

  const compatibleFactories = state.businesses.filter(b =>
    b.type === 'factory' && b.factoryState?.inputResource === ps.resourceType
  );

  const autoTarget = ps.upgrades?.autoExportTargetId;
  const autoTargetBiz = autoTarget ? state.businesses.find(b => b.id === autoTarget) : null;

  return (
    <div className="p-4 space-y-4">
      <div className="game-card p-3 text-center" style={{ background: 'linear-gradient(135deg, hsl(35 70% 45% / 0.1), hsl(35 70% 45% / 0.03))' }}>
        <div className="text-xs text-muted-foreground mb-1">{pInfo.resourceName} Stored</div>
        <div className="text-2xl font-bold">{pInfo.resourceIcon} {Math.floor(ps.stored).toLocaleString()} / {ps.storageCapacity.toLocaleString()}</div>
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-2">
          <div className="h-full bg-primary transition-all" style={{ width: `${storagePct}%` }} />
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Production: {totalProd.toFixed(1)}/h • Wages: {formatCash(totalSalary)}/h
        </div>
      </div>

      {/* Auto-Export Status */}
      {autoTargetBiz && (
        <div className="game-card p-2 flex items-center gap-2 bg-primary/10 border border-primary/20">
          <span className="text-lg">🔄</span>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold">Auto-exporting to {autoTargetBiz.name}</div>
            <div className="text-[10px] text-muted-foreground">Resources sent automatically</div>
          </div>
          <button onClick={() => { dispatch({ type: 'PRODUCTION_SET_AUTO_EXPORT', bizId: biz.id, targetBizId: undefined }); tap(); }}
            className="py-1 px-2 rounded text-[10px] bg-destructive/20 text-destructive font-semibold">
            Stop
          </button>
        </div>
      )}

      {/* Workers */}
      <div className="game-card p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold">👷 Workers ({ps.workers}/{ps.maxWorkers})</span>
          <span className="text-xs text-muted-foreground">{formatCash(ps.workerSalary * salaryMult)}/h each</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { dispatch({ type: 'PRODUCTION_HIRE', bizId: biz.id }); tap(); }}
            disabled={ps.workers >= ps.maxWorkers || state.cash < ps.workerSalary * 100}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
              ps.workers < ps.maxWorkers && state.cash >= ps.workerSalary * 100 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
            + Hire ({formatCash(ps.workerSalary * 100)})
          </button>
          <button onClick={() => { dispatch({ type: 'PRODUCTION_FIRE', bizId: biz.id }); tap(); }}
            disabled={ps.workers <= 0}
            className={`py-2 px-4 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
              ps.workers > 0 ? 'bg-destructive/20 text-destructive' : 'bg-muted text-muted-foreground'
            }`}>
            Fire
          </button>
        </div>
      </div>

      {/* Sell Raw */}
      <div className="game-card p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold">💰 Sell Raw {pInfo.resourceName}</span>
          <span className="text-xs text-muted-foreground">{formatCash(ps.rawSellPrice)}/unit</span>
        </div>
        <div className="flex gap-2 mb-2">
          {[50, 200, 500, Math.floor(ps.stored)].map((qty, i) => (
            <button key={i} onClick={() => setSellQty(Math.min(qty, Math.floor(ps.stored)))}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                sellQty === qty ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
              }`}>
              {i === 3 ? 'All' : qty}
            </button>
          ))}
        </div>
        <button onClick={() => { dispatch({ type: 'PRODUCTION_SELL', bizId: biz.id, amount: sellQty }); tap(); }}
          disabled={ps.stored < sellQty || sellQty <= 0}
          className={`w-full py-2 rounded-lg text-sm font-semibold transition-all active:scale-95 ${
            ps.stored >= sellQty && sellQty > 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
          Sell {sellQty} — {formatCash(sellQty * ps.rawSellPrice)}
        </button>
      </div>

      {/* Auto-Export to Factory */}
      {compatibleFactories.length > 0 && (
        <div className="game-card p-3">
          <div className="text-sm font-semibold mb-1">🔄 Auto-Export to Factory</div>
          <div className="text-[10px] text-muted-foreground mb-2">Resources are sent automatically every tick</div>
          {compatibleFactories.map(f => {
            const fs = f.factoryState!;
            const fInfo = FACTORY_TYPES.find(ft => ft.type === fs.factoryType);
            const isLinked = autoTarget === f.id;
            return (
              <div key={f.id} className={`flex items-center gap-2 mb-2 p-2 rounded-lg ${isLinked ? 'bg-primary/15 border border-primary/30' : 'bg-secondary/50'}`}>
                <span className="text-lg">{fInfo?.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate">{f.name}</div>
                  <div className="text-[10px] text-muted-foreground">
                    Input: {Math.floor(fs.inputStored)}/{fs.inputCapacity}
                  </div>
                </div>
                <button onClick={() => { dispatch({ type: 'PRODUCTION_SET_AUTO_EXPORT', bizId: biz.id, targetBizId: isLinked ? undefined : f.id }); tap(); }}
                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                    isLinked ? 'bg-destructive/20 text-destructive' : 'bg-primary text-primary-foreground'
                  }`}>
                  {isLinked ? 'Unlink' : 'Link'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {compatibleFactories.length === 0 && (
        <div className="game-card p-3 text-center text-muted-foreground text-xs">
          <div className="text-2xl mb-1">🏭</div>
          Buy a compatible factory to process {pInfo.resourceName} into higher-value goods!
        </div>
      )}

      {/* Upgrades */}
      <div className="game-card p-3">
        <div className="text-sm font-semibold mb-2">🔬 Upgrades</div>
        <div className="space-y-2">
          {(Object.keys(PROD_UPGRADE_INFO) as Array<keyof typeof PROD_UPGRADE_INFO>).map(key => {
            const info = PROD_UPGRADE_INFO[key];
            const level = ps.upgrades?.[key] || 0;
            const maxed = level >= info.maxLevel;
            const cost = maxed ? 0 : info.costs[level];
            const canAfford = state.cash >= cost;
            return (
              <div key={key} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold">{info.name} <span className="text-muted-foreground">Lv.{level}/{info.maxLevel}</span></div>
                  <div className="text-[10px] text-muted-foreground">{info.desc}</div>
                </div>
                <button onClick={() => { dispatch({ type: 'PRODUCTION_UPGRADE', bizId: biz.id, upgrade: key }); tap(); }}
                  disabled={maxed || !canAfford}
                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                    !maxed && canAfford ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                  {maxed ? 'MAX' : formatCash(cost)}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upgrade Storage */}
      <div className="game-card p-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">📦 Upgrade Storage</div>
            <div className="text-xs text-muted-foreground">{ps.storageCapacity} → {ps.storageCapacity + 500}</div>
          </div>
          <button onClick={() => { dispatch({ type: 'PRODUCTION_UPGRADE_STORAGE', bizId: biz.id }); tap(); }}
            disabled={state.cash < (ps.upgradeLevel + 1) * 10000}
            className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
              state.cash >= (ps.upgradeLevel + 1) * 10000 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
            {formatCash((ps.upgradeLevel + 1) * 10000)}
          </button>
        </div>
      </div>
    </div>
  );
}
