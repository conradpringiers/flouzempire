import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useGame, formatCash } from '../../game/GameContext';
import { BUSINESS_TYPES, StreamingCategory, BANK_INTEREST_RATES, PRODUCTION_TYPES, FACTORY_TYPES, getMaxBusinesses, HQ_COST, HQ_BUILD_TIME, HQ_UPGRADE_DEFS, PRODUCTION_NAMES, FACTORY_NAMES } from '../../game/GameState';
import { useHaptics } from '../../hooks/use-haptics';
import { useSounds } from '../../hooks/use-sounds';
import { calcBizHourlyIncome } from './StatsScreen';

const RANDOM_NAMES: Record<string, string[]> = {
  cafe: ['Café Nour', 'Bean & Brew', 'The Daily Grind', 'Café Lumière', 'Sip & Savor', 'Morning Bliss', 'Arabica House', 'Golden Cup', 'Café Zenith', 'The Roastery'],
  agency: ['CodeCraft Studio', 'PixelForge Labs', 'DevSphere', 'NexGen Digital', 'ByteWorks', 'Apex Code', 'InnoTech Agency', 'CloudPilot', 'Syntax Studio', 'LaunchPad Dev'],
  realestate: ['Prime Properties', 'Atlas Realty', 'Horizon Estates', 'Skyline Holdings', 'Crown Realty', 'Pinnacle Properties', 'Vista Real Estate', 'Elite Estates', 'Summit Realty', 'Golden Gate Properties'],
  ecommerce: ['SwiftCart', 'ShopNova', 'BazaarHub', 'TradeWave', 'ClickMart', 'NeonShop', 'FlashDeal', 'OrderFlow', 'MerchLine', 'BuyBlitz'],
  crypto: ['CryptoVault', 'BlockEdge Trading', 'ChainForge', 'MoonTrader', 'Satoshi Desk', 'AltCoin Lab', 'HashRate Capital', 'CoinPulse', 'DeFi Forge', 'TokenAxis'],
  bank: ['Atlas Capital', 'Meridian Bank', 'Sovereign Trust', 'Fortuna Finance', 'Apex Banking', 'Noble Vault', 'Crescent Bank', 'Heritage Trust', 'Zenith Capital', 'Ivory Bank'],
  highway: ['Atlas Highways', 'Sahara Routes', 'Royal Roads', 'Rif Express', 'Trans-Maroc', 'Meridian Roads', 'Crown Highways', 'Zenith Routes', 'Horizon Roads', 'Summit Highways'],
  supermarket: ['Quick Stop', 'Corner Market', 'Fresh Mart', 'Daily Goods', 'Handy Store', 'Atlas Market', 'Souk Express', 'Medina Mart', 'Atlas Provisions', 'City Grocery'],
  streaming: ['StreamVibe', 'FlowCast', 'WatchNova', 'PrimeStream', 'NeonPlay', 'VeloStream', 'CloudCast', 'StarStream', 'Flix Hub', 'PlayWave'],
  security: ['Iron Shield', 'Sentinel Force', 'Atlas Security', 'Guardian Elite', 'Fortress Group', 'Vanguard Security', 'Apex Protection', 'Steel Watch', 'Crown Guard', 'Titan Security'],
  oil: ['Sahara Oil Corp', 'Atlas Petroleum', 'Royal Drilling', 'Rif Energy', 'Souss Oil', 'Desert Barrel', 'Crown Petroleum', 'Zenith Drilling', 'Black Gold Corp', 'Titan Oil'],
  production: ['Atlas Mining Co', 'Green Fields', 'Royal Resources', 'Desert Harvest', 'Mountain Yield', 'Golden Plains', 'Sahara Extraction', 'Rif Resources', 'Terra Nova', 'Meridian Mining'],
  factory: ['Atlas Manufacturing', 'Crown Industries', 'Royal Works', 'Zenith Factory', 'Meridian Mill', 'Apex Production', 'Iron Crown', 'Desert Forge', 'Titan Works', 'Nova Manufacturing'],
  airline: ['Royal Air Plus', 'Atlas Airways', 'Sahara Airlines', 'Crown Air', 'Zenith Aviation', 'Meridian Airlines', 'Rif Air', 'Desert Wings', 'Nova Airlines', 'Apex Air'],
  casino: ['Golden Palace', 'Royal Casino', 'Neon Jackpot', 'Atlas Casino', 'Crown Royale', 'Sahara Luck', 'Zenith Gaming', 'Diamond Hall', 'Fortune House', 'Ace Casino'],
  nightclub: ['Club Neon', 'Midnight Lounge', 'Pulse Night', 'Velvet Underground', 'Studio 54 Maroc', 'Eclipse Club', 'Nova Nights', 'The Basement', 'Zenith Club', 'Skyline Lounge'],
};

