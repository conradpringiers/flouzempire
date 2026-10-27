import { useGame, formatCash } from '../../game/GameContext';

export function TopBar() {
  const { state } = useGame();
  return (
    <div className="px-4 py-3 bg-card border-b border-border flex items-center justify-between">
      <div>
        <div className="counter-large text-gain">{formatCash(state.cash)}</div>
        <div className="text-xs text-muted-foreground">
          Net worth: {formatCash(state.totalEarned)}
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm text-gain font-semibold">
          +{formatCash(state.cashPerSec * 3600)}/h
        </div>
        <div className="text-xs text-muted-foreground">passive</div>
      </div>
    </div>
  );
}
