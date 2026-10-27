import React, { useState, useRef, useLayoutEffect } from 'react';
import { useGame, formatCash } from '../../../game/GameContext';
import { BusinessInstance, BANK_UPGRADE_NAMES, BANK_UPGRADE_COSTS, BANK_INTEREST_RATES } from '../../../game/GameState';
import { useHaptics } from '../../../hooks/use-haptics';
import { useSounds } from '../../../hooks/use-sounds';

const TABS = ['vault', 'clients', 'tiers'] as const;
type Tab = typeof TABS[number];

export function BankScreen({ biz }: { biz: BusinessInstance }) {
  const { state, dispatch } = useGame();
  const bs = biz.bankState!;
  const [tab, setTab] = useState<Tab>('vault');
  const [depositPreset, setDepositPreset] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const { light, tap } = useHaptics();
  const { switchTab: soundSwitch } = useSounds();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const idx = TABS.indexOf(tab);
    const el = tabRefs.current[idx];
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [tab]);

  const accent = 'hsl(220 70% 50%)';
  const rate = BANK_INTEREST_RATES[bs.upgradeLevel];
  const dailyInterest = bs.deposited * rate;
  const hourlyInterest = dailyInterest / 24;

  // Client income
  const clientIncome = bs.clients.reduce((sum, c) => {
    const net = c.deposit * (rate - c.interestRate);
    return sum + (net > 0 ? net : 0);
  }, 0);

  const depositAmount = depositPreset || parseFloat(customAmount) || 0;

  const handleDeposit = () => {
    if (depositAmount <= 0 || state.cash < depositAmount) return;
    dispatch({ type: 'BANK_DEPOSIT', bizId: biz.id, amount: depositAmount });
    setDepositPreset(null);
    setCustomAmount('');
    tap();
  };

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'hsl(220 70% 50% / 0.04)' }}>
      {/* Big vault display */}
      <div className="px-4 py-4 bg-card/50 border-b border-border">
        <div className="text-center">
          <div className="text-3xl mb-2">🏦</div>
          <div className="text-[10px] text-muted-foreground">Capital in Vault</div>
          <div className="text-2xl font-bold tabular-nums text-gain">{formatCash(bs.deposited)}</div>
          <div className="flex justify-center gap-4 mt-2">
            <div className="text-center">
              <div className="text-[10px] text-muted-foreground">Interest Rate</div>
              <div className="text-xs font-bold" style={{ color: accent }}>{(rate * 100).toFixed(1)}% / day</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-muted-foreground">Earning</div>
              <div className="text-xs font-bold text-gain">{formatCash(hourlyInterest)}/h</div>
            </div>
            {bs.clients.length > 0 && (
              <div className="text-center">
                <div className="text-[10px] text-muted-foreground">Clients</div>
                <div className="text-xs font-bold">{bs.clients.length}/{bs.maxClients}</div>
              </div>
            )}
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
            {t === 'vault' ? '💰 Vault' : t === 'clients' ? '🤝 Clients' : '⬆️ Tiers'}
          </button>
        ))}
        <div className="absolute bottom-0 h-[2px] transition-all duration-300 ease-out"
          style={{ left: indicator.left, width: indicator.width, backgroundColor: accent }} />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 tab-content-enter" key={tab}>
        {/* ===== VAULT TAB ===== */}
        {tab === 'vault' && (
          <>
            {/* Interest projection */}
            <div className="game-card" style={{ background: `linear-gradient(135deg, hsl(220 70% 50% / 0.08), hsl(220 70% 50% / 0.02))` }}>
              <div className="text-xs font-semibold mb-2">📊 Interest Projections</div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center py-2 rounded-lg bg-card">
                  <div className="text-[10px] text-muted-foreground">Per Hour</div>
                  <div className="text-xs font-bold text-gain tabular-nums">{formatCash(hourlyInterest)}</div>
                </div>
                <div className="text-center py-2 rounded-lg bg-card">
                  <div className="text-[10px] text-muted-foreground">Per Day</div>
                  <div className="text-xs font-bold text-gain tabular-nums">{formatCash(dailyInterest)}</div>
                </div>
                <div className="text-center py-2 rounded-lg bg-card">
                  <div className="text-[10px] text-muted-foreground">Per Week</div>
                  <div className="text-xs font-bold text-gain tabular-nums">{formatCash(dailyInterest * 7)}</div>
                </div>
              </div>
            </div>

            {/* Deposit */}
            <div className="game-card">
              <div className="text-xs font-semibold mb-3">💵 Deposit Funds</div>
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {[500, 1000, 5000, 10000].map(amt => (
                  <button key={amt} onClick={() => { setDepositPreset(amt); setCustomAmount(''); light(); }}
                    className={`py-2 rounded-lg text-[10px] font-semibold transition-all active:scale-95 ${
                      depositPreset === amt ? 'text-white' : 'bg-secondary text-secondary-foreground'
                    }`}
                    style={depositPreset === amt ? { backgroundColor: accent } : undefined}>
                    {formatCash(amt)}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 mb-3">
                <input
                  type="number"
                  value={customAmount}
                  onChange={e => { setCustomAmount(e.target.value); setDepositPreset(null); }}
                  placeholder="Custom amount..."
                  className="flex-1 bg-muted rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 tabular-nums"
                />
                <button onClick={() => { setDepositPreset(null); setCustomAmount(String(Math.floor(state.cash))); light(); }}
                  className="px-3 py-2 rounded-xl bg-secondary text-xs font-semibold text-secondary-foreground active:scale-95 transition-transform">
                  Max
                </button>
              </div>

              <button onClick={handleDeposit}
                disabled={depositAmount <= 0 || state.cash < depositAmount}
                className={`w-full py-3 rounded-xl text-sm font-bold active:scale-95 transition-transform ${
                  depositAmount > 0 && state.cash >= depositAmount ? 'text-white' : 'bg-muted text-muted-foreground'
                }`}
                style={depositAmount > 0 && state.cash >= depositAmount ? { backgroundColor: accent } : undefined}>
                {depositAmount > 0 ? `Deposit ${formatCash(depositAmount)}` : 'Enter an amount'}
              </button>
            </div>

            {/* Withdraw */}
            {bs.deposited > 0 && (
              <button
                onClick={() => { dispatch({ type: 'BANK_WITHDRAW', bizId: biz.id, amount: bs.deposited }); tap(); }}
                className="w-full py-2.5 rounded-xl text-xs font-semibold bg-secondary text-secondary-foreground border border-border active:scale-95 transition-transform">
                Withdraw All — {formatCash(bs.deposited)}
              </button>
            )}
          </>
        )}

        {/* ===== CLIENTS TAB ===== */}
        {tab === 'clients' && (
          <>
            <div className="game-card" style={{ background: `linear-gradient(135deg, hsl(220 70% 50% / 0.08), hsl(220 70% 50% / 0.02))` }}>
              <div className="text-xs text-muted-foreground mb-1">Client Revenue</div>
              <div className="text-lg font-bold text-gain tabular-nums">{formatCash(clientIncome / 24)}/h</div>
              <div className="text-[10px] text-muted-foreground">{bs.clients.length}/{bs.maxClients} client slots used</div>
            </div>

            {bs.clients.length === 0 && (
              <div className="text-center text-muted-foreground py-4 text-sm">
                <div className="text-3xl mb-2">🤝</div>
                Accept wealthy clients to earn management fees
              </div>
            )}

            {bs.clients.map((c, i) => {
              const netProfit = c.deposit * (rate - c.interestRate);
              return (
                <div key={c.id} className="game-card animate-fade-in"
                  style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                      style={{ backgroundColor: 'hsl(220 70% 50% / 0.12)' }}>
                      👤
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{c.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        Deposit: {formatCash(c.deposit)} · Costs you {(c.interestRate * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-bold ${netProfit >= 0 ? 'text-gain' : 'text-loss'}`}>
                        {netProfit >= 0 ? '+' : ''}{formatCash(netProfit / 24)}/h
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {bs.clients.length < bs.maxClients && (
              <button
                onClick={() => { dispatch({ type: 'BANK_ACCEPT_CLIENT', bizId: biz.id }); tap(); }}
                className="w-full py-3 rounded-xl text-sm font-bold text-white active:scale-95 transition-transform"
                style={{ backgroundColor: accent }}>
                🤝 Accept New Client
              </button>
            )}

            {bs.clients.length >= bs.maxClients && (
              <div className="text-center text-xs text-muted-foreground py-2">
                Upgrade your bank tier to unlock more client slots
              </div>
            )}
          </>
        )}

        {/* ===== TIERS TAB ===== */}
        {tab === 'tiers' && (
          <>
            <div className="game-card text-center py-3" style={{ background: `linear-gradient(135deg, hsl(220 70% 50% / 0.08), hsl(220 70% 50% / 0.02))` }}>
              <div className="text-xs text-muted-foreground mb-1">Current Tier</div>
              <div className="text-lg font-bold">{BANK_UPGRADE_NAMES[bs.upgradeLevel]}</div>
              <div className="flex justify-center gap-1 mt-2">
                {BANK_UPGRADE_NAMES.map((_, i) => (
                  <div key={i} className="w-6 h-1.5 rounded-full transition-all"
                    style={{ backgroundColor: i <= bs.upgradeLevel ? accent : 'hsl(var(--muted))' }} />
                ))}
              </div>
            </div>

            {BANK_UPGRADE_NAMES.map((name, i) => {
              const unlocked = bs.upgradeLevel >= i;
              const isNext = bs.upgradeLevel === i - 1;
              const cost = BANK_UPGRADE_COSTS[i];
              const canAfford = state.cash >= cost;

              const perks = [
                `${(BANK_INTEREST_RATES[0] * 100).toFixed(0)}% daily interest`,
                `${(BANK_INTEREST_RATES[1] * 100).toFixed(0)}% daily interest`,
                '+$20.8/h flat bonus + derivatives',
                'Tax-free interest + 2 client slots',
                '8% interest + 1% of all businesses',
                '15% interest + 2% of all businesses',
              ];

              return (
                <div key={i} className={`game-card animate-fade-in transition-all ${
                  unlocked ? '' : isNext ? 'ring-1' : 'opacity-60'
                }`}
                  style={{
                    animationDelay: `${i * 80}ms`,
                    animationFillMode: 'both',
                    borderColor: isNext ? accent : undefined,
                    boxShadow: isNext ? `0 0 0 1px ${accent}` : undefined,
                  }}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                      unlocked ? '' : 'opacity-50'
                    }`} style={{ backgroundColor: unlocked ? 'hsl(220 70% 50% / 0.12)' : 'hsl(var(--muted))' }}>
                      {unlocked ? '✅' : isNext ? '⬆️' : '🔒'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{name}</div>
                      <div className="text-[10px] text-muted-foreground">{perks[i]}</div>
                    </div>
                    {unlocked ? (
                      <span className="text-xs text-gain font-semibold px-2 py-1 rounded-full bg-primary/10">Active</span>
                    ) : isNext ? (
                      <button
                        onClick={() => { dispatch({ type: 'BANK_UPGRADE', bizId: biz.id }); tap(); }}
                        disabled={!canAfford}
                        className={`text-xs px-3 py-2 rounded-xl font-semibold active:scale-95 transition-transform ${
                          canAfford ? 'text-white' : 'bg-muted text-muted-foreground'
                        }`}
                        style={canAfford ? { backgroundColor: accent } : undefined}>
                        {formatCash(cost)}
                      </button>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">{formatCash(cost)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
