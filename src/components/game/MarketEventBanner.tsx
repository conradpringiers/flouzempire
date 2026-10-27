import { useGame } from '../../game/GameContext';
import { MarketEvent } from '../../game/GameState';

function EventBadge({ event }: { event: MarketEvent }) {
  const now = Date.now();
  const remaining = Math.max(0, event.endsAt - now);
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const timeStr = minutes > 0 ? `${minutes}m` : `${seconds}s`;
  
  const isPositive = event.modifier >= 1;
  const modText = isPositive 
    ? `+${Math.round((event.modifier - 1) * 100)}%` 
    : `${Math.round((event.modifier - 1) * 100)}%`;

  return (
    <div 
      className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
        isPositive 
          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
          : 'bg-red-500/20 text-red-400 border border-red-500/30'
      }`}
    >
      <span>{event.icon}</span>
      <span className="hidden sm:inline">{event.name}</span>
      <span className="font-bold">{modText}</span>
      <span className="text-muted-foreground">({timeStr})</span>
    </div>
  );
}

export function MarketEventBanner() {
  const { state } = useGame();
  const activeEvents = state.activeEvents || [];

  if (activeEvents.length === 0) return null;

  return (
    <div className="px-2 py-1.5 bg-card/50 border-b border-border flex items-center gap-2 overflow-x-auto">
      <span className="text-xs text-muted-foreground shrink-0">📈 Events:</span>
      {activeEvents.map(event => (
        <EventBadge key={event.id} event={event} />
      ))}
    </div>
  );
}