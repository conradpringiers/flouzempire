import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import { useGame, formatCash } from '../../../game/GameContext';
import {
  BusinessInstance, Employee, Project, formatDuration,
  getRecruitmentCost, getRecruitmentDuration, generateAgencyCandidate, randomId,
} from '../../../game/GameState';
import { useHaptics } from '../../../hooks/use-haptics';
import { useSounds } from '../../../hooks/use-sounds';

const AGENCY_TABS = ['team', 'projects', 'finance'] as const;
type AgencyTab = typeof AGENCY_TABS[number];

function useCountdown(targetMs?: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!targetMs) return;
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, [targetMs]);
  if (!targetMs) return null;
  const remaining = Math.max(0, targetMs - now);
  if (remaining <= 0) return null;
  const secs = Math.floor(remaining / 1000);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function AgencyScreen({ biz }: { biz: BusinessInstance }) {
  const { state, dispatch } = useGame();
  const as2 = biz.agencyState!;
  const [tab, setTab] = useState<AgencyTab>('team');
  const [assignModal, setAssignModal] = useState<Project | null>(null);
  const [selectedEmps, setSelectedEmps] = useState<string[]>([]);
  const { light } = useHaptics();
  const { switchTab: soundSwitch } = useSounds();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const idx = AGENCY_TABS.indexOf(tab);
    const el = tabRefs.current[idx];
    if (el) {
      setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    }
  }, [tab]);

  const accent = 'hsl(210 100% 50%)';

  const totalSalaryPerHour = as2.employees.reduce((s, e) => s + e.salary, 0);
  const freeCount = as2.employees.filter(e => !e.busy).length;

  // Total team stats
  const totalCode = as2.employees.reduce((s, e) => s + e.skills.code, 0);
  const totalDesign = as2.employees.reduce((s, e) => s + e.skills.design, 0);
  const totalMgmt = as2.employees.reduce((s, e) => s + e.skills.management, 0);

  const completedSearches = as2.recruitmentSearches.filter(s => s.completed || Date.now() >= s.readyAt);
  const pendingSearches = as2.recruitmentSearches.filter(s => !s.completed);

  const toggleEmp = (empId: string) => {
    setSelectedEmps(prev => prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]);
  };

  const selectedSkills = selectedEmps.reduce(
    (acc, id) => {
      const emp = as2.employees.find(e => e.id === id);
      if (!emp) return acc;
      return { code: acc.code + emp.skills.code, design: acc.design + emp.skills.design, management: acc.management + emp.skills.management };
    },
    { code: 0, design: 0, management: 0 }
  );

  const canStartProject = assignModal ? (
    selectedSkills.code >= assignModal.requirements.code &&
    selectedSkills.design >= assignModal.requirements.design &&
    selectedSkills.management >= assignModal.requirements.management
  ) : false;

  const handleStartRecruitment = () => {
    const searchCount = as2.recruitmentSearches.length;
    const cost = getRecruitmentCost(searchCount);
    if (state.cash < cost) return;
    dispatch({ type: 'AGENCY_RECRUIT', bizId: biz.id });
  };

  const expandCost = as2.maxSlots * 500;
  const canExpand = state.cash >= expandCost;

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'hsl(210 100% 50% / 0.04)' }}>
      {/* Summary strip with team stats */}
      <div className="px-4 py-2 flex items-center gap-3 bg-card/50 border-b border-border text-xs text-muted-foreground">
        <span>👥 {as2.employees.length}/{as2.maxSlots}</span>
        <span>🟢 {freeCount} free</span>
        <span className="ml-auto flex gap-2">
          <SkillBadge label="💻" value={totalCode} color="210 100% 50%" small />
          <SkillBadge label="🎨" value={totalDesign} color="330 80% 55%" small />
          <SkillBadge label="📋" value={totalMgmt} color="142 71% 45%" small />
        </span>
      </div>

      {/* Tab Bar */}
      <div className="relative flex border-b border-border bg-card">
        {AGENCY_TABS.map((t, i) => (
          <button key={t}
            ref={el => { tabRefs.current[i] = el; }}
            onClick={() => { light(); soundSwitch(); setTab(t); }}
            className="flex-1 py-2.5 text-xs font-semibold capitalize transition-colors duration-200"
            style={{ color: tab === t ? accent : 'hsl(var(--muted-foreground))' }}>
            {t === 'team' ? '👥 Team' : t === 'projects' ? '📁 Projects' : '💰 Finance'}
          </button>
        ))}
        <div className="absolute bottom-0 h-[2px] transition-all duration-300 ease-out"
          style={{ left: indicator.left, width: indicator.width, backgroundColor: accent }} />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 tab-content-enter" key={tab}>
        {/* ===== TEAM TAB ===== */}
        {tab === 'team' && (
          <>
            {/* Actions first */}
            <div className="space-y-2">
              {as2.employees.length < as2.maxSlots && (
                <button onClick={handleStartRecruitment}
                  disabled={state.cash < getRecruitmentCost(as2.recruitmentSearches.length)}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold active:scale-95 transition-transform ${
                    state.cash >= getRecruitmentCost(as2.recruitmentSearches.length) ? 'text-white' : 'bg-muted text-muted-foreground'
                  }`}
                  style={state.cash >= getRecruitmentCost(as2.recruitmentSearches.length) ? { backgroundColor: accent } : undefined}>
                  🔍 Search candidates — {formatCash(getRecruitmentCost(as2.recruitmentSearches.length))}
                </button>
              )}

              <button onClick={() => dispatch({ type: 'AGENCY_EXPAND', bizId: biz.id })}
                disabled={!canExpand}
                className={`w-full py-2 rounded-xl text-xs font-semibold active:scale-95 transition-transform border ${
                  canExpand ? 'bg-secondary text-secondary-foreground border-border' : 'bg-muted/50 text-muted-foreground border-border/50'
                }`}>
                🏢 Expand Office (+2 slots) — {formatCash(expandCost)}
              </button>
            </div>

            {/* Pending & completed searches */}
            {pendingSearches.map(search => (
              <RecruitmentCountdown key={search.id} search={search} />
            ))}

            {completedSearches.map(search => (
              <div key={search.id} className="game-card space-y-2">
                <div className="text-xs text-gain font-semibold">✅ Candidates found!</div>
                {search.candidates.map((c: Employee) => (
                  <div key={c.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs truncate">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.role} · {formatCash(c.salary)}/h</div>
                      <div className="flex gap-1 mt-1">
                        <SkillBadge label="💻" value={c.skills.code} color="210 100% 50%" small />
                        <SkillBadge label="🎨" value={c.skills.design} color="330 80% 55%" small />
                        <SkillBadge label="📋" value={c.skills.management} color="142 71% 45%" small />
                      </div>
                    </div>
                    {as2.employees.length < as2.maxSlots && (
                      <button onClick={() => dispatch({ type: 'AGENCY_HIRE', bizId: biz.id, employee: c, searchId: search.id })}
                        className="text-xs py-1.5 px-3 rounded-lg font-semibold text-white active:scale-95"
                        style={{ backgroundColor: accent }}>
                        Hire
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ))}

            {/* Employee list */}
            {as2.employees.length > 0 && (
              <div className="text-xs font-semibold text-muted-foreground pt-1">Employees</div>
            )}
            {as2.employees.map(emp => (
              <div key={emp.id} className="game-card flex items-center gap-3">
                <div className="text-xl">
                  {emp.role.includes('Dev') || emp.role.includes('Full') || emp.role.includes('Tech') ? '👨‍💻' :
                   emp.role.includes('Design') ? '🎨' :
                   emp.role.includes('Manager') || emp.role.includes('PM') ? '📋' :
                   emp.role.includes('DevOps') ? '⚙️' : '👤'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{emp.name}</div>
                  <div className="text-xs text-muted-foreground">{emp.role} · {formatCash(emp.salary)}/h</div>
                  <div className="flex gap-1 mt-1">
                    <SkillBadge label="💻" value={emp.skills.code} color="210 100% 50%" small />
                    <SkillBadge label="🎨" value={emp.skills.design} color="330 80% 55%" small />
                    <SkillBadge label="📋" value={emp.skills.management} color="142 71% 45%" small />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${emp.busy ? 'bg-warning/20 text-warn' : 'bg-primary/20 text-gain'}`}>
                    {emp.busy ? 'Busy' : 'Free'}
                  </span>
                  <button onClick={() => dispatch({ type: 'AGENCY_FIRE', bizId: biz.id, empId: emp.id })} className="text-xs text-loss">Fire</button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ===== PROJECTS TAB ===== */}
        {tab === 'projects' && (
          <>
            {/* Completed projects waiting for redeem */}
            {(as2.completedProjects || []).length > 0 && (
              <>
                <div className="text-sm font-semibold">✅ Completed — Redeem</div>
                {(as2.completedProjects || []).map(p => (
                  <div key={p.id} className="game-card border-2 border-gain/30">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-sm flex-1 mr-2">{p.name}</span>
                      <span className="text-gain text-sm font-bold whitespace-nowrap">{formatCash(p.payout)}</span>
                    </div>
                    <button onClick={() => dispatch({ type: 'AGENCY_REDEEM', bizId: biz.id, projectId: p.id })}
                      className="w-full py-2.5 rounded-xl text-sm font-bold text-white active:scale-95"
                      style={{ backgroundColor: 'hsl(var(--gain))' }}>
                      💰 Collect {formatCash(p.payout)}
                    </button>
                  </div>
                ))}
              </>
            )}

            {as2.projects.filter(p => p.accepted).length > 0 && (
              <>
                <div className="text-sm font-semibold">🚀 Active</div>
                {as2.projects.filter(p => p.accepted).map(p => (
                  <ActiveProjectCard key={p.id} project={p} employees={as2.employees} accent={accent} />
                ))}
              </>
            )}

            <div className="text-sm font-semibold mt-2">📋 Available</div>
            {as2.availableProjects.length === 0 && (
              <div className="text-center text-muted-foreground py-4 text-xs">No projects available. Check back later!</div>
            )}
            {as2.availableProjects.map(p => (
              <div key={p.id} className="game-card">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-sm flex-1 mr-2">{p.name}</span>
                  <span className="text-gain text-sm font-bold whitespace-nowrap">{formatCash(p.payout)}</span>
                </div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <ReqBadge label="💻" value={p.requirements.code} color="210 100% 50%" />
                  <ReqBadge label="🎨" value={p.requirements.design} color="330 80% 55%" />
                  <ReqBadge label="📋" value={p.requirements.management} color="142 71% 45%" />
                  <span className="text-xs text-muted-foreground ml-auto">⏱ {formatDuration(p.durationMs)}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setSelectedEmps([]); setAssignModal(p); }}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold text-white active:scale-95"
                    style={{ backgroundColor: accent }}>
                    Start
                  </button>
                  <button onClick={() => dispatch({ type: 'AGENCY_DECLINE_PROJECT', bizId: biz.id, projectId: p.id })}
                    className="py-2 px-3 rounded-lg text-xs font-semibold bg-secondary text-secondary-foreground">
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ===== FINANCE TAB ===== */}
        {tab === 'finance' && (
          <>
            <div className="game-card p-5 text-center" style={{ background: `linear-gradient(135deg, hsl(210 100% 50% / 0.08), hsl(210 100% 50% / 0.02))` }}>
              <div className="text-xs text-muted-foreground mb-1">Net Profit</div>
              <div className={`text-2xl font-bold tabular-nums ${as2.totalEarned - as2.totalSalaryPaid >= 0 ? 'text-gain' : 'text-loss'}`}>
                {formatCash(as2.totalEarned - as2.totalSalaryPaid)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <FinCard icon="🏆" label="Total Earned" value={formatCash(as2.totalEarned)} cls="text-gain" />
              <FinCard icon="💸" label="Salary Paid" value={formatCash(as2.totalSalaryPaid)} cls="text-loss" />
              <FinCard icon="⏰" label="Salary/Hour" value={`${formatCash(totalSalaryPerHour)}/h`} cls="text-loss" />
              <FinCard icon="🚀" label="Active" value={String(as2.projects.filter(p => p.accepted).length)} />
            </div>
          </>
        )}
      </div>

      {/* Assign Modal */}
      {assignModal && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-background/80 backdrop-blur-sm" onClick={() => setAssignModal(null)}>
          <div className="w-full max-w-[420px] bg-card rounded-t-2xl border-t border-border p-4 pb-8 max-h-[85vh] overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-4" />
            <h2 className="text-lg font-bold mb-1">{assignModal.name}</h2>
            <p className="text-xs text-muted-foreground mb-3">{assignModal.description}</p>

            <div className="game-card mb-3">
              <div className="text-xs font-semibold mb-2">Requirements</div>
              <div className="space-y-2">
                <SkillRow label="💻 Code" required={assignModal.requirements.code} current={selectedSkills.code} />
                <SkillRow label="🎨 Design" required={assignModal.requirements.design} current={selectedSkills.design} />
                <SkillRow label="📋 Mgmt" required={assignModal.requirements.management} current={selectedSkills.management} />
              </div>
            </div>

            <div className="text-sm font-semibold mb-2">Select Employees</div>
            <div className="space-y-2 mb-4">
              {as2.employees.filter(e => !e.busy).map(emp => {
                const isSelected = selectedEmps.includes(emp.id);
                return (
                  <button key={emp.id} onClick={() => toggleEmp(emp.id)}
                    className={`w-full game-card flex items-center gap-3 transition-all ${isSelected ? 'ring-2' : ''}`}
                    style={isSelected ? { borderColor: accent, boxShadow: `0 0 0 2px ${accent}` } : undefined}>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="font-semibold text-xs truncate">{emp.name}</div>
                      <div className="flex gap-1 mt-1">
                        <SkillBadge label="💻" value={emp.skills.code} color="210 100% 50%" small />
                        <SkillBadge label="🎨" value={emp.skills.design} color="330 80% 55%" small />
                        <SkillBadge label="📋" value={emp.skills.management} color="142 71% 45%" small />
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
                      {isSelected && <span className="text-primary-foreground text-xs">✓</span>}
                    </div>
                  </button>
                );
              })}
              {as2.employees.filter(e => !e.busy).length === 0 && (
                <div className="text-center text-muted-foreground text-xs py-4">All employees are busy</div>
              )}
            </div>

            <button
              onClick={() => {
                if (canStartProject && assignModal) {
                  dispatch({ type: 'AGENCY_ACCEPT_PROJECT', bizId: biz.id, projectId: assignModal.id, employeeIds: selectedEmps });
                  setAssignModal(null);
                }
              }}
              disabled={!canStartProject}
              className={`w-full py-3 rounded-xl text-sm font-semibold ${canStartProject ? 'text-white active:scale-95' : 'bg-muted text-muted-foreground'}`}
              style={canStartProject ? { backgroundColor: accent } : undefined}>
              {canStartProject ? `🚀 Start — ${formatDuration(assignModal.durationMs)}` : 'Not enough skills'}
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function FinCard({ icon, label, value, cls }: { icon: string; label: string; value: string; cls?: string }) {
  return (
    <div className="game-card">
      <div className="text-lg mb-1">{icon}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className={`text-sm font-bold tabular-nums ${cls || ''}`}>{value}</div>
    </div>
  );
}

function SkillBadge({ label, value, color, small }: { label: string; value: number; color: string; small?: boolean }) {
  if (value === 0) return null;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full ${small ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'}`}
      style={{ backgroundColor: `hsl(${color} / 0.15)`, color: `hsl(${color})` }}>
      {label} {value}
    </span>
  );
}

function ReqBadge({ label, value, color }: { label: string; value: number; color: string }) {
  if (value === 0) return null;
  return (
    <span className="inline-flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full"
      style={{ backgroundColor: `hsl(${color} / 0.1)`, color: `hsl(${color})` }}>
      {label} {value}
    </span>
  );
}

function SkillRow({ label, required, current }: { label: string; required: number; current: number }) {
  const met = current >= required;
  if (required === 0) return null;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs w-20">{label}</span>
      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${Math.min(100, (current / required) * 100)}%`,
            backgroundColor: met ? 'hsl(var(--gain))' : 'hsl(var(--warning))',
          }} />
      </div>
      <span className={`text-xs font-semibold tabular-nums ${met ? 'text-gain' : 'text-warn'}`}>
        {current}/{required}
      </span>
    </div>
  );
}

function RecruitmentCountdown({ search }: { search: any }) {
  const countdown = useCountdown(search.readyAt);
  if (!countdown) return null;
  return (
    <div className="game-card flex items-center gap-3">
      <div className="text-xl animate-pulse">🔍</div>
      <div className="flex-1">
        <div className="text-xs font-semibold">Searching for candidates...</div>
        <div className="text-xs text-muted-foreground tabular-nums">{countdown} remaining</div>
      </div>
    </div>
  );
}

function ActiveProjectCard({ project, employees, accent }: { project: Project; employees: Employee[]; accent: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  const elapsed = now - (project.startedAt || now);
  const progress = Math.min(1, elapsed / project.durationMs);
  const remaining = Math.max(0, project.durationMs - elapsed);

  const assignedEmps = employees.filter(e => project.assignedEmployees?.includes(e.id));

  return (
    <div className="game-card">
      <div className="flex justify-between items-start mb-2">
        <span className="font-semibold text-sm">{project.name}</span>
        <span className="text-gain text-sm font-bold">{formatCash(project.payout)}</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden mb-1">
        <div className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${progress * 100}%`, backgroundColor: accent }} />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{Math.round(progress * 100)}%</span>
        <span>{formatDuration(remaining)}</span>
      </div>
      {assignedEmps.length > 0 && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {assignedEmps.map(e => (
            <span key={e.id} className="text-[10px] px-1.5 py-0.5 bg-muted rounded-full">{e.name.split(' ')[0]}</span>
          ))}
        </div>
      )}
    </div>
  );
}
