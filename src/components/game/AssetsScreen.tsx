import React, { useState } from 'react';
import { useGame, formatCash } from '../../game/GameContext';
import { useHaptics } from '../../hooks/use-haptics';
import { AssetItem, VEHICLE_DATA, COLLECTION_CATEGORIES, ISLAND_DATA, IslandItem } from '../../game/AssetsData';
import { ISLAND_BUILDING_DEFS } from '../../game/GameState';

type DetailView = { category: string; items: AssetItem[] } | null;
type DetailTab = 'buy' | 'owned';

export function AssetsScreen() {
  const { state, dispatch } = useGame();
  const { tap, light } = useHaptics();
  const [detail, setDetail] = useState<DetailView>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('buy');
  const [islandView, setIslandView] = useState(false);
  const [editingIsland, setEditingIsland] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const ownedAssets = state.ownedAssets || [];
  const ownedIslands = state.ownedIslands || [];

  const allItems = [
    ...VEHICLE_DATA.cars, ...VEHICLE_DATA.yachts, ...VEHICLE_DATA.planes,
    ...COLLECTION_CATEGORIES.flatMap(c => c.items),
  ];
  const islandValue = ownedIslands.reduce((sum, i) => {
    const item = ISLAND_DATA.find(d => d.id === i.id);
    return sum + (item?.price || 0);
  }, 0);
  const totalValue = ownedAssets.reduce((sum, id) => {
    const item = allItems.find(a => a.id === id);
    return sum + (item?.price || 0);
  }, 0) + islandValue;
  const totalOwned = ownedAssets.length + ownedIslands.length;

  const vehicleTypes = [
    { key: 'cars', icon: '🚗', label: 'Cars', items: VEHICLE_DATA.cars },
    { key: 'yachts', icon: '🛥️', label: 'Yachts', items: VEHICLE_DATA.yachts },
    { key: 'planes', icon: '✈️', label: 'Jets', items: VEHICLE_DATA.planes },
  ];

  const ownedCount = (items: AssetItem[]) => ownedAssets.filter(id => items.some(i => i.id === id)).length;

  const handleBuy = (item: AssetItem) => {
    if (state.cash < item.price) return;
    dispatch({ type: 'BUY_ASSET', assetId: item.id, cost: item.price });
    tap();
  };

  const handleBuyIsland = (island: IslandItem) => {
    if (state.cash < island.price) return;
    if (ownedIslands.some(i => i.id === island.id)) return;
    dispatch({ type: 'BUY_ISLAND', islandId: island.id, name: island.name, cost: island.price });
    tap();
  };

  const handleRenameIsland = (islandId: string) => {
    if (editName.trim()) {
      dispatch({ type: 'RENAME_ISLAND', islandId, name: editName.trim() });
    }
    setEditingIsland(null);
  };

  const [selectedIsland, setSelectedIsland] = useState<string | null>(null);

  if (islandView) {
    const selIsland = selectedIsland ? ownedIslands.find(i => i.id === selectedIsland) : null;
    const selIslandData = selIsland ? ISLAND_DATA.find(d => d.id === selIsland.id) : null;

    // Island detail view with buildings
    if (selIsland && selIslandData) {
      const buildings = selIsland.buildings || [];
      return (
        <div className="h-full flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-3 bg-card">
            <button onClick={() => setSelectedIsland(null)} className="text-xl w-8 h-8 flex items-center justify-center text-primary">←</button>
            <h2 className="font-bold text-sm">🏝️ {selIsland.customName}</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="game-card overflow-hidden">
              <img src={selIslandData.image} alt={selIslandData.name} className="w-full h-32 object-cover" />
              <div className="p-3">
                {editingIsland === selIsland.id ? (
                  <div className="flex gap-1 mb-2">
                    <input value={editName} onChange={e => setEditName(e.target.value)}
                      className="bg-muted rounded-lg px-2 py-1 text-sm font-semibold flex-1 min-w-0" autoFocus
                      onBlur={() => handleRenameIsland(selIsland.id)}
                      onKeyDown={e => e.key === 'Enter' && handleRenameIsland(selIsland.id)} />
                  </div>
                ) : (
                  <button onClick={() => { setEditingIsland(selIsland.id); setEditName(selIsland.customName); }} className="text-left mb-1">
                    <div className="font-bold text-sm">{selIsland.customName} ✏️</div>
                  </button>
                )}
                <div className="text-xs text-muted-foreground">{selIslandData.subtitle} • {selIslandData.size}</div>
              </div>
            </div>

            {/* Built structures */}
            {buildings.filter(b => b.built).length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground mb-2">BUILT</h3>
                {buildings.filter(b => b.built).map(b => (
                  <div key={b.id} className="game-card mb-2 flex items-center gap-3 p-3">
                    <span className="text-2xl">{b.icon}</span>
                    <div className="flex-1">
                      <div className="text-xs font-semibold">{b.name}</div>
                      {b.incomePerHour > 0 && <div className="text-[10px] text-gain">+{formatCash(b.incomePerHour)}/h</div>}
                    </div>
                    <span className="text-xs text-gain">✅</span>
                  </div>
                ))}
              </div>
            )}

            {/* Building in progress */}
            {buildings.filter(b => b.building).map(b => {
              const timeLeft = Math.max(0, (b.buildReadyAt || 0) - Date.now());
              return (
                <div key={b.id} className="game-card p-3 flex items-center gap-3">
                  <span className="text-2xl animate-bounce">{b.icon}</span>
                  <div className="flex-1">
                    <div className="text-xs font-semibold">{b.name}</div>
                    <div className="text-[10px] text-muted-foreground">⏱️ {Math.ceil(timeLeft / 60000)}m remaining</div>
                  </div>
                </div>
              );
            })}

            {/* Available to build */}
            <h3 className="text-xs font-semibold text-muted-foreground mb-2">BUILD</h3>
            {ISLAND_BUILDING_DEFS.filter(def => !buildings.some(b => b.type === def.type)).map(def => (
              <div key={def.type} className="game-card p-3 flex items-center gap-3">
                <span className="text-2xl">{def.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold">{def.name}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {def.incomePerHour > 0 ? `+${formatCash(def.incomePerHour)}/h` : 'Prestige'}
                  </div>
                </div>
                <button onClick={() => { dispatch({ type: 'ISLAND_BUILD', islandId: selIsland.id, buildingType: def.type }); tap(); }}
                  disabled={state.cash < def.baseCost}
                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                    state.cash >= def.baseCost ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                  {formatCash(def.baseCost)}
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Islands list view
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-3 bg-card">
          <button onClick={() => setIslandView(false)} className="text-xl w-8 h-8 flex items-center justify-center text-primary">←</button>
          <h2 className="font-bold text-sm">🏝️ Islands</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {ownedIslands.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-muted-foreground mb-2">YOUR ISLANDS ({ownedIslands.length})</h3>
              {ownedIslands.map((owned, i) => {
                const island = ISLAND_DATA.find(d => d.id === owned.id);
                if (!island) return null;
                const buildingCount = (owned.buildings || []).filter(b => b.built).length;
                const islandIncome = (owned.buildings || []).filter(b => b.built).reduce((s, b) => s + b.incomePerHour, 0);
                return (
                  <button key={owned.id} onClick={() => setSelectedIsland(owned.id)}
                    className="game-card mb-2 w-full text-left animate-fade-in active:scale-95 transition-all"
                    style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}>
                    <div className="flex gap-3">
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <img src={island.image} alt={island.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{owned.customName}</div>
                        <div className="text-xs text-muted-foreground">{island.subtitle} • {island.size}</div>
                        <div className="text-[10px] text-muted-foreground">{buildingCount} buildings</div>
                        {islandIncome > 0 && <div className="text-[10px] text-gain font-semibold">+{formatCash(islandIncome)}/h</div>}
                      </div>
                      <span className="text-xs text-muted-foreground self-center">→</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <h3 className="text-xs font-semibold text-muted-foreground mb-2">AVAILABLE</h3>
          {ISLAND_DATA.filter(i => !ownedIslands.some(o => o.id === i.id)).map((island, i) => (
            <div key={island.id} className="game-card animate-fade-in" style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}>
              <div className="flex gap-3">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  <img src={island.image} alt={island.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{island.name}</div>
                  <div className="text-xs text-muted-foreground">{island.subtitle} • {island.size}</div>
                  <div className="text-sm font-bold mt-1">{formatCash(island.price)}</div>
                  <button onClick={() => handleBuyIsland(island)} disabled={state.cash < island.price}
                    className={`mt-1.5 text-xs py-1 px-3 rounded-lg font-semibold transition-all active:scale-95 ${
                      state.cash >= island.price ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                    Buy
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (detail) {
    const ownedInCategory = ownedAssets.filter(id => detail.items.some(i => i.id === id));
    const ownedGrouped = detail.items
      .map(item => ({ item, count: ownedInCategory.filter(id => id === item.id).length }))
      .filter(g => g.count > 0);

    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-3 bg-card">
          <button onClick={() => setDetail(null)} className="text-xl w-8 h-8 flex items-center justify-center text-primary">←</button>
          <h2 className="font-bold text-sm">{detail.category}</h2>
        </div>

        <div className="flex border-b border-border bg-card">
          <button
            onClick={() => setDetailTab('buy')}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${detailTab === 'buy' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
          >
            🛒 Buy
          </button>
          <button
            onClick={() => setDetailTab('owned')}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${detailTab === 'owned' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
          >
            ✅ Owned ({ownedInCategory.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {detailTab === 'buy' && detail.items.map((item, i) => (
            <div key={item.id} className="game-card animate-fade-in" style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}>
              <div className="flex gap-3">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{item.name}</div>
                  {item.subtitle && <div className="text-xs text-muted-foreground">{item.subtitle}</div>}
                  <div className="text-sm font-bold mt-1">{formatCash(item.price)}</div>
                  <button
                    onClick={() => handleBuy(item)}
                    disabled={state.cash < item.price}
                    className={`mt-1.5 text-xs py-1 px-3 rounded-lg font-semibold transition-all active:scale-95 ${
                      state.cash >= item.price
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    Buy
                  </button>
                </div>
              </div>
            </div>
          ))}

          {detailTab === 'owned' && ownedGrouped.length === 0 && (
            <div className="text-center text-muted-foreground py-8 text-sm">
              <div className="text-3xl mb-2">📦</div>
              No items yet. Start buying!
            </div>
          )}

          {detailTab === 'owned' && ownedGrouped.map(({ item, count }, i) => (
            <div key={item.id} className="game-card animate-fade-in" style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}>
              <div className="flex gap-3">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{item.name}</div>
                  {item.subtitle && <div className="text-xs text-muted-foreground">{item.subtitle}</div>}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-bold">{formatCash(item.price * count)}</span>
                    {count > 1 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">×{count}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pb-4">
      {/* Estimated Value Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="game-card text-center py-5 animate-scale-in" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--primary) / 0.02))' }}>
          <div className="text-xs text-muted-foreground mb-1">Estimated Collection Value</div>
          <div className="text-2xl font-bold tabular-nums text-gain">{formatCash(totalValue)}</div>
          <div className="text-[10px] text-muted-foreground mt-1">
            {totalOwned} items owned
          </div>
        </div>
      </div>

      {/* Islands */}
      <div className="px-4 mb-4">
        <button
          onClick={() => { light(); setIslandView(true); }}
          className="game-card w-full flex items-center gap-3 py-3 active:scale-95 transition-all hover:shadow-md"
        >
          <span className="text-2xl">🏝️</span>
          <div className="text-left flex-1">
            <span className="text-xs font-semibold block">Private Islands</span>
            <span className="text-[10px] text-muted-foreground">{ownedIslands.length} owned</span>
          </div>
          <span className="text-xs text-muted-foreground">→</span>
        </button>
      </div>

      {/* Vehicles */}
      <div className="px-4 mb-4">
        <h3 className="text-sm font-bold mb-2">🚗 Vehicles</h3>
        <div className="grid grid-cols-3 gap-2">
          {vehicleTypes.map((vt, i) => (
            <button
              key={vt.key}
              onClick={() => { light(); setDetailTab('buy'); setDetail({ category: vt.label, items: vt.items }); }}
              className="game-card flex flex-col items-center py-4 active:scale-95 transition-all hover:shadow-md animate-fade-in"
              style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}
            >
              <span className="text-2xl mb-1">{vt.icon}</span>
              <span className="text-xs font-semibold">{vt.label}</span>
              <span className="text-[10px] text-muted-foreground">{ownedCount(vt.items)} owned</span>
            </button>
          ))}
        </div>
      </div>

      {/* Collections */}
      <div className="px-4">
        <h3 className="text-sm font-bold mb-2">🎨 Collections</h3>
        <div className="grid grid-cols-2 gap-2">
          {COLLECTION_CATEGORIES.map((cat, i) => (
            <button
              key={cat.key}
              onClick={() => { light(); setDetailTab('buy'); setDetail({ category: cat.label, items: cat.items }); }}
              className="game-card flex items-center gap-3 py-3 active:scale-95 transition-all hover:shadow-md animate-fade-in"
              style={{ animationDelay: `${(i + 3) * 80}ms`, animationFillMode: 'both' }}
            >
              <span className="text-2xl">{cat.icon}</span>
              <div className="text-left">
                <span className="text-xs font-semibold block">{cat.label}</span>
                <span className="text-[10px] text-muted-foreground">{ownedCount(cat.items)} owned</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
