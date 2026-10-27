import { useState } from 'react';
import { useGame } from '../../game/GameContext';
import { formatCash } from '../../game/GameState';
import {
  MILLIONAIRE_ACTIONS,
  COMPANY_DATA,
  getPlayerRank,
  getImpressionFactor,
  getFriendBonuses,
  getOwnershipPercentage,
  getDividendPerHour,
  getCompanyTotalShares,
} from '../../game/SocialData';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { toast } from 'sonner';

function formatCompact(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T';
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toFixed(0);
}

function MiniChart({ history }: { history: number[] }) {
  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = max - min || 1;
  const points = history.map((p, i) => {
    const x = (i / (history.length - 1)) * 60;
    const y = 24 - ((p - min) / range) * 20;
    return `${x},${y}`;
  }).join(' ');
  
  const isUp = history[history.length - 1] >= history[0];
  
  return (
    <svg width="60" height="28" className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={isUp ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'}
        strokeWidth="1.5"
      />
    </svg>
  );
}

function MillionairesTab() {
  const { state, dispatch } = useGame();
  const [selectedMill, setSelectedMill] = useState<string | null>(null);
  const now = Date.now();

  const social = state.socialState;
  if (!social) return <div className="p-4 text-muted-foreground">Loading...</div>;

  const playerWealth = state.totalEarned;
  const playerRank = getPlayerRank(playerWealth, social.millionaires);
  const friendCount = social.millionaires.filter(m => m.isFriend).length;
  const bonuses = getFriendBonuses(friendCount);

  const sortedMillionaires = [...social.millionaires].sort((a, b) => b.netWorth - a.netWorth);
  const selected = social.millionaires.find(m => m.id === selectedMill);

  const handleAction = (millId: string, actionId: string) => {
    dispatch({ type: 'SOCIAL_ACTION', millionaireId: millId, actionId });
    const action = MILLIONAIRE_ACTIONS.find(a => a.id === actionId);
    if (action) {
      toast.success(`${action.icon} ${action.name}`, { description: `Relationship improved!` });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Player stats */}
      <div className="p-3 bg-gradient-to-r from-primary/20 to-transparent border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">Your Rank</div>
            <div className="text-2xl font-bold">#{playerRank}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Net Worth</div>
            <div className="text-lg font-semibold text-primary">${formatCompact(playerWealth)}</div>
          </div>
        </div>
        {friendCount > 0 && (
          <div className="mt-2 flex gap-2 text-xs">
            <Badge variant="secondary">👥 {friendCount} Friends</Badge>
            <Badge variant="outline" className="text-chart-2">+{((bonuses.incomeMultiplier - 1) * 100).toFixed(0)}% Income</Badge>
            <Badge variant="outline" className="text-primary">+{((bonuses.tapMultiplier - 1) * 100).toFixed(0)}% Tap</Badge>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {/* Insert player in the list */}
          {sortedMillionaires.map((mill, idx) => {
            const rank = idx + 1 + (playerWealth > mill.netWorth ? 0 : (playerRank <= idx + 1 ? 1 : 0));
            const actualRank = [...sortedMillionaires, { netWorth: playerWealth, id: 'player' }]
              .sort((a, b) => b.netWorth - a.netWorth)
              .findIndex(m => m.id === mill.id) + 1;

            return (
              <Card
                key={mill.id}
                className={`cursor-pointer transition-all hover:bg-accent/50 ${mill.isFriend ? 'ring-1 ring-primary/50' : ''}`}
                onClick={() => setSelectedMill(mill.id)}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="text-lg font-bold text-muted-foreground w-6">#{actualRank}</div>
                  <img src={mill.image} alt={mill.name} className="w-12 h-12 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold truncate">{mill.name}</span>
                      {mill.isFriend && <Badge className="text-xs">Friend</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">{mill.industry}</div>
                    <div className="text-sm font-medium text-primary">${formatCompact(mill.netWorth)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Relation</div>
                    <Progress value={mill.relationship} className="w-16 h-2" />
                    <div className="text-xs">{mill.relationship}%</div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelectedMill(null)}>
        <DialogContent className="max-w-sm">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <img src={selected.image} alt={selected.name} className="w-14 h-14 rounded-full object-cover" />
                  <div>
                    <div>{selected.name}</div>
                    <div className="text-sm text-muted-foreground font-normal">{selected.industry}</div>
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Net Worth</span>
                  <span className="font-bold text-primary">${formatCompact(selected.netWorth)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Relationship</span>
                  <div className="flex items-center gap-2">
                    <Progress value={selected.relationship} className="w-20 h-2" />
                    <span>{selected.relationship}%</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Impression</span>
                  <span>
                    {getImpressionFactor(playerWealth, selected.netWorth) >= 2 ? '🤩 Very Impressed' :
                     getImpressionFactor(playerWealth, selected.netWorth) >= 1.5 ? '😊 Impressed' :
                     getImpressionFactor(playerWealth, selected.netWorth) >= 1 ? '😐 Neutral' :
                     getImpressionFactor(playerWealth, selected.netWorth) >= 0.7 ? '🤨 Skeptical' : '😒 Unimpressed'}
                  </span>
                </div>

                <div className="border-t border-border pt-3">
                  <div className="text-sm font-medium mb-2">Actions</div>
                  <div className="grid grid-cols-2 gap-2">
                    {MILLIONAIRE_ACTIONS.map(action => {
                      const cooldownEnd = social.actionCooldowns?.[selected.id]?.[action.id] || 0;
                      const onCooldown = now < cooldownEnd;
                      const canAfford = state.cash >= action.cost;
                      const hasRequiredWealth = playerWealth >= action.requiredWealth;
                      const disabled = onCooldown || !canAfford || !hasRequiredWealth;

                      return (
                        <Button
                          key={action.id}
                          variant={disabled ? 'outline' : 'default'}
                          size="sm"
                          disabled={disabled}
                          onClick={() => handleAction(selected.id, action.id)}
                          className="flex flex-col h-auto py-2"
                        >
                          <span className="text-lg">{action.icon}</span>
                          <span className="text-xs">{action.name}</span>
                          <span className="text-xs text-muted-foreground">${formatCompact(action.cost)}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {selected.relationship >= 80 && !selected.isFriend && (
                  <Button className="w-full" onClick={() => dispatch({ type: 'SOCIAL_ADD_FRIEND', millionaireId: selected.id })}>
                    🤝 Become Friends
                  </Button>
                )}
                {selected.isFriend && (
                  <div className="text-center text-sm text-chart-2">✓ You are friends! (+2% income bonus)</div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EntreprisesTab() {
  const { state, dispatch } = useGame();
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [buyAmount, setBuyAmount] = useState(1);

  const social = state.socialState;
  if (!social) return <div className="p-4 text-muted-foreground">Loading...</div>;

  const dividendPerHour = getDividendPerHour(social.holdings, social.stocks);
  const totalPortfolioValue = social.holdings.reduce((sum, h) => {
    const stock = social.stocks.find(s => s.companyId === h.companyId);
    return sum + (stock ? h.shares * stock.currentPrice : 0);
  }, 0);

  const selected = selectedCompany ? COMPANY_DATA.find(c => c.id === selectedCompany) : null;
  const selectedStock = selected ? social.stocks.find(s => s.companyId === selected.id) : null;
  const selectedHolding = selected ? social.holdings.find(h => h.companyId === selected.id) : null;

  const handleBuy = (amount: number) => {
    if (!selected) return;
    dispatch({ type: 'STOCK_BUY', companyId: selected.id, shares: amount });
    toast.success(`Bought ${amount} shares of ${selected.ticker}`);
  };

  const handleSell = (amount: number) => {
    if (!selected) return;
    dispatch({ type: 'STOCK_SELL', companyId: selected.id, shares: amount });
    toast.success(`Sold ${amount} shares of ${selected.ticker}`);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Portfolio stats */}
      <div className="p-3 bg-gradient-to-r from-chart-1/20 to-transparent border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">Portfolio Value</div>
            <div className="text-xl font-bold">${formatCompact(totalPortfolioValue)}</div>
          </div>
        <div className="text-right">
            <div className="text-xs text-muted-foreground">Dividends/hr</div>
            <div className="text-lg font-semibold text-chart-2">+${formatCompact(dividendPerHour)}</div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {COMPANY_DATA.map(company => {
            const stock = social.stocks.find(s => s.companyId === company.id);
            const holding = social.holdings.find(h => h.companyId === company.id);
            if (!stock) return null;

            const priceChange = stock.priceHistory.length > 1
              ? ((stock.currentPrice - stock.priceHistory[0]) / stock.priceHistory[0]) * 100
              : 0;
            const isUp = priceChange >= 0;

            return (
              <Card
                key={company.id}
                className={`cursor-pointer transition-all hover:bg-accent/50 ${holding ? 'ring-1 ring-primary/50' : ''}`}
                onClick={() => setSelectedCompany(company.id)}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <img src={company.logo} alt={company.name} className="w-10 h-10 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{company.ticker}</span>
                      {holding && <Badge variant="secondary" className="text-xs">{holding.shares} shares</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{company.name}</div>
                  </div>
                  <MiniChart history={stock.priceHistory} />
                  <div className="text-right w-20">
                    <div className="font-bold">${stock.currentPrice.toFixed(2)}</div>
                    <div className={`text-xs ${isUp ? 'text-chart-2' : 'text-destructive'}`}>
                      {isUp ? '+' : ''}{priceChange.toFixed(1)}%
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      {/* Trade dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelectedCompany(null)}>
        <DialogContent className="max-w-sm">
          {selected && selectedStock && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <img src={selected.logo} alt={selected.name} className="w-12 h-12 rounded-lg object-cover" />
                  <div>
                    <div>{selected.name}</div>
                    <div className="text-sm text-muted-foreground font-normal">{selected.ticker} • {selected.industry}</div>
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-bold text-xl">${selectedStock.currentPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dividend Yield</span>
                  <span className="text-chart-2">{selected.dividendYield}%/hr</span>
                </div>
                {selectedHolding && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Your Shares</span>
                      <span>{selectedHolding.shares.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ownership</span>
                      <span>{getOwnershipPercentage(selectedHolding.shares).toFixed(4)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Position Value</span>
                      <span className="font-bold">${formatCompact(selectedHolding.shares * selectedStock.currentPrice)}</span>
                    </div>
                  </>
                )}

                <div className="border-t border-border pt-3">
                  <div className="text-sm font-medium mb-2">Trade</div>
                  <div className="flex gap-2 mb-3">
                    {[1, 10, 100, 1000].map(amt => (
                      <Button
                        key={amt}
                        variant={buyAmount === amt ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setBuyAmount(amt)}
                      >
                        {amt}
                      </Button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      disabled={state.cash < selectedStock.currentPrice * buyAmount}
                      onClick={() => handleBuy(buyAmount)}
                    >
                      Buy {buyAmount} (${formatCompact(selectedStock.currentPrice * buyAmount)})
                    </Button>
                    {selectedHolding && selectedHolding.shares >= buyAmount && (
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleSell(buyAmount)}
                      >
                        Sell {buyAmount}
                      </Button>
                    )}
                  </div>

                  {state.cash >= selectedStock.currentPrice * getCompanyTotalShares() * 0.51 && (
                    <Button
                      className="w-full mt-2"
                      variant="destructive"
                      onClick={() => handleBuy(Math.ceil(getCompanyTotalShares() * 0.51))}
                    >
                      🏛️ Acquire Majority (51%)
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function SocialScreen() {
  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="millionaires" className="flex flex-col h-full">
        <TabsList className="mx-3 mt-2 grid grid-cols-2">
          <TabsTrigger value="millionaires">👥 Millionaires</TabsTrigger>
          <TabsTrigger value="entreprises">📊 Entreprises</TabsTrigger>
        </TabsList>
        <TabsContent value="millionaires" className="flex-1 m-0 overflow-hidden">
          <MillionairesTab />
        </TabsContent>
        <TabsContent value="entreprises" className="flex-1 m-0 overflow-hidden">
          <EntreprisesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
