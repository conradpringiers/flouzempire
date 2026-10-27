import React, { useState, useRef, useLayoutEffect } from 'react';
import { useGame, formatCash } from '../../../game/GameContext';
import { BusinessInstance } from '../../../game/GameState';
import { useHaptics } from '../../../hooks/use-haptics';
import { useSounds } from '../../../hooks/use-sounds';

const TABS = ['market', 'portfolio', 'history'] as const;
type Tab = typeof TABS[number];

export function CryptoScreen({ biz }: { biz: BusinessInstance }) {
  const { state, dispatch } = useGame();
  const cs = biz.cryptoState!;
  const [tab, setTab] = useState<Tab>('market');
  const [selectedCoin, setSelectedCoin] = useState<string | null>(null);
  const [buyAmount, setBuyAmount] = useState(1);
  const [sellAmount, setSellAmount] = useState(1);
  const { light, tap } = useHaptics();
  const { switchTab: soundSwitch } = useSounds();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const idx = TABS.indexOf(tab);
    const el = tabRefs.current[idx];
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [tab]);

  const accent = 'hsl(45 100% 50%)';

  const totalValue = cs.holdings.reduce((sum, h) => {
    const coin = cs.coins.find(c => c.id === h.coinId);
    return sum + (coin ? coin.price * h.amount : 0);
  }, 0);
  const totalInvested = cs.holdings.reduce((sum, h) => sum + h.avgBuyPrice * h.amount, 0);
  const totalPnL = totalValue - totalInvested;

  const selectedCoinData = cs.coins.find(c => c.id === selectedCoin);
  const selectedHolding = cs.holdings.find(h => h.coinId === selectedCoin);

  // Mini sparkline component
  const Sparkline = ({ history, height = 32, color }: { history: number[]; height?: number; color?: string }) => {
    const data = history.slice(-24);
    if (data.length < 2) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const isUp = data[data.length - 1] >= data[0];
    const lineColor = color || (isUp ? 'hsl(var(--gain))' : 'hsl(var(--loss))');
    
    const points = data.map((v, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="overflow-visible">
        <defs>
          <linearGradient id={`grad-${isUp ? 'up' : 'down'}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.2" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={`0,${height} ${points} 100,${height}`}
          fill={`url(#grad-${isUp ? 'up' : 'down'})`}
        />
        <polyline
          points={points}
          fill="none"
          stroke={lineColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  };

  // Trade modal for a selected coin
  if (selectedCoinData) {
    const change = selectedCoinData.history.length > 1 
      ? ((selectedCoinData.price - selectedCoinData.history[0]) / selectedCoinData.history[0]) * 100 
      : 0;
    const maxSell = selectedHolding?.amount || 0;

    return (
      <div className="flex flex-col h-full" style={{ backgroundColor: 'hsl(45 100% 50% / 0.04)' }}>
        <div className="px-4 py-3 border-b border-border flex items-center gap-3 bg-card">
          <button onClick={() => setSelectedCoin(null)} className="text-xl w-8 h-8 flex items-center justify-center" style={{ color: accent }}>←</button>
          <div className="flex-1">
            <h2 className="font-bold text-sm">{selectedCoinData.name}</h2>
            <span className="text-xs text-muted-foreground">{selectedCoinData.symbol}</span>
          </div>
          <div className="text-right">
            <div className="font-bold text-sm tabular-nums">{formatCash(selectedCoinData.price)}</div>
            <div className={`text-xs font-semibold ${change >= 0 ? 'text-gain' : 'text-loss'}`}>
              {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 tab-content-enter">
          {/* Chart */}
          <div className="game-card p-4">
            <Sparkline history={selectedCoinData.history} height={80} />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-2">
              <span>24 ticks ago</span>
              <span>Now</span>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="game-card text-center py-2">
              <div className="text-[10px] text-muted-foreground">Volatility</div>
              <div className="text-xs font-bold" style={{ color: selectedCoinData.volatility > 0.05 ? 'hsl(var(--loss))' : selectedCoinData.volatility > 0.02 ? 'hsl(var(--warning))' : 'hsl(var(--gain))' }}>
                {selectedCoinData.volatility > 0.05 ? '🔴 High' : selectedCoinData.volatility > 0.02 ? '🟡 Med' : '🟢 Low'}
              </div>
            </div>
            <div className="game-card text-center py-2">
              <div className="text-[10px] text-muted-foreground">You Hold</div>
              <div className="text-xs font-bold tabular-nums">{maxSell.toFixed(2)}</div>
            </div>
            <div className="game-card text-center py-2">
              <div className="text-[10px] text-muted-foreground">Value</div>
              <div className="text-xs font-bold tabular-nums">{formatCash(maxSell * selectedCoinData.price)}</div>
            </div>
          </div>

          {/* Buy Section */}
          <div className="game-card">
            <div className="text-xs font-semibold mb-2">Buy {selectedCoinData.symbol}</div>
            <div className="flex items-center gap-2 mb-3">
              {[1, 5, 10, 25].map(qty => (
                <button key={qty} onClick={() => { setBuyAmount(qty); light(); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                    buyAmount === qty ? 'text-white' : 'bg-secondary text-secondary-foreground'
                  }`}
                  style={buyAmount === qty ? { backgroundColor: accent, color: '#000' } : undefined}>
                  ×{qty}
                </button>
              ))}
            </div>
            <button
              onClick={() => { dispatch({ type: 'CRYPTO_BUY', bizId: biz.id, coinId: selectedCoinData.id, amount: buyAmount }); tap(); }}
              disabled={state.cash < selectedCoinData.price * buyAmount}
              className={`w-full py-3 rounded-xl text-sm font-bold active:scale-95 transition-transform ${
                state.cash >= selectedCoinData.price * buyAmount ? 'text-black' : 'bg-muted text-muted-foreground'
              }`}
              style={state.cash >= selectedCoinData.price * buyAmount ? { backgroundColor: accent } : undefined}>
              Buy {buyAmount} for {formatCash(selectedCoinData.price * buyAmount)}
            </button>
          </div>

          {/* Sell Section */}
          {maxSell > 0 && (
            <div className="game-card">
              <div className="text-xs font-semibold mb-2">Sell {selectedCoinData.symbol}</div>
              <div className="flex items-center gap-2 mb-3">
                {[1, 5, 10].filter(q => q <= maxSell).map(qty => (
                  <button key={qty} onClick={() => { setSellAmount(qty); light(); }}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                      sellAmount === qty ? 'bg-destructive text-destructive-foreground' : 'bg-secondary text-secondary-foreground'
                    }`}>
                    ×{qty}
                  </button>
                ))}
                <button onClick={() => { setSellAmount(Math.floor(maxSell)); light(); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                    sellAmount === Math.floor(maxSell) ? 'bg-destructive text-destructive-foreground' : 'bg-secondary text-secondary-foreground'
                  }`}>
                  All
                </button>
              </div>
              <button
                onClick={() => { dispatch({ type: 'CRYPTO_SELL', bizId: biz.id, coinId: selectedCoinData.id, amount: Math.min(sellAmount, maxSell) }); tap(); }}
                className="w-full py-3 rounded-xl text-sm font-bold bg-destructive text-destructive-foreground active:scale-95 transition-transform">
                Sell {Math.min(sellAmount, Math.floor(maxSell))} for {formatCash(selectedCoinData.price * Math.min(sellAmount, maxSell))}
              </button>
              {selectedHolding && (
                <div className={`text-center text-xs mt-2 font-semibold ${
                  selectedCoinData.price > selectedHolding.avgBuyPrice ? 'text-gain' : 'text-loss'
                }`}>
                  P&L: {selectedCoinData.price > selectedHolding.avgBuyPrice ? '+' : ''}{formatCash((selectedCoinData.price - selectedHolding.avgBuyPrice) * selectedHolding.amount)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'hsl(45 100% 50% / 0.04)' }}>
      {/* Summary Card */}
      <div className="px-4 py-3 bg-card/50 border-b border-border">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-[10px] text-muted-foreground">Portfolio Value</div>
            <div className="text-lg font-bold tabular-nums">{formatCash(totalValue)}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground">Total P&L</div>
            <div className={`text-lg font-bold tabular-nums ${totalPnL >= 0 ? 'text-gain' : 'text-loss'}`}>
              {totalPnL >= 0 ? '+' : ''}{formatCash(totalPnL)}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="relative flex border-b border-border bg-card">
        {TABS.map((t, i) => (
          <button key={t}
            ref={el => { tabRefs.current[i] = el; }}
            onClick={() => { light(); soundSwitch(); setTab(t); }}
            className="flex-1 py-2.5 text-xs font-semibold capitalize transition-colors duration-200"
            style={{ color: tab === t ? accent : 'hsl(var(--muted-foreground))' }}>
            {t === 'market' ? '📊 Market' : t === 'portfolio' ? '💼 Portfolio' : '📜 History'}
          </button>
        ))}
        <div className="absolute bottom-0 h-[2px] transition-all duration-300 ease-out"
          style={{ left: indicator.left, width: indicator.width, backgroundColor: accent }} />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 tab-content-enter" key={tab}>
        {tab === 'market' && cs.coins.map((coin, i) => {
          const change = coin.history.length > 1 ? ((coin.price - coin.history[0]) / coin.history[0]) * 100 : 0;
          const holding = cs.holdings.find(h => h.coinId === coin.id);
          return (
            <button key={coin.id}
              onClick={() => { setSelectedCoin(coin.id); setBuyAmount(1); setSellAmount(1); light(); }}
              className="game-card w-full text-left active:scale-[0.98] transition-transform animate-fade-in"
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
                  style={{ backgroundColor: `hsl(45 100% 50% / 0.15)`, color: accent }}>
                  {coin.symbol.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-sm">{coin.name}</div>
                      <div className="text-[10px] text-muted-foreground">{coin.symbol}{holding ? ` · ${holding.amount.toFixed(1)} held` : ''}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm tabular-nums">{formatCash(coin.price)}</div>
                      <div className={`text-[10px] font-semibold ${change >= 0 ? 'text-gain' : 'text-loss'}`}>
                        {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="mt-1.5">
                    <Sparkline history={coin.history} height={24} />
                  </div>
                </div>
              </div>
            </button>
          );
        })}

        {tab === 'portfolio' && (
          <>
            {cs.holdings.length === 0 && (
              <div className="text-center text-muted-foreground py-8 text-sm">
                <div className="text-3xl mb-2">📊</div>
                No holdings yet. Go to Market to start trading!
              </div>
            )}
            {cs.holdings.map((h, i) => {
              const coin = cs.coins.find(c => c.id === h.coinId);
              if (!coin) return null;
              const value = coin.price * h.amount;
              const pnl = value - h.avgBuyPrice * h.amount;
              const pnlPct = ((coin.price - h.avgBuyPrice) / h.avgBuyPrice) * 100;
              return (
                <button key={h.coinId}
                  onClick={() => { setSelectedCoin(h.coinId); light(); }}
                  className="game-card w-full text-left active:scale-[0.98] transition-transform animate-fade-in"
                  style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
                      style={{ backgroundColor: `hsl(45 100% 50% / 0.15)`, color: accent }}>
                      {coin.symbol.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{coin.name}</div>
                      <div className="text-[10px] text-muted-foreground">{h.amount.toFixed(2)} {coin.symbol} · Avg {formatCash(h.avgBuyPrice)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm tabular-nums">{formatCash(value)}</div>
                      <div className={`text-[10px] font-semibold ${pnl >= 0 ? 'text-gain' : 'text-loss'}`}>
                        {pnl >= 0 ? '+' : ''}{formatCash(pnl)} ({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%)
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </>
        )}

        {tab === 'history' && (
          <>
            {cs.tradeHistory.length === 0 && (
              <div className="text-center text-muted-foreground py-8 text-sm">
                <div className="text-3xl mb-2">📜</div>
                No trades yet
              </div>
            )}
            {[...cs.tradeHistory].reverse().slice(0, 30).map((trade, i) => {
              const coin = cs.coins.find(c => c.id === trade.coinId);
              return (
                <div key={i} className="game-card flex items-center gap-3 animate-fade-in"
                  style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    trade.type === 'buy' ? 'bg-primary/15 text-gain' : 'bg-destructive/15 text-loss'
                  }`}>
                    {trade.type === 'buy' ? '↓' : '↑'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs">{trade.type === 'buy' ? 'Bought' : 'Sold'} {trade.amount} {coin?.symbol}</div>
                    <div className="text-[10px] text-muted-foreground">@ {formatCash(trade.price)}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-bold ${trade.type === 'buy' ? 'text-loss' : 'text-gain'}`}>
                      {trade.type === 'buy' ? '-' : '+'}{formatCash(trade.price * trade.amount)}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Unlock analytics button */}
        {tab === 'market' && !cs.advancedAnalytics && (
          <button
            onClick={() => { dispatch({ type: 'CRYPTO_UPGRADE_ANALYTICS', bizId: biz.id }); tap(); }}
            disabled={state.cash < 1000}
            className={`w-full py-3 rounded-xl text-sm font-semibold active:scale-95 transition-transform mt-2 ${
              state.cash >= 1000 ? 'text-black' : 'bg-muted text-muted-foreground'
            }`}
            style={state.cash >= 1000 ? { backgroundColor: accent } : undefined}>
            🔬 Unlock Advanced Analytics — {formatCash(1000)}
          </button>
        )}
      </div>
    </div>
  );
}