const BUSINESS_TUTORIALS: Record<string, { emoji: string; title: string; steps: { icon: string; text: string }[] }> = {
  cafe: {
    emoji: '☕', title: 'Your Café Chain',
    steps: [
      { icon: '📍', text: 'Buy locations in different cities to expand your chain' },
      { icon: '👨‍🍳', text: 'Hire employees to keep each location running' },
      { icon: '📦', text: 'Keep stock (beans, milk, sugar, cups) filled up' },
      { icon: '💰', text: 'Adjust menu prices & upgrade locations for more profit' },
    ],
  },
  agency: {
    emoji: '💻', title: 'Your Programming Agency',
    steps: [
      { icon: '👥', text: 'Recruit developers, designers & managers for your team' },
      { icon: '📁', text: 'Accept client projects that match your team\'s skills' },
      { icon: '⚡', text: 'Assign employees to projects — they need enough Code, Design & Management' },
      { icon: '⏳', text: 'Projects take real time (30min-30h) but pay big rewards!' },
    ],
  },
  realestate: {
    emoji: '🏠', title: 'Your Real Estate Empire',
    steps: [
      { icon: '🏘️', text: 'Buy properties from the Moroccan market' },
      { icon: '🔨', text: 'Install upgrades to increase value and rental income' },
      { icon: '🔑', text: 'Rent out for passive income or flip for profit' },
      { icon: '📈', text: 'Property values appreciate slowly over time' },
    ],
  },
  ecommerce: {
    emoji: '📦', title: 'Your E-Commerce Store',
    steps: [
      { icon: '📋', text: 'Manage your product inventory and set prices' },
      { icon: '📬', text: 'Orders come in automatically — fulfill them on time!' },
      { icon: '⭐', text: 'Build reputation for more frequent orders' },
      { icon: '🚚', text: 'Upgrade shipping & warehouse for efficiency' },
    ],
  },
  crypto: {
    emoji: '📈', title: 'Your Crypto Trading Desk',
    steps: [
      { icon: '💹', text: 'Watch real-time price charts of volatile crypto coins' },
      { icon: '🛒', text: 'Buy low and sell high to make profit' },
      { icon: '⚠️', text: 'Prices are volatile — time your trades wisely!' },
      { icon: '🔬', text: 'Unlock advanced analytics for better insights' },
    ],
  },
  bank: {
    emoji: '🏦', title: 'Your Private Bank',
    steps: [
      { icon: '💵', text: 'Deposit capital to earn compound interest' },
      { icon: '🤝', text: 'Accept wealthy clients for management fees' },
      { icon: '📊', text: 'Upgrade your bank tier for better interest rates' },
      { icon: '💎', text: 'The most expensive but most passive income source' },
    ],
  },
  highway: {
    emoji: '🛣️', title: 'Your Highway Company',
    steps: [
      { icon: '🗺️', text: 'View the map and select two cities to build a highway between them' },
      { icon: '🏗️', text: 'Construction takes time — longer routes cost more and take longer' },
      { icon: '💰', text: 'Set toll prices — higher tolls mean fewer cars but more per vehicle' },
      { icon: '🚗', text: 'Upgrade lanes to increase traffic capacity and revenue' },
    ],
  },
  supermarket: {
    emoji: '🛒', title: 'Your Neighborhood Store',
    steps: [
      { icon: '📦', text: 'Stock your store with products from various categories' },
      { icon: '💲', text: 'Set retail prices — balance profit margins with demand' },
      { icon: '👥', text: 'Hire cashiers to handle more customers per hour' },
      { icon: '⬆️', text: 'Upgrade your store to increase stock capacity' },
    ],
  },
  streaming: {
    emoji: '🎬', title: 'Your Streaming Platform',
    steps: [
      { icon: '🛒', text: 'License content from the store to build your catalog' },
      { icon: '👥', text: 'Subscribers grow based on catalog quality vs. price' },
      { icon: '🖥️', text: 'Upgrade servers to support more subscribers' },
      { icon: '📺', text: 'Buy upgrades like recommendation engine and ad network' },
    ],
  },
  security: {
    emoji: '🛡️', title: 'Your Security Company',
    steps: [
      { icon: '👤', text: 'Recruit agents with combat, surveillance & driving skills' },
      { icon: '🎯', text: 'Form units by grouping agents together' },
      { icon: '⭐', text: 'Accept VIP missions from celebrities — units must meet score requirements' },
      { icon: '🔧', text: 'Buy equipment to boost all unit scores permanently' },
    ],
  },
  oil: {
    emoji: '🛢️', title: 'Your Oil & Petroleum Corp',
    steps: [
      { icon: '⛽', text: 'Build drilling sites to start extracting crude oil' },
      { icon: '⚙️', text: 'Add machines to each site to increase production rate' },
      { icon: '📦', text: 'Upgrade storage warehouses to hold more barrels' },
      { icon: '💰', text: 'Sell oil on the market for massive profits — millions!' },
    ],
  },
  production: {
    emoji: '⛏️', title: 'Your Production Company',
    steps: [
      { icon: '🏗️', text: 'Choose your production type: mine, farm, or quarry' },
      { icon: '👷', text: 'Hire workers to increase resource production rate' },
      { icon: '📦', text: 'Resources are stored locally — upgrade capacity as needed' },
      { icon: '💰', text: 'Sell raw resources or transfer to a factory for much higher profits' },
    ],
  },
  factory: {
    emoji: '🏭', title: 'Your Factory',
    steps: [
      { icon: '🔧', text: 'Choose your factory type — each uses a specific raw resource' },
      { icon: '📥', text: 'Import resources from your production businesses' },
      { icon: '👷', text: 'Workers convert raw materials into finished products' },
      { icon: '💎', text: 'Sell finished goods for much higher prices than raw materials' },
    ],
  },
  airline: {
    emoji: '✈️', title: 'Your Airline Company',
    steps: [
      { icon: '✈️', text: 'Buy planes from turboprops to jumbo jets' },
      { icon: '🗺️', text: 'Open routes between international cities' },
      { icon: '🎫', text: 'Set ticket prices and assign planes to routes' },
      { icon: '💰', text: 'Revenue depends on demand, price, and plane capacity' },
    ],
  },
  casino: {
    emoji: '🎰', title: 'Your Casino',
    steps: [
      { icon: '🎰', text: 'Buy gaming tables: slots, blackjack, poker, roulette' },
      { icon: '🤵', text: 'Hire dealers — each table with cards needs one' },
      { icon: '📈', text: 'Revenue depends on occupancy and house edge' },
      { icon: '⬆️', text: 'Upgrade with VIP lounge, security, and loyalty program' },
    ],
  },
  nightclub: {
    emoji: '🪩', title: 'Your Night Club',
    steps: [
      { icon: '🎧', text: 'Hire DJs to boost your event quality score' },
      { icon: '🍹', text: 'Stock your bar and set drink prices' },
      { icon: '🎫', text: 'Set entry fees — balance price vs occupancy' },
      { icon: '⬆️', text: 'Upgrade: sound system, lighting, rooftop terrace' },
    ],
  },
};

