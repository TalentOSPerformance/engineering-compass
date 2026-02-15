'use client';

import { useState, useRef, useEffect } from 'react';
import { useFilters, PERIOD_PRESETS } from './filter-context';

export function GlobalFilters() {
  const { teamId, days, teams, teamsLoading, setTeamId, setDays } = useFilters();
  const [teamOpen, setTeamOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setTeamOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Build hierarchical team list
  const parentTeams = teams.filter((t) => !t.parentTeamId);
  const childTeams = (parentId: string) => teams.filter((t) => t.parentTeamId === parentId);

  const selectedTeam = teams.find((t) => t.id === teamId);
  const teamLabel = selectedTeam ? selectedTeam.name : 'All Teams';

  return (
    <div className="flex items-center gap-3">
      {/* Team Selector */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setTeamOpen(!teamOpen)}
          className="flex items-center gap-2 rounded-lg border border-border-default bg-surface px-3 py-1.5 text-sm text-foreground hover:bg-surface-hover transition-colors"
          disabled={teamsLoading}
        >
          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-blue-600/20 text-[10px] font-bold text-blue-500">
            {teamId ? teamLabel.charAt(0).toUpperCase() : 'A'}
          </span>
          <span className="max-w-[140px] truncate">{teamsLoading ? 'Loading...' : teamLabel}</span>
          <svg className="h-3 w-3 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {teamOpen && (
          <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-lg border border-border-default bg-surface shadow-lg">
            <div className="max-h-72 overflow-y-auto p-1">
              <button
                onClick={() => { setTeamId(null); setTeamOpen(false); }}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                  !teamId ? 'bg-nav-active text-foreground' : 'text-foreground-secondary hover:bg-surface-hover'
                }`}
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-blue-600/20 text-[10px] font-bold text-blue-500">A</span>
                All Teams
              </button>

              {parentTeams.map((parent) => (
                <div key={parent.id}>
                  <button
                    onClick={() => { setTeamId(parent.id); setTeamOpen(false); }}
                    className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                      teamId === parent.id ? 'bg-nav-active text-foreground' : 'text-foreground-secondary hover:bg-surface-hover'
                    }`}
                  >
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-emerald-600/20 text-[10px] font-bold text-emerald-500">
                      {parent.name.charAt(0)}
                    </span>
                    {parent.name}
                    <span className="ml-auto text-xs text-muted">{parent.memberCount}</span>
                  </button>
                  {childTeams(parent.id).map((child) => (
                    <button
                      key={child.id}
                      onClick={() => { setTeamId(child.id); setTeamOpen(false); }}
                      className={`flex w-full items-center gap-2 rounded-md py-2 pl-8 pr-3 text-sm transition-colors ${
                        teamId === child.id ? 'bg-nav-active text-foreground' : 'text-foreground-secondary hover:bg-surface-hover'
                      }`}
                    >
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-purple-600/20 text-[10px] font-bold text-purple-500">
                        {child.name.charAt(0)}
                      </span>
                      {child.name}
                      <span className="ml-auto text-xs text-muted">{child.memberCount}</span>
                    </button>
                  ))}
                </div>
              ))}

              {/* Teams without parent */}
              {teams.filter((t) => t.parentTeamId && !parentTeams.find((p) => p.id === t.parentTeamId)).map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setTeamId(t.id); setTeamOpen(false); }}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                    teamId === t.id ? 'bg-nav-active text-foreground' : 'text-foreground-secondary hover:bg-surface-hover'
                  }`}
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-orange-600/20 text-[10px] font-bold text-orange-500">
                    {t.name.charAt(0)}
                  </span>
                  {t.name}
                  <span className="ml-auto text-xs text-muted">{t.memberCount}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Period Picker */}
      <div className="flex items-center rounded-lg border border-border-default bg-surface">
        {PERIOD_PRESETS.map((p) => (
          <button
            key={p.days}
            onClick={() => setDays(p.days)}
            className={`px-3 py-1.5 text-xs font-medium transition-colors first:rounded-l-lg last:rounded-r-lg ${
              days === p.days
                ? 'bg-blue-600 text-white'
                : 'text-muted hover:bg-surface-hover hover:text-foreground-secondary'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
