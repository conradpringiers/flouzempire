import React, { useState, useRef, useLayoutEffect } from 'react';
import { useGame, formatCash } from '../../../game/GameContext';
import { BusinessInstance, calcUnitScore, formatDuration } from '../../../game/GameState';
import { useHaptics } from '../../../hooks/use-haptics';
import { useSounds } from '../../../hooks/use-sounds';

const TABS = ['agents', 'units', 'missions', 'gear'] as const;
type Tab = typeof TABS[number];

export function SecurityScreen({ biz }: { biz: BusinessInstance }) {
  const { state, dispatch } = useGame();
  const sec = biz.securityState!;
  const [tab, setTab] = useState<Tab>('agents');
  const [creatingUnit, setCreatingUnit] = useState(false);
  const [unitName, setUnitName] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [selectedMission, setSelectedMission] = useState<string | null>(null);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const { light, tap } = useHaptics();
  const { switchTab: soundSwitch } = useSounds();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const idx = TABS.indexOf(tab);
    const el = tabRefs.current[idx];
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [tab]);

  const accent = 'hsl(30 80% 50%)';
  const usedAgentIds = new Set(sec.units.flatMap(u => u.agentIds));
  const freeAgents = sec.agents.filter(a => !usedAgentIds.has(a.id));
  const totalSalary = sec.agents.reduce((s, a) => s + a.salary, 0);

  const handleCreateUnit = () => {
    if (unitName.trim() && selectedAgents.length > 0) {
      dispatch({ type: 'SECURITY_CREATE_UNIT', bizId: biz.id, name: unitName.trim(), agentIds: selectedAgents });
      tap();
    }
    setCreatingUnit(false);
    setUnitName('');
    setSelectedAgents([]);
  };

  const handleAcceptMission = () => {
    if (selectedMission && selectedUnits.length > 0) {
      dispatch({ type: 'SECURITY_ACCEPT_MISSION', bizId: biz.id, missionId: selectedMission, unitIds: selectedUnits });
      tap();
    }
    setSelectedMission(null);
    setSelectedUnits([]);
  };

  const getUnitScore = (unitId: string) => {
    const unit = sec.units.find(u => u.id === unitId);
    return unit ? calcUnitScore(unit, sec.agents, sec.equipment) : 0;
  };

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'hsl(30 80% 50% / 0.04)' }}>
      {/* Summary */}
      <div className="px-4 py-3 bg-card/50 border-b border-border">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-[10px] text-muted-foreground">Agents</div>
            <div className="text-lg font-bold tabular-nums">{sec.agents.length}/{sec.maxAgents}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-muted-foreground">Units</div>
            <div className="text-sm font-bold tabular-nums">{sec.units.length}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-muted-foreground">Active</div>
            <div className="text-sm font-bold tabular-nums" style={{ color: accent }}>{sec.activeMissions.length}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground">Earned</div>
            <div className="text-lg font-bold tabular-nums text-gain">{formatCash(sec.totalEarned)}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="relative flex border-b border-border bg-card">
        {TABS.map((t, i) => (
          <button key={t}
            ref={el => { tabRefs.current[i] = el; }}
            onClick={() => { light(); soundSwitch(); setTab(t); }}
            className="flex-1 py-2.5 text-xs font-semibold capitalize transition-colors duration-200"
            style={{ color: tab === t ? accent : 'hsl(var(--muted-foreground))' }}>
            {t === 'agents' ? '👤 Agents' : t === 'units' ? '🎯 Units' : t === 'missions' ? '📋 Missions' : '🔧 Gear'}
          </button>
        ))}
        <div className="absolute bottom-0 h-[2px] transition-all duration-300 ease-out"
          style={{ left: indicator.left, width: indicator.width, backgroundColor: accent }} />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 tab-content-enter" key={tab}>
        {tab === 'agents' && (
          <>
            <button
              onClick={() => { dispatch({ type: 'SECURITY_HIRE_AGENT', bizId: biz.id }); tap(); }}
              disabled={sec.agents.length >= sec.maxAgents}
              className={`w-full py-3 rounded-xl text-sm font-bold active:scale-95 transition-transform ${
                sec.agents.length < sec.maxAgents ? 'text-white' : 'bg-muted text-muted-foreground'
              }`}
              style={sec.agents.length < sec.maxAgents ? { backgroundColor: accent } : undefined}>
              👤 Recruit Agent
            </button>

            {sec.agents.length > 0 && (
              <div className="text-[10px] text-muted-foreground text-center">
                Total salary: {formatCash(totalSalary)}/h · {freeAgents.length} unassigned
              </div>
            )}

            {sec.agents.map((a, i) => {
              const inUnit = usedAgentIds.has(a.id);
              return (
                <div key={a.id} className="game-card animate-fade-in" style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: 'hsl(30 80% 50% / 0.15)' }}>👤</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs">{a.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        ⚔️{a.combat} 👁️{a.surveillance} 🚗{a.driving} · {formatCash(a.salary)}/h
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {inUnit && <span className="text-[10px] text-muted-foreground">In unit</span>}
                      {!inUnit && (
                        <button onClick={() => { dispatch({ type: 'SECURITY_FIRE_AGENT', bizId: biz.id, agentId: a.id }); light(); }}
                          className="px-2 py-1 rounded-md bg-destructive/10 text-destructive text-[10px] font-semibold">Fire</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {sec.agents.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <div className="text-3xl mb-2">👤</div>
                <p className="text-sm">Recruit agents to form security units</p>
              </div>
            )}
          </>
        )}

        {tab === 'units' && (
          <>
            {!creatingUnit ? (
              <button
                onClick={() => { setCreatingUnit(true); setUnitName('Unit ' + (sec.units.length + 1)); light(); }}
                disabled={freeAgents.length === 0}
                className={`w-full py-3 rounded-xl text-sm font-bold active:scale-95 transition-transform ${
                  freeAgents.length > 0 ? 'text-white' : 'bg-muted text-muted-foreground'
                }`}
                style={freeAgents.length > 0 ? { backgroundColor: accent } : undefined}>
                🎯 Create Unit {freeAgents.length === 0 ? '(no free agents)' : ''}
              </button>
            ) : (
              <div className="game-card">
                <input value={unitName} onChange={e => setUnitName(e.target.value)}
                  className="w-full bg-muted rounded-lg px-3 py-2 text-sm font-semibold mb-3" placeholder="Unit name..." />
                <div className="text-xs font-semibold mb-2">Select agents:</div>
                <div className="space-y-1 mb-3">
                  {freeAgents.map(a => (
                    <button key={a.id}
                      onClick={() => {
                        setSelectedAgents(prev => prev.includes(a.id) ? prev.filter(id => id !== a.id) : [...prev, a.id]);
                        light();
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2 ${
                        selectedAgents.includes(a.id) ? 'bg-primary/10 border border-primary/30' : 'bg-secondary'
                      }`}>
                      <span>{selectedAgents.includes(a.id) ? '✅' : '⬜'}</span>
                      <span className="font-semibold">{a.name}</span>
                      <span className="text-muted-foreground ml-auto">⚔️{a.combat} 👁️{a.surveillance} 🚗{a.driving}</span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setCreatingUnit(false); setSelectedAgents([]); }}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold bg-secondary text-secondary-foreground">Cancel</button>
                  <button onClick={handleCreateUnit} disabled={selectedAgents.length === 0 || !unitName.trim()}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold active:scale-95 transition-transform ${
                      selectedAgents.length > 0 ? 'text-white' : 'bg-muted text-muted-foreground'
                    }`}
                    style={selectedAgents.length > 0 ? { backgroundColor: accent } : undefined}>
                    Create Unit
                  </button>
                </div>
              </div>
            )}

            {sec.units.map((u, i) => {
              const score = calcUnitScore(u, sec.agents, sec.equipment);
              const isBusy = !!u.missionId;
              const remaining = u.busyUntil ? Math.max(0, u.busyUntil - Date.now()) : 0;
              return (
                <div key={u.id} className="game-card animate-fade-in" style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: 'hsl(30 80% 50% / 0.15)' }}>🎯</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs">{u.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {u.agentIds.length} agent{u.agentIds.length > 1 ? 's' : ''} · Score: {score}
                      </div>
                    </div>
                    {isBusy ? (
                      <span className="text-[10px] font-semibold" style={{ color: accent }}>🔒 {formatDuration(remaining)}</span>
                    ) : (
                      <button onClick={() => { dispatch({ type: 'SECURITY_DISBAND_UNIT', bizId: biz.id, unitId: u.id }); light(); }}
                        className="px-2 py-1 rounded-md bg-destructive/10 text-destructive text-[10px] font-semibold">Disband</button>
                    )}
                  </div>
                </div>
              );
            })}

            {sec.units.length === 0 && !creatingUnit && (
              <div className="text-center text-muted-foreground py-4 text-sm">No units yet. Create one from your agents!</div>
            )}
          </>
        )}

        {tab === 'missions' && (
          <>
            {/* Completed missions waiting for redeem */}
            {(sec.completedMissions || []).length > 0 && (
              <div>
                <div className="text-xs font-bold text-gain mb-2">✅ Completed — Collect Payout</div>
                {(sec.completedMissions || []).map(m => (
                  <div key={m.id} className="game-card mb-2 border-2 border-gain/30">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm">⭐</span>
                      <div className="flex-1">
                        <div className="font-semibold text-xs">{m.celebrity} — {m.event}</div>
                      </div>
                    </div>
                    <button onClick={() => { dispatch({ type: 'SECURITY_REDEEM', bizId: biz.id, missionId: m.id }); tap(); }}
                      className="w-full py-2.5 rounded-xl text-xs font-bold text-white active:scale-95"
                      style={{ backgroundColor: 'hsl(var(--gain))' }}>
                      💰 Collect {formatCash(m.payout)}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Active missions */}
            {sec.activeMissions.length > 0 && (
              <div>
                <div className="text-xs font-bold text-muted-foreground mb-2">Active Missions</div>
                {sec.activeMissions.map(m => {
                  const elapsed = m.startedAt ? Date.now() - m.startedAt : 0;
                  const pct = Math.min(100, (elapsed / m.durationMs) * 100);
                  const remaining = m.startedAt ? Math.max(0, m.durationMs - elapsed) : m.durationMs;
                  return (
                    <div key={m.id} className="game-card mb-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">⭐</span>
                        <div className="flex-1">
                          <div className="font-semibold text-xs">{m.celebrity}</div>
                          <div className="text-[10px] text-muted-foreground">{m.event} · {formatCash(m.payout)}</div>
                        </div>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: accent }} />
                      </div>
                      <div className="text-[10px] text-muted-foreground text-center mt-0.5">{Math.round(pct)}% — {formatDuration(remaining)} left</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Available missions */}
            <div className="text-xs font-bold text-muted-foreground mb-2">Available Contracts</div>
            {sec.availableMissions.length === 0 && sec.activeMissions.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <div className="text-3xl mb-2">📋</div>
                <p className="text-sm">No contracts available. Complete missions to get new ones!</p>
              </div>
            )}

            {sec.availableMissions.map((m, i) => {
              const isSelected = selectedMission === m.id;
              const freeUnits = sec.units.filter(u => !u.missionId);
              const totalSelectedScore = selectedUnits.reduce((s, uid) => s + getUnitScore(uid), 0);

              return (
                <div key={m.id} className="game-card animate-fade-in" style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}>
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setSelectedMission(isSelected ? null : m.id); setSelectedUnits([]); light(); }}>
                    <span className="text-xl">⭐</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs">{m.celebrity} — {m.event}</div>
                      <div className="text-[10px] text-muted-foreground">
                        Score needed: {m.requiredScore} · {formatDuration(m.durationMs)} · {formatCash(m.payout)}
                      </div>
                    </div>
                    <span className="text-xs">{isSelected ? '▼' : '▶'}</span>
                  </div>

                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="text-xs font-semibold mb-2">Assign units (score needed: {m.requiredScore}):</div>
                      {freeUnits.length === 0 ? (
                        <div className="text-[10px] text-muted-foreground">No available units. Create units first!</div>
                      ) : (
                        <>
                          <div className="space-y-1 mb-3">
                            {freeUnits.map(u => {
                              const score = calcUnitScore(u, sec.agents, sec.equipment);
                              return (
                                <button key={u.id}
                                  onClick={() => { setSelectedUnits(prev => prev.includes(u.id) ? prev.filter(id => id !== u.id) : [...prev, u.id]); light(); }}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2 ${
                                    selectedUnits.includes(u.id) ? 'bg-primary/10 border border-primary/30' : 'bg-secondary'
                                  }`}>
                                  <span>{selectedUnits.includes(u.id) ? '✅' : '⬜'}</span>
                                  <span className="font-semibold">{u.name}</span>
                                  <span className="text-muted-foreground ml-auto">Score: {score}</span>
                                </button>
                              );
                            })}
                          </div>
                          <div className="text-[10px] mb-2 text-center font-semibold" style={{
                            color: totalSelectedScore >= m.requiredScore ? 'hsl(var(--gain))' : 'hsl(var(--loss))'
                          }}>
                            Combined score: {totalSelectedScore} / {m.requiredScore}
                          </div>
                          <button onClick={handleAcceptMission}
                            disabled={selectedUnits.length === 0 || totalSelectedScore < m.requiredScore}
                            className={`w-full py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-transform ${
                              totalSelectedScore >= m.requiredScore ? 'text-white' : 'bg-muted text-muted-foreground'
                            }`}
                            style={totalSelectedScore >= m.requiredScore ? { backgroundColor: accent } : undefined}>
                            Accept Mission — {formatCash(m.payout)}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {tab === 'gear' && (
          <>
            <div className="text-[10px] text-muted-foreground text-center mb-2">
              Equipment boosts all unit scores
            </div>
            {sec.equipment.map((e, i) => (
              <div key={e.id} className="game-card flex items-center gap-3 animate-fade-in"
                style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}>
                <span className="text-xl">{e.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs">{e.name}</div>
                  <div className="text-[10px] text-muted-foreground">+{e.scoreBoost} score to all units</div>
                </div>
                {e.owned ? (
                  <span className="text-[10px] text-gain font-semibold">✅ Owned</span>
                ) : (
                  <button
                    onClick={() => { dispatch({ type: 'SECURITY_BUY_EQUIPMENT', bizId: biz.id, equipmentId: e.id }); tap(); }}
                    disabled={state.cash < e.cost}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold active:scale-95 transition-transform ${
                      state.cash >= e.cost ? 'text-white' : 'bg-muted text-muted-foreground'
                    }`}
                    style={state.cash >= e.cost ? { backgroundColor: accent } : undefined}>
                    {formatCash(e.cost)}
                  </button>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}