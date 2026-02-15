'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';

const DEFAULT_REQUIREMENTS = [
  { skillName: 'TypeScript', minLevel: 'PROFICIENT', weight: 1 },
  { skillName: 'React', minLevel: 'COMPETENT', weight: 1 },
  { skillName: 'System Design', minLevel: 'PROFICIENT', weight: 0.8 },
  { skillName: 'Kubernetes', minLevel: 'COMPETENT', weight: 0.6 },
];

const DREYFUS_COLORS: Record<string, string> = {
  EXPERT: 'text-emerald-400',
  PROFICIENT: 'text-blue-400',
  COMPETENT: 'text-foreground-secondary',
  ADV_BEGINNER: 'text-amber-400',
  NOVICE: 'text-red-400',
};

const mockOpenPositions = [
  { id: 'pos-1', title: 'Tech Lead — Growth Squad', skills: ['TypeScript', 'React', 'System Design', 'Kubernetes'], candidates: 0 },
  { id: 'pos-2', title: 'Senior Backend — Payments', skills: ['Go', 'PostgreSQL', 'gRPC', 'Event Sourcing'], candidates: 0 },
];

type Tab = 'match' | 'search' | 'positions';

type MatchCandidate = {
  personId: string;
  displayName: string;
  matchScore: number;
  matchedSkills: Array<{ skill: string; required: string; actual: string | null; met: boolean }>;
  gaps: string[];
};

type SearchResult = {
  displayName?: string;
  personId?: string;
  skill?: string;
  level?: string;
  confidence?: number;
  lastEvidence?: string;
  team?: string;
};

function mapSearchResults(raw: any[]): SearchResult[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((r: any) => ({
    displayName: r.person?.displayName ?? r.displayName,
    personId: r.personId ?? r.person?.id,
    skill: r.skillName ?? r.skill,
    level: r.verifiedLevel ?? r.level,
    confidence: r.confidenceScore ?? r.confidence,
    lastEvidence: r.lastEvidenceAt ? new Date(r.lastEvidenceAt).toISOString().slice(0, 10) : r.lastEvidence,
    team: r.team,
  }));
}

