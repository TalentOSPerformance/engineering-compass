import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import api from '@/lib/api';

export interface PeriodPreset {
  label: string;
  days: number;
}

export const PERIOD_PRESETS: PeriodPreset[] = [
  { label: '7d', days: 7 },
  { label: '14d', days: 14 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
];

export interface TeamOption {
  id: string;
  name: string;
  parentTeamId: string | null;
  memberCount: number;
}

interface FilterState {
  teamId: string | null; // null = "All Teams"
  days: number;
  teams: TeamOption[];
  teamsLoading: boolean;
  setTeamId: (id: string | null) => void;
  setDays: (days: number) => void;
}

const FilterContext = createContext<FilterState | null>(null);

export function useFilters(): FilterState {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used within FilterProvider');
  return ctx;
}

export function FilterProvider({
  orgId,
  children,
}: {
  orgId: string | null;
  children: ReactNode;
}) {
  // Start with defaults to avoid hydration mismatch (server always renders 30 / null).
  // Then sync from localStorage in useEffect after mount.
  const [teamId, setTeamIdRaw] = useState<string | null>(null);
  const [days, setDaysRaw] = useState<number>(30);
  const [hydrated, setHydrated] = useState(false);

  // Sync from localStorage after hydration (client-only)
  useEffect(() => {
    const storedTeam = localStorage.getItem('filter:teamId') || null;
    const storedDays = localStorage.getItem('filter:days');
    if (storedTeam) setTeamIdRaw(storedTeam);
    if (storedDays) setDaysRaw(Number(storedDays));
    setHydrated(true);
  }, []);

  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);

  const setTeamId = useCallback((id: string | null) => {
    setTeamIdRaw(id);
    if (id) localStorage.setItem('filter:teamId', id);
    else localStorage.removeItem('filter:teamId');
  }, []);

  const setDays = useCallback((d: number) => {
    setDaysRaw(d);
    localStorage.setItem('filter:days', String(d));
  }, []);

  // Load teams
  useEffect(() => {
    if (!orgId) {
      setTeamsLoading(false);
      return;
    }
    setTeamsLoading(true);
    api
      .get<any[]>(`/organizations/${orgId}/teams`)
      .then((data: any[]) => {
        setTeams(
          (Array.isArray(data) ? data : []).map((t) => ({
            id: t.id,
            name: t.name,
            parentTeamId: t.parentTeamId || null,
            memberCount: t._count?.members ?? 0,
          })),
        );
      })
      .catch(() => setTeams([]))
      .finally(() => setTeamsLoading(false));
  }, [orgId]);

  return (
    <FilterContext.Provider value={{ teamId, days, teams, teamsLoading, setTeamId, setDays }}>
      {children}
    </FilterContext.Provider>
  );
}
