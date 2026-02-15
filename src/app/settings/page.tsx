import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';

const mockPrivacySettings = {
  codeStorageEnabled: false,
  piiMaskingEnabled: true,
  llmProvider: 'openai',
  sidecarEnabled: false,
  dataRetentionDays: 365,
  weekendAlertEnabled: true,
  weekendThreshold: 5,
};

type Tab = 'general' | 'privacy' | 'teams' | 'notifications';

type Org = {
  id: string;
  name: string;
  slug: string;
  domain?: string | null;
  createdAt: string;
  _count?: { persons: number; teams: number; integrations: number };
};

type Team = {
  id: string;
  name: string;
  _count?: { members: number };
  members?: Array<{ role: string; person: { id: string; displayName: string } }>;
};

type TeamMemberRow = {
  personId: string;
  person: { id: string; displayName: string; primaryEmail: string; avatarUrl?: string | null };
  role: string; // 'lead' | 'member'
};

type TeamDetail = {
  id: string;
  name: string;
  slug: string;
  parentTeamId?: string | null;
  members: TeamMemberRow[];
  parentTeam?: { id: string; name: string } | null;
};

type PersonOption = { id: string; displayName: string; primaryEmail: string };

function SettingsPageContent() {
  const { effectiveOrganizationId: orgId, user } = useAuth();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [tab, setTab] = useState<Tab>('general');
  useEffect(() => {
    if (tabFromUrl && ['general', 'privacy', 'teams', 'notifications'].includes(tabFromUrl)) {
      setTab(tabFromUrl as Tab);
    }
  }, [tabFromUrl]);
  const [org, setOrg] = useState<Org | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orgName, setOrgName] = useState('');
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [saveOrgLoading, setSaveOrgLoading] = useState(false);
  const [saveProfileLoading, setSaveProfileLoading] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [createTeamLoading, setCreateTeamLoading] = useState(false);

  // Manage team modal
  const [managingTeamId, setManagingTeamId] = useState<string | null>(null);
  const [teamDetail, setTeamDetail] = useState<TeamDetail | null>(null);
  const [editTeamName, setEditTeamName] = useState('');
  const [teamSaveLoading, setTeamSaveLoading] = useState(false);
  const [teamAddMemberLoading, setTeamAddMemberLoading] = useState(false);
  const [addMemberPersonId, setAddMemberPersonId] = useState('');
  const [personsForOrg, setPersonsForOrg] = useState<PersonOption[]>([]);
  const [removingPersonId, setRemovingPersonId] = useState<string | null>(null);
  const [updatingRolePersonId, setUpdatingRolePersonId] = useState<string | null>(null);

  const loadOrgAndTeams = () => {
    if (!orgId) return Promise.resolve();
    return Promise.all([
      api.get<Org>(`/organizations/${orgId}`),
      api.get<Team[]>(`/organizations/${orgId}/teams`),
    ]).then(([orgData, teamsData]) => {
      setOrg(orgData);
      setOrgName(orgData.name);
      setTeams(Array.isArray(teamsData) ? teamsData : []);
    });
  };

  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all([
      loadOrgAndTeams().catch((err: Error) => setError(err.message)),
      api.get<{ person?: { displayName?: string; primaryEmail?: string } }>('/auth/me')
        .then((me) => {
          setProfileName(me.person?.displayName ?? '');
          setProfileEmail(me.person?.primaryEmail ?? '');
        })
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [orgId]);

  const handleSaveOrg = () => {
    if (!orgId) return;
    setSaveOrgLoading(true);
    api.put(`/organizations/${orgId}`, { name: orgName })
      .then(() => loadOrgAndTeams())
      .catch((err: Error) => setError(err.message))
      .finally(() => setSaveOrgLoading(false));
  };

  const handleSaveProfile = () => {
    setSaveProfileLoading(true);
    api.patch('/auth/me', { displayName: profileName || undefined, primaryEmail: profileEmail || undefined })
      .then(() => {})
      .catch((err: Error) => setError(err.message))
      .finally(() => setSaveProfileLoading(false));
  };

  const handleCreateTeam = () => {
    if (!orgId || !newTeamName.trim()) return;
    setCreateTeamLoading(true);
    api.post(`/organizations/${orgId}/teams`, { name: newTeamName.trim() })
      .then(() => {
        setNewTeamName('');
        loadOrgAndTeams();
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setCreateTeamLoading(false));
  };

  const openManageTeam = (teamId: string) => {
    setManagingTeamId(teamId);
    setTeamDetail(null);
    setEditTeamName('');
    setAddMemberPersonId('');
    if (!orgId) return;
    api.get<TeamDetail>(`/organizations/${orgId}/teams/${teamId}`).then((data) => {
      setTeamDetail(data);
      setEditTeamName(data.name);
    }).catch((err: Error) => setError(err.message));
    api.get<PersonOption[]>(`/identity/persons/${orgId}`).then((list) => {
      setPersonsForOrg(Array.isArray(list) ? list : []);
    }).catch(() => setPersonsForOrg([]));
  };

  const closeManageTeam = () => {
    setManagingTeamId(null);
    setTeamDetail(null);
    setRemovingPersonId(null);
    loadOrgAndTeams();
  };

  const handleSaveTeamName = () => {
    if (!orgId || !managingTeamId || !teamDetail) return;
    if (editTeamName.trim() === teamDetail.name) return;
    setTeamSaveLoading(true);
    api.patch(`/organizations/${orgId}/teams/${managingTeamId}`, { name: editTeamName.trim() })
      .then(() => {
        setTeamDetail((prev) => prev ? { ...prev, name: editTeamName.trim() } : null);
        loadOrgAndTeams();
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setTeamSaveLoading(false));
  };

  const handleRemoveMember = (personId: string) => {
    if (!orgId || !managingTeamId) return;
    setRemovingPersonId(personId);
    api.delete(`/organizations/${orgId}/teams/${managingTeamId}/members/${personId}`)
      .then(() => {
        setTeamDetail((prev) => prev ? { ...prev, members: prev.members.filter((m) => m.personId !== personId) } : null);
        loadOrgAndTeams();
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setRemovingPersonId(null));
  };

  const handleAddMember = () => {
    if (!orgId || !managingTeamId || !addMemberPersonId) return;
    setTeamAddMemberLoading(true);
    api.post(`/organizations/${orgId}/teams/${managingTeamId}/members`, { personId: addMemberPersonId })
      .then(() => {
        const person = personsForOrg.find((p) => p.id === addMemberPersonId);
        if (person && teamDetail) {
          setTeamDetail({
            ...teamDetail,
            members: [...teamDetail.members, { personId: person.id, person, role: 'member' }],
          });
        }
        setAddMemberPersonId('');
        loadOrgAndTeams();
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setTeamAddMemberLoading(false));
  };

  const handleSetMemberRole = (personId: string, role: 'lead' | 'member') => {
    if (!orgId || !managingTeamId || !teamDetail) return;
    setUpdatingRolePersonId(personId);
    api.patch(`/organizations/${orgId}/teams/${managingTeamId}/members/${personId}`, { role })
      .then(() => {
        setTeamDetail({
          ...teamDetail,
          members: teamDetail.members.map((m) =>
            m.personId === personId ? { ...m, role } : { ...m, role: 'member' as const },
          ),
        });
        loadOrgAndTeams();
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setUpdatingRolePersonId(null));
  };

  const mockOrg = org
    ? {
        name: org.name,
        slug: org.slug,
        plan: 'Business',
        members: org._count?.persons ?? 0,
        teams: org._count?.teams ?? teams.length,
        createdAt: org.createdAt ? new Date(org.createdAt).toISOString().slice(0, 10) : '—',
      }
    : { name: '', slug: '', plan: '—', members: 0, teams: 0, createdAt: '—' };

  const mockTeams = teams.map((t) => ({
    id: t.id,
    name: t.name,
    lead: t.members?.[0]?.person?.displayName ?? '—',
    members: t._count?.members ?? 0,
  }));

  if (!orgId) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted">Selecione uma organização para ver as configurações.</p>
      </div>
    );
  }

  if (loading && !org) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  if (error && !org) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted">
          Organization configuration, privacy controls and team management
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 rounded-lg border border-border-default bg-surface p-1 w-fit">
        {(['general', 'privacy', 'teams', 'notifications'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-xs font-medium capitalize rounded-md transition-colors ${
              tab === t ? 'bg-surface-active text-foreground' : 'text-muted-foreground hover:text-foreground-secondary'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'general' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Organization */}
          <section className="rounded-xl border border-border-default bg-surface p-6">
            <h2 className="text-lg font-semibold text-foreground-secondary">Organization</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs text-muted-foreground">Name</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border-default bg-surface-hover/50 px-3 py-2 text-sm text-foreground-secondary focus:border-blue-500/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Slug</label>
                <input
                  type="text"
                  defaultValue={mockOrg.slug}
                  disabled
                  className="mt-1 w-full rounded-lg border border-border-default bg-surface-hover/50 px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
                />
              </div>
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div>
                  <p className="text-lg font-bold text-foreground-secondary">{mockOrg.members}</p>
                  <p className="text-[10px] text-muted-foreground">Members</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground-secondary">{mockOrg.teams}</p>
                  <p className="text-[10px] text-muted-foreground">Teams</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-blue-400">{mockOrg.plan}</p>
                  <p className="text-[10px] text-muted-foreground">Plan</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSaveOrg}
                disabled={saveOrgLoading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500 transition-colors disabled:opacity-50"
              >
                {saveOrgLoading ? 'Salvando...' : 'Save Changes'}
              </button>
            </div>
          </section>

          {/* Profile */}
          <section className="rounded-xl border border-border-default bg-surface p-6">
            <h2 className="text-lg font-semibold text-foreground-secondary">Your Profile</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs text-muted-foreground">Name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border-default bg-surface-hover/50 px-3 py-2 text-sm text-foreground-secondary focus:border-blue-500/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Email</label>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border-default bg-surface-hover/50 px-3 py-2 text-sm text-foreground-secondary focus:border-blue-500/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Role</label>
                <p className="mt-1 text-sm font-medium text-blue-400">{user?.role ?? '—'}</p>
              </div>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saveProfileLoading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500 transition-colors disabled:opacity-50"
              >
                {saveProfileLoading ? 'Salvando...' : 'Update Profile'}
              </button>
            </div>
          </section>
        </div>
      )}

      {tab === 'privacy' && (
        <section className="max-w-2xl">
          <div className="rounded-xl border border-border-default bg-surface p-6">
            <h2 className="text-lg font-semibold text-foreground-secondary">Privacy & Security</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Configure how TalentOS handles code and personal data
            </p>
            <div className="mt-6 space-y-5">
              {/* Toggle items */}
              {[
                { label: 'PII Masking Before LLM Calls', description: 'Automatically strip emails, API keys and names before sending to OpenAI', enabled: mockPrivacySettings.piiMaskingEnabled, locked: true },
                { label: 'Ephemeral Code Processing', description: 'Code is analyzed in memory and never persisted to database', enabled: !mockPrivacySettings.codeStorageEnabled, locked: true },
                { label: 'Sidecar Agent (Enterprise)', description: 'Process code locally without sending to external services', enabled: mockPrivacySettings.sidecarEnabled, locked: false },
                { label: 'Weekend Activity Alerts', description: `Alert when weekend activity exceeds ${mockPrivacySettings.weekendThreshold}% threshold`, enabled: mockPrivacySettings.weekendAlertEnabled, locked: false },
              ].map((item) => (
                <div key={item.label} className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground-secondary">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                    {item.locked && (
                      <span className="mt-1 inline-block text-[9px] text-emerald-500 font-medium">Always enabled — cannot be disabled</span>
                    )}
                  </div>
                  <div className={`relative h-5 w-9 rounded-full transition-colors ${
                    item.enabled ? 'bg-blue-600' : 'bg-surface-active'
                  } ${item.locked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                    <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      item.enabled ? 'translate-x-4' : 'translate-x-0.5'
                    }`} />
                  </div>
                </div>
              ))}

              <div className="border-t border-border-default pt-5">
                <label className="text-xs text-muted-foreground">LLM Provider</label>
                <select
                  defaultValue={mockPrivacySettings.llmProvider}
                  className="mt-1 w-full rounded-lg border border-border-default bg-surface-hover/50 px-3 py-2 text-sm text-foreground-secondary focus:border-blue-500/50 focus:outline-none"
                >
                  <option value="openai">OpenAI (GPT-4o)</option>
                  <option value="local">Local Model (Mistral/CodeLlama)</option>
                  <option value="azure">Azure OpenAI</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Data Retention (days)</label>
                <input
                  type="number"
                  defaultValue={mockPrivacySettings.dataRetentionDays}
                  className="mt-1 w-full rounded-lg border border-border-default bg-surface-hover/50 px-3 py-2 text-sm text-foreground-secondary focus:border-blue-500/50 focus:outline-none"
                />
              </div>

              <button className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500 transition-colors">
                Save Privacy Settings
              </button>
            </div>
          </div>
        </section>
      )}

      {tab === 'teams' && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground-secondary">Teams ({mockTeams.length})</h2>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Team name"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className="rounded-lg border border-border-default bg-surface px-3 py-1.5 text-sm w-48"
              />
              <button
                type="button"
                onClick={handleCreateTeam}
                disabled={createTeamLoading || !newTeamName.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500 transition-colors disabled:opacity-50"
              >
                {createTeamLoading ? 'Criando...' : '+ Create Team'}
              </button>
            </div>
          </div>
          <div className="rounded-xl border border-border-default bg-surface overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default text-left text-xs text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Team</th>
                  <th className="px-5 py-3 font-medium">Lead</th>
                  <th className="px-5 py-3 font-medium text-right">Members</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockTeams.map((team) => (
                  <tr key={team.id} className="border-b border-border-default/50 hover:bg-surface-hover/30 transition-colors">
                    <td className="px-5 py-3 font-medium text-foreground-secondary">{team.name}</td>
                    <td className="px-5 py-3 text-muted">{team.lead}</td>
                    <td className="px-5 py-3 text-right text-foreground-secondary">{team.members}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openManageTeam(team.id)}
                        className="rounded-lg bg-surface-hover px-3 py-1 text-xs text-foreground-secondary hover:bg-surface-active transition-colors"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {managingTeamId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={closeManageTeam}>
              <div
                className="bg-surface border border-border-default rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-border-default">
                  <h3 className="text-lg font-semibold text-foreground">
                    {teamDetail ? teamDetail.name : 'Manage team'}
                  </h3>
                  <button
                    type="button"
                    onClick={closeManageTeam}
                    className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-surface-hover"
                    aria-label="Fechar"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                  {teamDetail && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-foreground-secondary mb-1">Nome do time</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editTeamName}
                            onChange={(e) => setEditTeamName(e.target.value)}
                            className="flex-1 rounded-lg border border-border-default bg-surface-hover px-3 py-2 text-sm text-foreground"
                          />
                          <button
                            type="button"
                            onClick={handleSaveTeamName}
                            disabled={teamSaveLoading || editTeamName.trim() === teamDetail.name}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
                          >
                            {teamSaveLoading ? 'Salvando...' : 'Salvar'}
                          </button>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-foreground-secondary mb-2">Membros ({teamDetail.members.length})</h4>
                        {teamDetail.members.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Nenhum membro. Adicione abaixo.</p>
                        ) : (
                          <ul className="space-y-2">
                            {teamDetail.members.map((m) => (
                              <li
                                key={m.personId}
                                className="flex items-center justify-between rounded-lg border border-border-default bg-surface-hover/50 px-3 py-2 text-sm"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-foreground">{m.person.displayName}</span>
                                  {m.role === 'lead' && (
                                    <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                                      Lead
                                    </span>
                                  )}
                                  <span className="text-muted-foreground text-xs">{m.person.primaryEmail}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {m.role === 'member' ? (
                                    <button
                                      type="button"
                                      onClick={() => handleSetMemberRole(m.personId, 'lead')}
                                      disabled={updatingRolePersonId === m.personId}
                                      className="rounded border border-amber-500/20 px-2 py-1 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 disabled:opacity-50"
                                    >
                                      {updatingRolePersonId === m.personId ? '...' : 'Tornar lead'}
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleSetMemberRole(m.personId, 'member')}
                                      disabled={updatingRolePersonId === m.personId}
                                      className="rounded border border-border-default px-2 py-1 text-xs text-muted-foreground hover:bg-surface-hover disabled:opacity-50"
                                    >
                                      {updatingRolePersonId === m.personId ? '...' : 'Tornar membro'}
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMember(m.personId)}
                                    disabled={removingPersonId === m.personId}
                                    className="rounded border border-red-500/20 px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                                  >
                                    {removingPersonId === m.personId ? 'Removendo...' : 'Remover'}
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-foreground-secondary mb-2">Adicionar membro</h4>
                        <div className="flex gap-2">
                          <select
                            value={addMemberPersonId}
                            onChange={(e) => setAddMemberPersonId(e.target.value)}
                            className="flex-1 rounded-lg border border-border-default bg-surface-hover px-3 py-2 text-sm text-foreground"
                          >
                            <option value="">Selecione uma pessoa</option>
                            {personsForOrg
                              .filter((p) => !teamDetail.members.some((m) => m.personId === p.id))
                              .map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.displayName} ({p.primaryEmail})
                                </option>
                              ))}
                          </select>
                          <button
                            type="button"
                            onClick={handleAddMember}
                            disabled={teamAddMemberLoading || !addMemberPersonId}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
                          >
                            {teamAddMemberLoading ? 'Adicionando...' : 'Adicionar'}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                  {!teamDetail && managingTeamId && (
                    <p className="text-sm text-muted-foreground">Carregando...</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {tab === 'notifications' && (
        <section className="max-w-2xl">
          <div className="rounded-xl border border-border-default bg-surface p-6">
            <h2 className="text-lg font-semibold text-foreground-secondary">Notification Preferences</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Choose what triggers notifications and where they go
            </p>
            <div className="mt-6 space-y-4">
              {[
                { label: 'New AI Insights', description: 'When new PRAISE, GAP or RISK insights are generated', email: true, slack: true },
                { label: 'Skill Decay Alerts', description: 'When a verified skill starts decaying due to inactivity', email: true, slack: false },
                { label: 'Bus Factor Warnings', description: 'When bus factor drops below threshold', email: true, slack: true },
                { label: 'Integration Errors', description: 'When webhook processing fails', email: false, slack: true },
                { label: 'Weekly Digest', description: 'Summary of team metrics and top insights', email: true, slack: false },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-lg border border-border-default bg-surface-hover/30 p-4">
                  <div>
                    <p className="text-sm font-medium text-foreground-secondary">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground">{item.description}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" defaultChecked={item.email} className="rounded border-border-default" />
                      <span className="text-[10px] text-muted">Email</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" defaultChecked={item.slack} className="rounded border-border-default" />
                      <span className="text-[10px] text-muted">Slack</span>
                    </label>
                  </div>
                </div>
              ))}
              <button className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500 transition-colors">
                Save Preferences
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return <SettingsPageContent />;
}
