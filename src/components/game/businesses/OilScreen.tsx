import React, { useState } from 'react';
import { useGame, formatCash } from '../../../game/GameContext';
import { BusinessInstance, formatDuration } from '../../../game/GameState';
import { useHaptics } from '../../../hooks/use-haptics';

interface Props { biz: BusinessInstance; }

export function OilScreen({ biz }: Props) {
  const { state, dispatch } = useGame();
  const { tap, light } = useHaptics();
  const os = biz.oilState!;
  const [sellQty, setSellQty] = useState(100);

  const now = Date.now();
  const totalProduction = os.drillingSites
    .filter(s => s.built)
    .reduce((sum, s) => sum + s.machines * s.productionRate, 0);
  const totalMaintenance = os.drillingSites
    .filter(s => s.built)
    .reduce((sum, s) => sum + s.machines * 50, 0);

  return (
    <div className="p-4 space-y-4">
      {/* Overview */}
      <div className="game-card p-3 text-center" style={{ background: 'linear-gradient(135deg, hsl(30 80% 50% / 0.1), hsl(30 80% 50% / 0.03))' }}>
        <div className="text-xs text-muted-foreground mb-1">Oil Stored</div>
        <div className="text-2xl font-bold">🛢️ {Math.floor(os.oilStored).toLocaleString()} / {os.storageCapacity.toLocaleString()} bbl</div>
        <div className="text-xs text-muted-foreground mt-1">
          Production: {totalProduction.toFixed(1)} bbl/h • Maintenance: {formatCash(totalMaintenance)}/h
        </div>
      </div>

      {/* Sell Oil */}
      <div className="game-card p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold">💰 Sell Oil</span>
          <span className="text-xs text-muted-foreground">Price: {formatCash(os.oilSellPrice)}/bbl</span>
        </div>
        <div className="flex gap-2 mb-2">
          {[100, 500, 1000, Math.floor(os.oilStored)].map((qty, i) => (
            <button
              key={i}
              onClick={() => setSellQty(Math.min(qty, Math.floor(os.oilStored)))}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                sellQty === qty ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {i === 3 ? 'All' : qty.toLocaleString()}
            </button>
          ))}
        </div>
        <button
          onClick={() => { dispatch({ type: 'OIL_SELL', bizId: biz.id, quantity: sellQty }); tap(); }}
          disabled={os.oilStored < sellQty || sellQty <= 0}
          className={`w-full py-2 rounded-lg text-sm font-semibold transition-all active:scale-95 ${
            os.oilStored >= sellQty && sellQty > 0
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          Sell {sellQty.toLocaleString()} bbl — {formatCash(sellQty * os.oilSellPrice)}
        </button>
      </div>

      {/* Upgrade Storage */}
      <div className="game-card p-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">📦 Upgrade Storage</div>
            <div className="text-xs text-muted-foreground">Current: {os.storageCapacity.toLocaleString()} bbl → {(os.storageCapacity + 5000).toLocaleString()} bbl</div>
          </div>
          <button
            onClick={() => { dispatch({ type: 'OIL_UPGRADE_STORAGE', bizId: biz.id }); tap(); }}
            disabled={state.cash < os.storageUpgradeCost}
            className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
              state.cash >= os.storageUpgradeCost
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {formatCash(os.storageUpgradeCost)}
          </button>
        </div>
      </div>

      {/* Drilling Sites */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold">⛽ Drilling Sites ({os.drillingSites.length})</h3>
          <button
            onClick={() => { dispatch({ type: 'OIL_BUILD_SITE', bizId: biz.id }); tap(); }}
            disabled={state.cash < os.nextSiteCost}
            className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
              state.cash >= os.nextSiteCost
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            + New Site — {formatCash(os.nextSiteCost)}
          </button>
        </div>

        <div className="space-y-2">
          {os.drillingSites.map((site, i) => {
            const isBuilding = !site.built && site.buildReadyAt;
            const remaining = isBuilding ? Math.max(0, site.buildReadyAt! - now) : 0;
            const progress = isBuilding && site.buildStartedAt
              ? Math.min(100, ((now - site.buildStartedAt) / (site.buildReadyAt! - site.buildStartedAt)) * 100)
              : 0;

            return (
              <div key={site.id} className="game-card p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold">Site #{i + 1} — {site.name}</span>
                  {site.built && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gain/20 text-gain font-semibold">Active</span>
                  )}
                </div>

                {isBuilding ? (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">🏗️ Under construction — {formatDuration(remaining)}</div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                ) : site.built ? (
                  <div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {site.machines} machine{site.machines > 1 ? 's' : ''} • {(site.machines * site.productionRate).toFixed(1)} bbl/h
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { dispatch({ type: 'OIL_ADD_MACHINE', bizId: biz.id, siteId: site.id }); tap(); }}
                        disabled={state.cash < os.machineCost || site.machines >= site.maxMachines}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                          state.cash >= os.machineCost && site.machines < site.maxMachines
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        + Machine ({formatCash(os.machineCost)})
                      </button>
                      <div className="text-[10px] text-muted-foreground self-center">
                        {site.machines}/{site.maxMachines}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}

          {os.drillingSites.length === 0 && (
            <div className="text-center text-muted-foreground py-6 text-sm">
              <div className="text-3xl mb-2">🏜️</div>
              Build your first drilling site to start extracting oil!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