export default function MarketplacePage() {
  const { effectiveOrganizationId: orgId } = useAuth();
  const [tab, setTab] = useState<Tab>('match');
  const [searchQuery, setSearchQuery] = useState('Go');
  const [candidates, setCandidates] = useState<MatchCandidate[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    setMatchLoading(true);
    api
      .post<MatchCandidate[]>(`/marketplace/${orgId}/match-position`, { requirements: DEFAULT_REQUIREMENTS })
      .then((data) => setCandidates(Array.isArray(data) ? data : []))
      .catch(() => setCandidates([]))
      .finally(() => setMatchLoading(false));
  }, [orgId]);

  useEffect(() => {
    if (!orgId || tab !== 'search' || !searchQuery.trim()) return;
    setSearchLoading(true);
    api
      .get(`/marketplace/${orgId}/search?skill=${encodeURIComponent(searchQuery.trim())}`)
      .then((data) => setSearchResults(mapSearchResults(Array.isArray(data) ? data : [])))
      .catch(() => setSearchResults([]))
      .finally(() => setSearchLoading(false));
  }, [orgId, tab, searchQuery]);

  if (!orgId) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-bold tracking-tight">Talent Marketplace</h1>
        <p className="text-muted">Selecione uma organização para ver o marketplace.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Talent Marketplace</h1>
          <p className="mt-1 text-sm text-muted">
            Match internal candidates to positions based on verified skills
          </p>
        </div>
        <div className="flex rounded-lg border border-border-default bg-surface">
          {(['match', 'search', 'positions'] as Tab[]).map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                tab === t ? 'bg-surface-active text-foreground' : 'text-muted-foreground hover:text-foreground-secondary'
              } ${i === 0 ? 'rounded-l-lg' : ''} ${i === 2 ? 'rounded-r-lg' : ''}`}
            >
              {t === 'match' ? 'Position Match' : t === 'search' ? 'Skill Search' : 'Open Positions'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'match' && (
        <>
          {/* Position being matched */}
          <section>
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-400 font-medium uppercase tracking-wider">Matching for</p>
                  <p className="mt-1 text-lg font-bold text-foreground">Tech Lead — Growth Squad</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {['TypeScript (Proficient)', 'React (Competent)', 'System Design (Proficient)', 'Kubernetes (Competent)'].map((req) => (
                      <span key={req} className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-[10px] text-blue-300">
                        {req}
                      </span>
                    ))}
                  </div>
                </div>
                <button className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500 transition-colors">
                  Edit Requirements
                </button>
              </div>
            </div>
          </section>

          {/* Candidate Results */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-foreground-secondary">
              Top Candidates ({candidates.length})
            </h2>
            {matchLoading ? (
              <p className="text-muted">Loading matches...</p>
            ) : (
              <div className="space-y-3">
                {candidates.map((candidate) => (
                  <div key={candidate.personId} className="rounded-xl border border-border-default bg-surface p-5 hover:border-border-default transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-hover text-sm font-bold text-foreground-secondary">
                            {candidate.displayName.split(' ').map((n: string) => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{candidate.displayName}</p>
                            <p className="text-xs text-muted-foreground">Match score: {candidate.matchScore}%</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${
                          candidate.matchScore >= 90 ? 'text-emerald-400' : candidate.matchScore >= 80 ? 'text-blue-400' : 'text-amber-400'
                        }`}>
                          {candidate.matchScore}%
                        </p>
                        <p className="text-[10px] text-muted-foreground">match score</p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {candidate.matchedSkills.map((skill) => (
                        <div key={skill.skill} className={`rounded-lg border p-3 ${
                          skill.met ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'
                        }`}>
                          <p className="text-xs font-medium text-foreground-secondary">{skill.skill}</p>
                          <div className="mt-1 flex items-center gap-1">
                            <span className={`text-[10px] ${(skill.actual && DREYFUS_COLORS[skill.actual]) || 'text-muted'}`}>{skill.actual ?? '—'}</span>
                            <span className="text-[10px] text-muted-foreground">/</span>
                            <span className="text-[10px] text-muted-foreground">{skill.required}</span>
                          </div>
                          <span className={`mt-1 inline-block text-[9px] ${skill.met ? 'text-emerald-500' : 'text-red-400'}`}>
                            {skill.met ? 'Met' : 'Gap'}
                          </span>
                        </div>
                      ))}
                    </div>

                    {candidate.gaps.length > 0 && (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Gaps: {candidate.gaps.join(', ')} — suggest PDI or pairing
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {tab === 'search' && (
        <section>
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder='Search by skill (e.g. "Go", "Kubernetes", "System Design")...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-border-default bg-surface px-5 py-3 text-sm text-foreground-secondary placeholder-muted-foreground focus:border-blue-500/50 focus:outline-none transition-colors"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                Enter to search
              </span>
            </div>
          </div>

          <h2 className="mb-4 text-lg font-semibold text-foreground-secondary">
            Results for &ldquo;{searchQuery}&rdquo;
          </h2>
          {searchLoading ? (
            <p className="text-muted">Searching...</p>
          ) : (
            <div className="rounded-xl border border-border-default bg-surface overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-default text-left text-xs text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Person</th>
                    <th className="px-5 py-3 font-medium">Team</th>
                    <th className="px-5 py-3 font-medium">Verified Level</th>
                    <th className="px-5 py-3 font-medium text-right">Confidence</th>
                    <th className="px-5 py-3 font-medium text-right">Last Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map((result, i) => (
                    <tr key={result.personId ?? i} className="border-b border-border-default/50 hover:bg-surface-hover/30 transition-colors">
                      <td className="px-5 py-3 font-medium text-foreground-secondary">{result.displayName ?? '—'}</td>
                      <td className="px-5 py-3 text-muted">{result.team ?? '—'}</td>
                      <td className="px-5 py-3">
                        <span className={`font-medium ${result.level ? DREYFUS_COLORS[result.level] : ''}`}>{result.level ?? '—'}</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-1.5 w-16 rounded-full bg-surface-hover">
                            <div className="h-full rounded-full bg-blue-400" style={{ width: `${((result.confidence ?? 0) * 100)}%` }} />
                          </div>
                          <span className="text-xs text-muted">{((result.confidence ?? 0) * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right text-xs text-muted-foreground">{result.lastEvidence ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === 'positions' && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground-secondary">Open Positions</h2>
            <button className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500 transition-colors">
              + New Position
            </button>
          </div>
          <div className="space-y-3">
            {mockOpenPositions.map((pos) => (
              <div key={pos.id} className="rounded-xl border border-border-default bg-surface p-5 hover:border-border-default transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{pos.title}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {pos.skills.map((skill) => (
                        <span key={skill} className="rounded-full bg-surface-hover px-2 py-0.5 text-[10px] text-foreground-secondary">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-foreground-secondary">{pos.candidates}</p>
                    <p className="text-[10px] text-muted-foreground">candidates matched</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button className="rounded-lg bg-surface-hover px-3 py-1.5 text-xs text-foreground-secondary hover:bg-surface-active transition-colors">
                    View Matches
                  </button>
                  <button className="rounded-lg bg-surface-hover px-3 py-1.5 text-xs text-foreground-secondary hover:bg-surface-active transition-colors">
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
