import React, { useState } from 'react';
import { useGame } from '../../game/GameContext';
import { formatCash } from '../../game/GameContext';
import { BUSINESS_TYPES } from '../../game/GameState';
import { useSounds } from '../../hooks/use-sounds';
import { CafeScreen } from './businesses/CafeScreen';
import { AgencyScreen } from './businesses/AgencyScreen';
import { RealEstateScreen } from './businesses/RealEstateScreen';
import { EcommerceScreen } from './businesses/EcommerceScreen';
import { CryptoScreen } from './businesses/CryptoScreen';
import { BankScreen } from './businesses/BankScreen';
import { HighwayScreen } from './businesses/HighwayScreen';
import { SupermarketScreen } from './businesses/SupermarketScreen';
import { StreamingScreen } from './businesses/StreamingScreen';
import { SecurityScreen } from './businesses/SecurityScreen';
import { OilScreen } from './businesses/OilScreen';
import { ProductionScreen } from './businesses/ProductionScreen';
import { FactoryScreen } from './businesses/FactoryScreen';
import { AirlineScreen } from './businesses/AirlineScreen';
import { CasinoScreen } from './businesses/CasinoScreen';
import { NightClubScreen } from './businesses/NightClubScreen';

interface Props {
  bizId: string;
  onBack: () => void;
}

export function BusinessDetailScreen({ bizId, onBack }: Props) {
  const { state, dispatch } = useGame();
  const biz = state.businesses.find(b => b.id === bizId);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const { click: soundClick, nav: soundNav } = useSounds();

  if (!biz) return <div className="p-4 text-muted-foreground">Business not found</div>;

  const info = BUSINESS_TYPES.find(b => b.type === biz.type);
  const accentColor = info?.color || '142 71% 45%';

  const handleRename = () => {
    if (editName.trim()) {
      dispatch({ type: 'RENAME_BUSINESS', bizId, name: editName.trim() });
    }
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: `hsl(${accentColor} / 0.04)` }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-3"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))', backgroundColor: `hsl(${accentColor} / 0.08)` }}>
        <button onClick={() => { soundNav(); onBack(); }} className="text-xl w-8 h-8 flex items-center justify-center" style={{ color: `hsl(${accentColor})` }}>←</button>
        <span className="text-2xl">{info?.icon}</span>
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex gap-2">
              <input value={editName} onChange={e => setEditName(e.target.value)}
                className="bg-muted rounded-lg px-2 py-1 text-sm font-bold flex-1 min-w-0"
                autoFocus onBlur={handleRename} onKeyDown={e => e.key === 'Enter' && handleRename()} />
            </div>
          ) : (
            <button onClick={() => { setEditName(biz.name); setIsEditing(true); }} className="text-left">
              <div className="font-bold text-sm truncate">{biz.name} ✏️</div>
              <div className="text-xs text-muted-foreground">{info?.name}</div>
            </button>
          )}
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold" style={{ color: `hsl(${accentColor})` }}>{formatCash(state.cash)}</div>
        </div>
      </div>

      {/* Business-specific content */}
      <div className="flex-1 overflow-y-auto">
        {biz.type === 'cafe' && <CafeScreen biz={biz} />}
        {biz.type === 'agency' && <AgencyScreen biz={biz} />}
        {biz.type === 'realestate' && <RealEstateScreen biz={biz} />}
        {biz.type === 'ecommerce' && <EcommerceScreen biz={biz} />}
        {biz.type === 'crypto' && <CryptoScreen biz={biz} />}
        {biz.type === 'bank' && <BankScreen biz={biz} />}
        {biz.type === 'highway' && <HighwayScreen biz={biz} />}
        {biz.type === 'supermarket' && <SupermarketScreen biz={biz} />}
        {biz.type === 'streaming' && <StreamingScreen biz={biz} />}
        {biz.type === 'security' && <SecurityScreen biz={biz} />}
        {biz.type === 'oil' && <OilScreen biz={biz} />}
        {biz.type === 'production' && <ProductionScreen biz={biz} />}
        {biz.type === 'factory' && <FactoryScreen biz={biz} />}
        {biz.type === 'airline' && <AirlineScreen biz={biz} />}
        {biz.type === 'casino' && <CasinoScreen biz={biz} />}
        {biz.type === 'nightclub' && <NightClubScreen biz={biz} />}
      </div>
    </div>
  );
}