function getSubtypeLabel(biz: any): string | null {
  if (biz.type === 'production' && biz.productionState) {
    const pt = PRODUCTION_TYPES.find(p => p.type === biz.productionState.productionType);
    return pt ? `${pt.icon} ${pt.name}` : null;
  }
  if (biz.type === 'factory' && biz.factoryState) {
    const ft = FACTORY_TYPES.find(f => f.type === biz.factoryState.factoryType);
    return ft ? `${ft.icon} ${ft.name}` : null;
  }
  if (biz.type === 'streaming' && biz.streamingState) {
    const cats: Record<string, string> = { music: '🎵 Music', gaming: '🎮 Gaming', films: '🎬 Films' };
    return cats[biz.streamingState.category] || null;
  }
  return null;
}

interface Props {
  onManage: (bizId: string) => void;
}

export function BusinessesScreen({ onManage }: Props) {
  const { state, dispatch } = useGame();
  const [showModal, setShowModal] = useState(false);
  const [showCheat, setShowCheat] = useState(false);
  const [showHQ, setShowHQ] = useState(false);
  const [namingBiz, setNamingBiz] = useState<typeof BUSINESS_TYPES[number] | null>(null);
  const [bizName, setBizName] = useState('');
  const [showTutorial, setShowTutorial] = useState<string | null>(null);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showReset, setShowReset] = useState(false);
  const [streamingCat, setStreamingCat] = useState<StreamingCategory>('films');
  const [productionType, setProductionType] = useState('wheat_farm');
  const [factoryType, setFactoryType] = useState('bakery');
  const { tap, light } = useHaptics();
  const { click: soundClick, nav: soundNav, success: soundSuccess } = useSounds();

  const maxBiz = getMaxBusinesses(state);

  const rollRandomName = (type: string, subtype?: string) => {
    let names: string[];
    if (type === 'production' && subtype && PRODUCTION_NAMES[subtype]) {
      names = PRODUCTION_NAMES[subtype];
    } else if (type === 'factory' && subtype && FACTORY_NAMES[subtype]) {
      names = FACTORY_NAMES[subtype];
    } else {
      names = RANDOM_NAMES[type] || ['My Business'];
    }
    setBizName(names[Math.floor(Math.random() * names.length)]);
    light();
  };

  const handleBuy = (bt: typeof BUSINESS_TYPES[number]) => {
    if (state.cash < bt.cost || state.businesses.length >= maxBiz) return;
    setNamingBiz(bt);
    if (bt.type === 'production') {
      rollRandomName(bt.type, productionType);
    } else if (bt.type === 'factory') {
      rollRandomName(bt.type, factoryType);
    } else {
      rollRandomName(bt.type);
    }
    setShowModal(false);
  };

  const confirmBuy = () => {
    if (!namingBiz || !bizName.trim()) return;
    const isFirstOfType = !state.businesses.some(b => b.type === namingBiz.type);
    const seenTutorials = JSON.parse(localStorage.getItem('seen_tutorials') || '[]');
    const shouldShowTutorial = isFirstOfType && !seenTutorials.includes(namingBiz.type);

    dispatch({
      type: 'BUY_BUSINESS',
      bizType: namingBiz.type,
      name: bizName.trim(),
      streamingCategory: namingBiz.type === 'streaming' ? streamingCat : undefined,
      productionType: namingBiz.type === 'production' ? productionType : undefined,
      factoryType: namingBiz.type === 'factory' ? factoryType : undefined,
    });
    tap();
    soundSuccess();

    if (shouldShowTutorial) {
      setTutorialStep(0);
      setShowTutorial(namingBiz.type);
      localStorage.setItem('seen_tutorials', JSON.stringify([...seenTutorials, namingBiz.type]));
    }
    setNamingBiz(null);
  };

  const handleReset = () => {
    dispatch({ type: 'RESET_GAME' });
    setShowReset(false);
    tap();
  };

  const tutorial = showTutorial ? BUSINESS_TUTORIALS[showTutorial] : null;
  const hq = state.hq;
  const hqBuilding = hq?.building && hq?.buildReadyAt;
  const hqBuilt = hq?.built;
  const hqTimeLeft = hqBuilding ? Math.max(0, (hq.buildReadyAt || 0) - Date.now()) : 0;

  return (
    <div className="h-full overflow-y-auto pb-4">
      <div className="px-4 pt-4 flex gap-2">
        <button onClick={() => { setShowModal(true); }} className="btn-primary flex-1 text-center">
          + New Business ({state.businesses.length}/{maxBiz})
        </button>
        <button onClick={() => { setShowHQ(true); }}
          className={`btn-secondary text-xs whitespace-nowrap ${hqBuilt ? 'border-primary/30' : ''}`}>
          🏛️ HQ
        </button>
      </div>
      <div className="h-3" />

      {state.businesses.length === 0 && (
        <div className="px-4 text-center text-muted-foreground mt-12">
          <div className="text-4xl mb-3">🏢</div>
          <p>No businesses yet. Tap to earn cash and buy your first one!</p>
        </div>
      )}

      <div className="px-4 space-y-3">
        {state.businesses.map(biz => {
          const info = BUSINESS_TYPES.find(b => b.type === biz.type);
          const bgColor = info?.color ? `hsl(${info.color} / 0.08)` : undefined;
          const subtype = getSubtypeLabel(biz);
          return (
            <div key={biz.id} className="game-card flex items-center gap-3" style={{ backgroundColor: bgColor }}>
              <div className="text-3xl">{info?.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{biz.name}</div>
                <div className="text-xs text-muted-foreground">
                  {info?.name}{subtype ? ` • ${subtype}` : ''}
                </div>
                {(() => {
                  const hourly = calcBizHourlyIncome(biz, state);
                  return (
                    <div className={`text-[10px] font-semibold tabular-nums ${hourly >= 0 ? 'text-gain' : 'text-loss'}`}>
                      {hourly >= 0 ? '+' : ''}{formatCash(hourly)}/h
                    </div>
                  );
                })()}
              </div>
              <button onClick={() => { onManage(biz.id); }} className="btn-secondary text-xs">
                Manage →
              </button>
            </div>
          );
        })}
      </div>

      {/* Bottom: Cheat + Reset */}
      <div className="px-4 mt-6 flex gap-2">
        <button
          onClick={() => setShowCheat(true)}
          className="flex-1 py-2 rounded-xl text-xs font-medium text-muted-foreground border border-border hover:bg-secondary transition-colors"
        >
          🎮 Cheat
        </button>
        <button
          onClick={() => setShowReset(true)}
          className="flex-1 py-2 rounded-xl text-xs font-medium text-muted-foreground border border-border hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          🗑️ Reset
        </button>
      </div>

      {/* New Business Modal */}
      {showModal && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-background/80 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-[420px] bg-card rounded-t-2xl border-t border-border p-4 pb-8 max-h-[80vh] overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-4" />
            <h2 className="text-lg font-bold mb-1">New Business</h2>
            <p className="text-xs text-muted-foreground mb-4">{state.businesses.length}/{maxBiz} slots used{!hqBuilt ? ' • Build HQ to unlock more' : ''}</p>
            <div className="space-y-3">
              {[...BUSINESS_TYPES].sort((a, b) => a.cost - b.cost).map(bt => {
                const canBuy = state.cash >= bt.cost && state.businesses.length < maxBiz;
                return (
                  <div key={bt.type} className="game-card">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{bt.icon}</span>
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{bt.name}</div>
                        <div className="text-xs text-muted-foreground">{bt.desc}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleBuy(bt)}
                      disabled={!canBuy}
                      className={`w-full py-2 rounded-lg text-sm font-semibold ${
                        canBuy ? 'bg-primary text-primary-foreground active:scale-95 transition-transform' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      Buy — {formatCash(bt.cost)}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Naming Modal */}
      {namingBiz && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={() => setNamingBiz(null)}>
          <div className="w-[340px] bg-card rounded-2xl border border-border p-5 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">{namingBiz.icon}</div>
              <h2 className="text-lg font-bold">Name your {namingBiz.name}</h2>
              <p className="text-xs text-muted-foreground mt-1">Choose a name for your new business</p>
            </div>
            {namingBiz?.type === 'streaming' && (
              <div className="mb-4">
                <div className="text-xs font-semibold text-muted-foreground mb-2">Choose your specialty:</div>
                <div className="flex gap-2">
                  {([['music', '🎵', 'Music'], ['gaming', '🎮', 'Gaming'], ['films', '🎬', 'Films']] as const).map(([cat, icon, label]) => (
                    <button key={cat}
                      onClick={() => { setStreamingCat(cat); light(); }}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        streamingCat === cat ? 'bg-primary text-primary-foreground scale-105' : 'bg-secondary text-secondary-foreground'
                      }`}>
                      {icon} {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {namingBiz?.type === 'production' && (
              <div className="mb-4">
                <div className="text-xs font-semibold text-muted-foreground mb-2">Choose production type:</div>
                <div className="grid grid-cols-3 gap-2">
                  {PRODUCTION_TYPES.map(pt => (
                    <button key={pt.type} onClick={() => { setProductionType(pt.type); rollRandomName('production', pt.type); }}
                      className={`py-2 px-1 rounded-xl text-[10px] font-semibold transition-all flex flex-col items-center gap-1 ${
                        productionType === pt.type ? 'bg-primary text-primary-foreground scale-105' : 'bg-secondary text-secondary-foreground'
                      }`}>
                      <span className="text-lg">{pt.icon}</span>
                      {pt.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {namingBiz?.type === 'factory' && (
              <div className="mb-4">
                <div className="text-xs font-semibold text-muted-foreground mb-2">Choose factory type:</div>
                <div className="grid grid-cols-3 gap-2">
                  {FACTORY_TYPES.map(ft => (
                    <button key={ft.type} onClick={() => { setFactoryType(ft.type); rollRandomName('factory', ft.type); }}
                      className={`py-2 px-1 rounded-xl text-[10px] font-semibold transition-all flex flex-col items-center gap-1 ${
                        factoryType === ft.type ? 'bg-primary text-primary-foreground scale-105' : 'bg-secondary text-secondary-foreground'
                      }`}>
                      <span className="text-lg">{ft.icon}</span>
                      {ft.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2 mb-4">
              <input
                value={bizName}
                onChange={e => setBizName(e.target.value)}
                placeholder="Business name..."
                className="flex-1 bg-muted rounded-xl px-3 py-2.5 text-sm font-semibold min-w-0 focus:outline-none focus:ring-2 focus:ring-primary/50"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && confirmBuy()}
              />
              <button
                onClick={() => {
                  if (namingBiz.type === 'production') rollRandomName('production', productionType);
                  else if (namingBiz.type === 'factory') rollRandomName('factory', factoryType);
                  else rollRandomName(namingBiz.type);
                }}
                className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-lg active:scale-90 transition-transform hover:bg-secondary/80"
                title="Random name"
              >
                🎲
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setNamingBiz(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-secondary text-secondary-foreground">
                Cancel
              </button>
              <button
                onClick={confirmBuy}
                disabled={!bizName.trim()}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-transform active:scale-95 ${
                  bizName.trim() ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                Create — {formatCash(namingBiz.cost)}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Tutorial Overlay */}
      {showTutorial && tutorial && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-background/90 backdrop-blur-md">
          <div className="w-[340px] bg-card rounded-2xl border border-border p-6 animate-scale-in">
            <div className="text-center mb-5">
              <div className="text-5xl mb-3 animate-bounce">{tutorial.emoji}</div>
              <h2 className="text-xl font-bold">{tutorial.title}</h2>
              <p className="text-xs text-muted-foreground mt-1">Here's how it works</p>
            </div>
            <div className="space-y-3 mb-5">
              {tutorial.steps.map((step, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-xl transition-all duration-500"
                  style={{
                    backgroundColor: i <= tutorialStep ? 'hsl(var(--primary) / 0.08)' : 'hsl(var(--muted) / 0.3)',
                    opacity: i <= tutorialStep ? 1 : 0.4,
                    transform: i <= tutorialStep ? 'translateX(0)' : 'translateX(8px)',
                    transitionDelay: `${i * 100}ms`,
                  }}
                >
                  <span className="text-xl">{step.icon}</span>
                  <span className="text-sm flex-1">{step.text}</span>
                </div>
              ))}
            </div>
            {tutorialStep < tutorial.steps.length - 1 ? (
              <button
                onClick={() => { setTutorialStep(s => s + 1); light(); }}
                className="w-full py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground active:scale-95 transition-transform"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={() => { setShowTutorial(null); tap(); }}
                className="w-full py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground active:scale-95 transition-transform"
              >
                Let's Go! 🚀
              </button>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Reset Confirmation */}
      {showReset && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={() => setShowReset(false)}>
          <div className="w-[320px] bg-card rounded-2xl border border-border p-5 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">⚠️</div>
              <h2 className="text-lg font-bold">Reset Game?</h2>
              <p className="text-sm text-muted-foreground mt-2">This will erase all your progress, businesses, and money. This cannot be undone.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowReset(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-secondary text-secondary-foreground">
                Cancel
              </button>
              <button onClick={handleReset} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-destructive text-destructive-foreground active:scale-95 transition-transform">
                Reset Everything
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Cheat Menu Modal */}
      {showCheat && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={() => setShowCheat(false)}>
          <div className="w-[320px] bg-card rounded-2xl border border-border p-5 space-y-3 animate-scale-in" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-center">🎮 Cheat Menu</h2>
            <button onClick={() => { dispatch({ type: 'TICK', dt: 3600000 }); setShowCheat(false); }}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold active:scale-95 transition-transform">
              ⏩ Skip 1 hour
            </button>
            {[1000, 10000, 100000, 1000000].map(amount => (
              <button key={amount}
                className="w-full py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-semibold active:scale-95 transition-transform"
                onClick={() => {
                  const s = { ...state, cash: state.cash + amount, totalEarned: state.totalEarned + amount };
                  dispatch({ type: 'SET_STATE', state: s });
                  setShowCheat(false);
                }}>
                💰 +{formatCash(amount)}
              </button>
            ))}
            <button onClick={() => setShowCheat(false)} className="w-full py-2 text-sm text-muted-foreground">
              Close
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* HQ Modal */}
      {showHQ && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-background/80 backdrop-blur-sm" onClick={() => setShowHQ(false)}>
          <div className="w-full max-w-[420px] bg-card rounded-t-2xl border-t border-border p-4 pb-8 max-h-[85vh] overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-4" />
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">🏛️</div>
              <h2 className="text-xl font-bold">Headquarters</h2>
              <p className="text-xs text-muted-foreground mt-1">
                {!hq ? 'Build your corporate HQ to unlock powerful upgrades' :
                 hqBuilding ? 'Under construction...' : 'Upgrade your empire\'s command center'}
              </p>
            </div>

            {!hq && (
              <div className="game-card p-4 text-center">
                <div className="text-5xl mb-3">🏗️</div>
                <div className="text-sm font-semibold mb-1">Build Corporate HQ</div>
                <div className="text-xs text-muted-foreground mb-3">
                  Unlocks upgrades: more business slots, income boost, tap boost, and more offline time
                </div>
                <div className="text-xs text-muted-foreground mb-3">⏱️ Build time: 5 minutes</div>
                <button
                  onClick={() => { dispatch({ type: 'BUILD_HQ' }); tap(); soundSuccess(); }}
                  disabled={state.cash < HQ_COST}
                  style={{ touchAction: 'manipulation' }}
                  className={`relative z-10 w-full py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                    state.cash >= HQ_COST ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                  Build — {formatCash(HQ_COST)}
                </button>
              </div>
            )}

            {hqBuilding && (
              <div className="game-card p-4 text-center">
                <div className="text-5xl mb-3 animate-bounce">🏗️</div>
                <div className="text-sm font-semibold mb-1">Building in progress...</div>
                <div className="text-xs text-muted-foreground">
                  ⏱️ {Math.ceil(hqTimeLeft / 60000)}m remaining
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-3">
                  <div className="h-full bg-primary transition-all" style={{ width: `${Math.max(0, 100 - (hqTimeLeft / HQ_BUILD_TIME) * 100)}%` }} />
                </div>
              </div>
            )}

            {hqBuilt && (
              <div className="space-y-3">
                <div className="game-card p-3 text-center" style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--primary) / 0.02))' }}>
                  <div className="text-xs text-muted-foreground mb-1">Business Slots</div>
                  <div className="text-xl font-bold">{state.businesses.length} / {maxBiz}</div>
                </div>

                {HQ_UPGRADE_DEFS.map(def => {
                  const level = (hq!.upgrades as any)[def.key] || 0;
                  const maxed = level >= def.maxLevel;
                  const cost = maxed ? 0 : def.costs[level];
                  const canAfford = state.cash >= cost;
                  return (
                    <div key={def.key} className="game-card p-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold">{def.name} <span className="text-muted-foreground">Lv.{level}/{def.maxLevel}</span></div>
                        <div className="text-[10px] text-muted-foreground">{def.desc}</div>
                      </div>
                      <button
                        onClick={() => { dispatch({ type: 'HQ_UPGRADE', upgrade: def.key }); tap(); soundSuccess(); }}
                        disabled={maxed || !canAfford}
                        style={{ touchAction: 'manipulation' }}
                        className={`relative z-10 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                          !maxed && canAfford ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}>
                        {maxed ? 'MAX' : formatCash(cost)}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <button onClick={() => setShowHQ(false)} className="w-full mt-4 py-2 text-sm text-muted-foreground">
              Close
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
