import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import api from '../../lib/api';

interface PersonIdentity {
  id: string;
  provider: string;
  externalId: string;
  username: string | null;
  email: string | null;
}

interface PersonUser {
  id: string;
  username: string;
  role: string;
  lastLoginAt: string | null;
}

interface PersonRecord {
  id: string;
  displayName: string;
  primaryEmail: string;
  avatarUrl: string | null;
  isActive: boolean;
  identities: PersonIdentity[];
  user: PersonUser | null;
  _count: {
    pullRequests: number;
    commits: number;
    reviews: number;
    skills: number;
  };
}

export default function TeamPage() {
  const [persons, setPersons] = useState<PersonRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    displayName: '',
    email: '',
    teamId: '' as string | undefined,
    identities: [{ provider: 'github', externalId: '', providerUsername: '' }] as Array<{
      provider: string;
      externalId: string;
      providerUsername: string;
    }>,
  });
  const [inviteResult, setInviteResult] = useState<{
    created: boolean;
    existingIdentity: boolean;
    reason?: string;
  } | null>(null);
  const [inviting, setInviting] = useState(false);

  const [linkingPerson, setLinkingPerson] = useState<PersonRecord | null>(null);
  const [linkForm, setLinkForm] = useState({
    provider: 'github',
    externalId: '',
    username: '',
    email: '',
  });
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const { effectiveOrganizationId: orgId } = useAuth();

  const fetchPersons = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const data = await api.get(
        `/identity/persons/${orgId}${search ? `?search=${encodeURIComponent(search)}` : ''}`,
      );
      setPersons(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersons();
  }, [orgId]);

  const handleSearch = () => {
    fetchPersons();
  };

  const handleInvite = async () => {
    if (!orgId) return;
    setInviting(true);
    setInviteResult(null);
    const identities = inviteForm.identities.filter((i) => (i.externalId || i.providerUsername || '').trim());
    const first = identities[0];
    try {
      const payload = {
        displayName: inviteForm.displayName,
        email: inviteForm.email,
        teamId: inviteForm.teamId || undefined,
        provider: first?.provider,
        externalId: first?.externalId || first?.providerUsername,
        providerUsername: first?.providerUsername || first?.externalId,
      };
      const result = await api.post(`/identity/persons/${orgId}/invite`, payload);
      setInviteResult(result);
      if (result.created && result.person?.id && identities.length > 1) {
        for (let i = 1; i < identities.length; i++) {
          const idn = identities[i];
          const ext = (idn.externalId || idn.providerUsername || '').trim();
          if (ext) {
            await api.post(`/identity/person/${result.person.id}/link`, {
              provider: idn.provider,
              externalId: ext,
              username: idn.providerUsername || ext,
            });
          }
        }
        fetchPersons();
      }
      if (result.created) {
        if (!(result.person?.id && identities.length > 1)) fetchPersons();
        setInviteForm({
          displayName: '',
          email: '',
          teamId: '',
          identities: [{ provider: 'github', externalId: '', providerUsername: '' }],
        });
      }
    } catch (err: any) {
      setInviteResult({ created: false, existingIdentity: false, reason: err.message });
    } finally {
      setInviting(false);
    }
  };

  const providerBadge = (provider: string) => {
    const colors: Record<string, string> = {
      github: 'bg-surface-active text-foreground-secondary',
      gitlab: 'bg-orange-900/50 text-orange-300',
      jira: 'bg-blue-900/50 text-blue-300',
    };
    return colors[provider] || 'bg-surface-hover text-foreground-secondary';
  };

  const openLinkIdentity = (person: PersonRecord) => {
    setLinkingPerson(person);
    setLinkForm({ provider: 'github', externalId: '', username: '', email: '' });
    setLinkError(null);
  };

  const handleLinkIdentity = async () => {
    if (!linkingPerson) return;
    const { provider, externalId, username, email } = linkForm;
    if (!externalId.trim()) {
      setLinkError('Informe o ID externo ou username.');
      return;
    }
    setLinkLoading(true);
    setLinkError(null);
    try {
      await api.post(`/identity/person/${linkingPerson.id}/link`, {
        provider,
        externalId: externalId.trim(),
        username: username.trim() || undefined,
        email: email.trim() || undefined,
      });
      await fetchPersons();
      setLinkingPerson(null);
    } catch (err: any) {
      setLinkError(err.message || 'Erro ao vincular identidade.');
    } finally {
      setLinkLoading(false);
    }
  };

  if (!orgId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Cadastro de Desenvolvedores</h1>
        <div className="rounded-lg border border-yellow-400/20 bg-yellow-400/5 p-6 text-yellow-400">
          Nenhuma organização selecionada.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">
          Cadastro de Desenvolvedores
        </h1>
        <button
          onClick={() => setShowInvite(!showInvite)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
        >
          {showInvite ? 'Fechar' : 'Convidar / Pré-cadastrar'}
        </button>
      </div>

      {/* Invite form */}
      {showInvite && (
        <div className="rounded-xl border border-border-default bg-surface p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            Convidar Desenvolvedor
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-1">
                Nome <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={inviteForm.displayName}
                onChange={(e) =>
                  setInviteForm((p) => ({ ...p, displayName: e.target.value }))
                }
                className="w-full rounded-lg border border-border-default bg-surface-hover px-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-blue-500 focus:outline-none"
                placeholder="João Silva"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-1">
                E-mail <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={inviteForm.email}
                onChange={(e) =>
                  setInviteForm((p) => ({ ...p, email: e.target.value }))
                }
                className="w-full rounded-lg border border-border-default bg-surface-hover px-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-blue-500 focus:outline-none"
                placeholder="joao@empresa.com"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-foreground-secondary">
                Identidades (GitHub, GitLab, Jira) — opcional, pode adicionar várias
              </label>
              <button
                type="button"
                onClick={() =>
                  setInviteForm((p) => ({
                    ...p,
                    identities: [...p.identities, { provider: 'github', externalId: '', providerUsername: '' }],
                  }))
                }
                className="rounded border border-border-default px-2 py-1 text-xs text-foreground-secondary hover:bg-surface-hover"
              >
                + Adicionar outra
              </button>
            </div>
            {inviteForm.identities.map((idn, idx) => (
              <div key={idx} className="flex flex-wrap items-end gap-2 rounded-lg border border-border-default bg-surface-hover/30 p-3">
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-xs text-muted-foreground mb-1">Provider</label>
                  <select
                    value={idn.provider}
                    onChange={(e) =>
                      setInviteForm((p) => ({
                        ...p,
                        identities: p.identities.map((id, i) =>
                          i === idx ? { ...id, provider: e.target.value } : id,
                        ),
                      }))
                    }
                    className="w-full rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-foreground"
                  >
                    <option value="github">GitHub</option>
                    <option value="gitlab">GitLab</option>
                    <option value="jira">Jira</option>
                  </select>
                </div>
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-xs text-muted-foreground mb-1">Username / ID externo</label>
                  <input
                    type="text"
                    value={idn.externalId || idn.providerUsername}
                    onChange={(e) => {
                      const v = e.target.value;
                      setInviteForm((p) => ({
                        ...p,
                        identities: p.identities.map((id, i) =>
                          i === idx ? { ...id, externalId: v, providerUsername: v } : id,
                        ),
                      }));
                    }}
                    className="w-full rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-foreground placeholder-muted-foreground"
                    placeholder="joaosilva"
                  />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setInviteForm((p) => ({
                      ...p,
                      identities: p.identities.length > 1 ? p.identities.filter((_, i) => i !== idx) : p.identities,
                    }))
                  }
                  disabled={inviteForm.identities.length <= 1}
                  className="rounded border border-red-500/20 px-2 py-1.5 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>

          {inviteResult && (
            <div
              className={`rounded-lg border px-4 py-3 text-sm ${
                inviteResult.created
                  ? 'border-green-500/30 bg-green-500/10 text-green-400'
                  : inviteResult.existingIdentity
                    ? 'border-yellow-400/30 bg-yellow-400/10 text-yellow-400'
                    : 'border-red-400/20 bg-red-400/10 text-red-400'
              }`}
            >
              {inviteResult.created
                ? 'Desenvolvedor pré-cadastrado com sucesso!'
                : inviteResult.existingIdentity
                  ? `Identidade já existe: ${inviteResult.reason}`
                  : inviteResult.reason || 'Erro ao convidar'}
            </div>
          )}

          <button
            onClick={handleInvite}
            disabled={inviting || !inviteForm.displayName || !inviteForm.email}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors disabled:opacity-50"
          >
            {inviting ? 'Cadastrando...' : 'Pré-cadastrar'}
          </button>
        </div>
      )}

      {/* Search bar */}
      <div className="flex gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 rounded-lg border border-border-default bg-surface px-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-blue-500 focus:outline-none"
          placeholder="Buscar por nome ou e-mail..."
        />
        <button
          onClick={handleSearch}
          className="rounded-lg bg-surface-hover px-5 py-2.5 text-sm text-foreground-secondary hover:bg-surface-active transition-colors"
        >
          Buscar
        </button>
      </div>

      {/* Persons list */}
      {loading ? (
        <div className="text-muted">Carregando...</div>
      ) : persons.length === 0 ? (
        <div className="rounded-lg border border-border-default p-8 text-center text-muted-foreground">
          Nenhum desenvolvedor encontrado.
        </div>
      ) : (
        <div className="space-y-3">
          {persons.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-border-default bg-surface p-5 hover:border-border-default transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-active text-sm font-medium text-foreground-secondary">
                    {p.avatarUrl ? (
                      <img
                        src={p.avatarUrl}
                        alt=""
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      p.displayName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      {p.displayName}
                    </h3>
                    <p className="text-sm text-muted">{p.primaryEmail}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>{p._count.pullRequests} PRs</span>
                  <span>{p._count.commits} commits</span>
                  <span>{p._count.reviews} reviews</span>
                  <span>{p._count.skills} skills</span>
                </div>
              </div>

              {/* Identities */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {p.identities.map((identity) => (
                  <span
                    key={identity.id}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${providerBadge(identity.provider)}`}
                  >
                    {identity.provider}
                    {identity.username && (
                      <span className="opacity-70">@{identity.username}</span>
                    )}
                  </span>
                ))}
                {p.user && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-900/30 px-3 py-1 text-xs font-medium text-green-400">
                    Login: {p.user.username} ({p.user.role})
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => openLinkIdentity(p)}
                  className="rounded-full border border-dashed border-border-default px-3 py-1 text-xs text-muted-foreground hover:bg-surface-hover hover:text-foreground-secondary transition-colors"
                >
                  + Vincular identidade
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {linkingPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setLinkingPerson(null)}>
          <div
            className="bg-surface border border-border-default rounded-xl shadow-xl max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                Vincular identidade — {linkingPerson.displayName}
              </h3>
              <button
                type="button"
                onClick={() => setLinkingPerson(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-surface-hover"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              Associe outra conta (GitHub, GitLab ou Jira) a esta pessoa para unificar métricas.
            </p>
            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-1">Provider</label>
              <select
                value={linkForm.provider}
                onChange={(e) => setLinkForm((f) => ({ ...f, provider: e.target.value }))}
                className="w-full rounded-lg border border-border-default bg-surface-hover px-3 py-2 text-sm text-foreground"
              >
                <option value="github">GitHub</option>
                <option value="gitlab">GitLab</option>
                <option value="jira">Jira</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-1">
                ID externo / Username <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={linkForm.externalId}
                onChange={(e) =>
                  setLinkForm((f) => ({
                    ...f,
                    externalId: e.target.value,
                    username: e.target.value,
                  }))
                }
                placeholder="ex: joaosilva ou ID numérico"
                className="w-full rounded-lg border border-border-default bg-surface-hover px-3 py-2 text-sm text-foreground placeholder-muted-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-1">E-mail (opcional)</label>
              <input
                type="email"
                value={linkForm.email}
                onChange={(e) => setLinkForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="email@empresa.com"
                className="w-full rounded-lg border border-border-default bg-surface-hover px-3 py-2 text-sm text-foreground placeholder-muted-foreground"
              />
            </div>
            {linkError && (
              <div className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-400">
                {linkError}
              </div>
            )}
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setLinkingPerson(null)}
                className="rounded-lg border border-border-default px-4 py-2 text-sm text-foreground-secondary hover:bg-surface-hover"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleLinkIdentity}
                disabled={linkLoading || !linkForm.externalId.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
              >
                {linkLoading ? 'Vinculando...' : 'Vincular'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
