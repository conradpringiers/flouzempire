import React, { useState } from 'react';
import { useGame, formatCash } from '../../../game/GameContext';
import { BusinessInstance, FACTORY_TYPES, PRODUCTION_TYPES } from '../../../game/GameState';
import { useHaptics } from '../../../hooks/use-haptics';

interface Props { biz: BusinessInstance; }

const FACTORY_UPGRADE_INFO = {
  efficiency: { name: '⚡ Efficiency', desc: '+25% conversion rate', costs: [12000, 30000, 75000], maxLevel: 3 },
  workerCapacity: { name: '👥 Worker Slots', desc: '+5 max workers (up to 50)', costs: [15000, 40000, 75000, 120000, 180000, 260000, 360000, 480000], maxLevel: 8 },
  automation: { name: '🤖 Automation', desc: '-15% worker salary', costs: [10000, 25000, 60000], maxLevel: 3 },
  qualityControl: { name: '✨ Quality Control', desc: '+20% sell price', costs: [20000, 50000, 120000], maxLevel: 3 },
};

export function FactoryScreen({ biz }: Props) {
  const { state, dispatch } = useGame();
  const { tap } = useHaptics();
  const fs = biz.factoryState!;
  const fInfo = FACTORY_TYPES.find(f => f.type === fs.factoryType)!;
  const [sellQty, setSellQty] = useState(50);

  const effMult = 1 + (fs.upgrades?.efficiency || 0) * 0.25;
  const salaryMult = 1 - (fs.upgrades?.automation || 0) * 0.15;
  const priceMult = 1 + (fs.upgrades?.qualityControl || 0) * 0.20;
  const processRate = fs.workers * fs.conversionRate * effMult;
  const totalSalary = fs.workers * fs.workerSalary * salaryMult;
  const inputPct = (fs.inputStored / fs.inputCapacity) * 100;
  const outputPct = (fs.outputStored / fs.outputCapacity) * 100;
  const effectiveSellPrice = fs.sellPrice * priceMult;

  const compatibleProductions = state.businesses.filter(b =>
    b.type === 'production' && b.productionState?.resourceType === fs.inputResource
  );

  return (
    <div className="p-4 space-y-4">
      {/* Overview */}
      <div className="game-card p-3" style={{ background: 'linear-gradient(135deg, hsl(200 50% 45% / 0.1), hsl(200 50% 45% / 0.03))' }}>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <div className="text-[10px] text-muted-foreground">Input ({fInfo.inputName})</div>
            <div className="text-lg font-bold">{Math.floor(fs.inputStored)}/{fs.inputCapacity}</div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-1">
              <div className="h-full bg-orange-400 transition-all" style={{ width: `${inputPct}%` }} />
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-muted-foreground">Output ({fs.outputName})</div>
            <div className="text-lg font-bold">{Math.floor(fs.outputStored)}/{fs.outputCapacity}</div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-1">
              <div className="h-full bg-primary transition-all" style={{ width: `${outputPct}%` }} />
            </div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground text-center mt-2">
          Processing: {processRate.toFixed(1)}/h • Wages: {formatCash(totalSalary)}/h
        </div>
      </div>

      {/* Auto-sell toggle */}
      <div className="game-card p-2 flex items-center gap-2">
        <span className="text-lg">🤑</span>
        <div className="flex-1">
          <div className="text-xs font-semibold">Auto-sell output</div>
          <div className="text-[10px] text-muted-foreground">Sells 50% when storage &gt; 80%</div>
        </div>
        <button onClick={() => { dispatch({ type: 'FACTORY_TOGGLE_AUTO_SELL', bizId: biz.id }); tap(); }}
          className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            fs.upgrades?.autoSell ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
          {fs.upgrades?.autoSell ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Workers */}
      <div className="game-card p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold">👷 Workers ({fs.workers}/{fs.maxWorkers})</span>
          <span className="text-xs text-muted-foreground">{formatCash(fs.workerSalary * salaryMult)}/h each</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { dispatch({ type: 'FACTORY_HIRE', bizId: biz.id }); tap(); }}
            disabled={fs.workers >= fs.maxWorkers || state.cash < fs.workerSalary * 100}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
              fs.workers < fs.maxWorkers && state.cash >= fs.workerSalary * 100 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
            + Hire ({formatCash(fs.workerSalary * 100)})
          </button>
          <button onClick={() => { dispatch({ type: 'FACTORY_FIRE', bizId: biz.id }); tap(); }}
            disabled={fs.workers <= 0}
            className={`py-2 px-4 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
              fs.workers > 0 ? 'bg-destructive/20 text-destructive' : 'bg-muted text-muted-foreground'
            }`}>
            Fire
          </button>
        </div>
      </div>

      {/* Linked Productions (info only) */}
      <div className="game-card p-3">
        <div className="text-sm font-semibold mb-2">📥 Input Sources</div>
        {compatibleProductions.length === 0 ? (
          <div className="text-center text-muted-foreground text-xs py-3">
            <div className="text-2xl mb-1">⛏️</div>
            Buy a {fInfo.inputName.toLowerCase()} production company to supply this factory!
          </div>
        ) : (
          compatibleProductions.map(p => {
            const prodState = p.productionState!;
            const pInfoP = PRODUCTION_TYPES.find(pt => pt.type === prodState.productionType);
            const isLinked = prodState.upgrades?.autoExportTargetId === biz.id;
            return (
              <div key={p.id} className={`flex items-center gap-2 mb-2 p-2 rounded-lg ${isLinked ? 'bg-primary/15 border border-primary/30' : 'bg-secondary/50'}`}>
                <span className="text-lg">{pInfoP?.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate">{p.name}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {isLinked ? '🔗 Auto-linked' : `Stock: ${Math.floor(prodState.stored)}`}
                  </div>
                </div>
                {!isLinked && (
                  <button onClick={() => { dispatch({ type: 'PRODUCTION_SET_AUTO_EXPORT', bizId: p.id, targetBizId: biz.id }); tap(); }}
                    className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-primary text-primary-foreground transition-all active:scale-95">
                    Link
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Sell Output */}
      <div className="game-card p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold">💎 Sell {fs.outputName}</span>
          <span className="text-xs text-muted-foreground">{formatCash(effectiveSellPrice)}/unit</span>
        </div>
        <div className="flex gap-2 mb-2">
          {[10, 50, 200, Math.floor(fs.outputStored)].map((qty, i) => (
            <button key={i} onClick={() => setSellQty(Math.min(qty, Math.floor(fs.outputStored)))}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                sellQty === qty ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
              }`}>
              {i === 3 ? 'All' : qty}
            </button>
          ))}
        </div>
        <button onClick={() => { dispatch({ type: 'FACTORY_SELL', bizId: biz.id, amount: sellQty }); tap(); }}
          disabled={fs.outputStored < sellQty || sellQty <= 0}
          className={`w-full py-2 rounded-lg text-sm font-semibold transition-all active:scale-95 ${
            fs.outputStored >= sellQty && sellQty > 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
          Sell {sellQty} {fs.outputName} — {formatCash(sellQty * effectiveSellPrice)}
        </button>
      </div>

      {/* Upgrades */}
      <div className="game-card p-3">
        <div className="text-sm font-semibold mb-2">🔬 Upgrades</div>
        <div className="space-y-2">
          {(Object.keys(FACTORY_UPGRADE_INFO) as Array<keyof typeof FACTORY_UPGRADE_INFO>).map(key => {
            const info = FACTORY_UPGRADE_INFO[key];
            const level = fs.upgrades?.[key] || 0;
            const maxed = level >= info.maxLevel;
            const cost = maxed ? 0 : info.costs[level];
            const canAfford = state.cash >= cost;
            return (
              <div key={key} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold">{info.name} <span className="text-muted-foreground">Lv.{level}/{info.maxLevel}</span></div>
                  <div className="text-[10px] text-muted-foreground">{info.desc}</div>
                </div>
                <button onClick={() => { dispatch({ type: 'FACTORY_UPGRADE', bizId: biz.id, upgrade: key }); tap(); }}
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
            <div className="text-xs text-muted-foreground">+500 input & output capacity</div>
          </div>
          <button onClick={() => { dispatch({ type: 'FACTORY_UPGRADE_STORAGE', bizId: biz.id }); tap(); }}
            disabled={state.cash < (fs.upgradeLevel + 1) * 15000}
            className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
              state.cash >= (fs.upgradeLevel + 1) * 15000 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
            {formatCash((fs.upgradeLevel + 1) * 15000)}
          </button>
        </div>
      </div>
    </div>
  );
}
