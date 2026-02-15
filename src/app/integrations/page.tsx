import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import api from '../../lib/api';
import { getServiceHelp } from '@/components/help/faq-data';
import type { ServiceId } from '@/components/help/faq-data';
import { SetupWizard } from '@/components/help/setup-wizard';

interface IntegrationConfig {
  provider: string;
  label: string;
  icon: string;
  fields: Array<{
    key: string;
    label: string;
    type: 'text' | 'password' | 'url';
    placeholder: string;
    required: boolean;
    help?: string;
  }>;
}

const PROVIDERS: IntegrationConfig[] = [
  {
    provider: 'github',
    label: 'GitHub',
    icon: '🐙',
    fields: [
      {
        key: 'connectionKey',
        label: 'Organização GitHub (slug)',
        type: 'text',
        placeholder: 'ex.: minha-org (vazio = conexão padrão para uma única org)',
        required: false,
        help: 'Slug da organização no GitHub (ex.: acme-corp). Pode cadastrar várias conexões, uma por org, cada uma com seu token.',
      },
      {
        key: 'accessToken',
        label: 'Token de acesso (Classic ou Fine-Grained)',
        type: 'password',
        placeholder: 'ghp_... ou github_pat_...',
        required: true,
        help: 'Fine-Grained: em Settings → Developer settings → Personal access tokens → Fine-grained tokens, crie um token com permissões de leitura: Repository → Contents, Pull requests, Metadata; opcionalmente Deployments para backfill. O sistema aceita Classic (ghp_) e Fine-Grained (github_pat_).',
      },
      {
        key: 'webhookSecret',
        label: 'Webhook Secret',
        type: 'password',
        placeholder: 'Mesmo valor configurado no webhook do GitHub',
        required: false,
        help: 'Passo a passo: (1) Gere um segredo forte (ex: openssl rand -hex 32). (2) No GitHub: repositório ou organização → Settings → Webhooks → Add webhook. Payload URL: https://SUA_API/api/v1/webhooks/ingest/github, Content type: application/json, em "Secret" cole esse segredo. (3) Opcional: defina GITHUB_WEBHOOK_SECRET no .env ou use um secret por conexão aqui.',
      },
    ],
  },
  {
    provider: 'gitlab',
    label: 'GitLab',
    icon: '🦊',
    fields: [
      {
        key: 'baseUrl',
        label: 'Base URL',
        type: 'url',
        placeholder: 'https://gitlab.com',
        required: true,
      },
      {
        key: 'accessToken',
        label: 'Access Token',
        type: 'password',
        placeholder: 'glpat-...',
        required: true,
      },
      {
        key: 'webhookSecret',
        label: 'Webhook Secret',
        type: 'password',
        placeholder: 'Segredo do webhook',
        required: false,
      },
    ],
  },
  {
    provider: 'jira',
    label: 'Jira',
    icon: '📋',
    fields: [
      {
        key: 'connectionKey',
        label: 'Identificador da conexão (BU / empresa)',
        type: 'text',
        placeholder: 'ex.: bu-eng, empresa-x (vazio = conexão padrão)',
        required: false,
        help: 'Use um identificador único por conta Jira (ex.: BU Engenharia, Empresa X). Permite cadastrar várias contas Jira na mesma organização.',
      },
      {
        key: 'baseUrl',
        label: 'Jira URL',
        type: 'url',
        placeholder: 'https://your-org.atlassian.net',
        required: true,
      },
      {
        key: 'email',
        label: 'E-mail',
        type: 'text',
        placeholder: 'admin@empresa.com',
        required: true,
      },
      {
        key: 'apiToken',
        label: 'API Token',
        type: 'password',
        placeholder: 'ATATT3x...',
        required: true,
      },
    ],
  },
];

interface SavedIntegration {
  id: string;
  provider: string;
  connectionKey?: string;
  status: string;
  config: Record<string, any>;
}

interface OrgRepository {
  id: string;
  fullName: string;
  source: string;
  language: string | null;
  defaultBranch: string;
  createdAt: string;
  _count: { pullRequests: number; commits: number; deployments: number };
}

function IntegrationsPageContent() {
  const [savedIntegrations, setSavedIntegrations] = useState<SavedIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [error, setError] = useState('');

  const { user, effectiveOrganizationId: orgId } = useAuth();
  const [searchParams] = useSearchParams();

  const [wizardServiceId, setWizardServiceId] = useState<ServiceId | null>(null);

  const [backfillSource, setBackfillSource] = useState<'github' | 'gitlab' | 'jira'>('github');
  const [backfillDays, setBackfillDays] = useState(30);
  const [backfillRepos, setBackfillRepos] = useState('');
  const [backfillProjects, setBackfillProjects] = useState('');
  const [backfillJiraConnectionKey, setBackfillJiraConnectionKey] = useState('');
  const [backfillLoading, setBackfillLoading] = useState(false);
  const [backfillJobs, setBackfillJobs] = useState<Array<{ id: string; source: string; status: string; progress: number; message: string; startedAt: string; isScheduled?: boolean }>>([]);

  const [repositories, setRepositories] = useState<OrgRepository[]>([]);
  const [reposLoading, setReposLoading] = useState(true);

  // Repo discovery state
  interface DiscoveredRepo {
    externalId: string;
    fullName: string;
    language: string | null;
    defaultBranch: string;
    private: boolean;
    archived: boolean;
    alreadyLinked: boolean;
  }
  const [discoveredRepos, setDiscoveredRepos] = useState<DiscoveredRepo[]>([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [discoverError, setDiscoverError] = useState<string | null>(null);
  const [selectedRepoIds, setSelectedRepoIds] = useState<Set<string>>(new Set());
  const [linkingRepos, setLinkingRepos] = useState(false);
  const [discoverConnectionKey, setDiscoverConnectionKey] = useState('');

  // Scheduler state
  const [schedulerStatus, setSchedulerStatus] = useState<{
    enabled: boolean;
    running: boolean;
    daysBack: number;
    cronExpression: string;
    lastRun: { startedAt: string; status: string; source: string } | null;
    totalAutoJobs: number;
  } | null>(null);
  const [schedulerTriggering, setSchedulerTriggering] = useState(false);

  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }
    api
      .get(`/organizations/${orgId}/integrations`)
      .then(setSavedIntegrations)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orgId]);

  useEffect(() => {
    api.get('/backfill/jobs').then((data: any) => setBackfillJobs(Array.isArray(data) ? data : [])).catch(() => {});
  }, [orgId, backfillLoading]);

  // Load scheduler status
  useEffect(() => {
    api.get('/backfill/scheduler/status').then(setSchedulerStatus).catch(() => {});
  }, [schedulerTriggering]);

  // Open provider form (and optionally wizard) when arriving with ?open=github|gitlab|jira
  useEffect(() => {
    const open = searchParams.get('open');
    if (open && ['github', 'gitlab', 'jira'].includes(open)) {
      setSelectedProvider(open);
      setFormData({});
      setTestResult(null);
      setError('');
      // Optional: auto-open wizard when coming from Help page
      const openWizard = searchParams.get('wizard');
      if (openWizard === '1') setWizardServiceId(open as ServiceId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!orgId) {
      setReposLoading(false);
      return;
    }
    setReposLoading(true);
    api
      .get(`/organizations/${orgId}/repositories`)
      .then((data: OrgRepository[]) => setRepositories(Array.isArray(data) ? data : []))
      .catch(() => setRepositories([]))
      .finally(() => setReposLoading(false));
  }, [orgId]);

  const handleStartBackfill = () => {
    if (!orgId) return;
    setBackfillLoading(true);
    const options: any = {
      organizationId: orgId,
      source: backfillSource,
      daysBack: backfillDays,
    };
    if (backfillSource === 'jira') {
      options.projects = backfillProjects.split(/[\s,]+/).filter(Boolean);
      options.jiraConnectionKey = backfillJiraConnectionKey;
    } else {
      options.repos = backfillRepos.split(/[\s,]+/).filter(Boolean);
    }
    api
      .post('/backfill/start', options)
      .then(() => {
        setBackfillRepos('');
        setBackfillProjects('');
        api.get('/backfill/jobs').then((data: any) => setBackfillJobs(Array.isArray(data) ? data : []));
        if (orgId) {
          api.get(`/organizations/${orgId}/repositories`).then((data: OrgRepository[]) => setRepositories(Array.isArray(data) ? data : [])).catch(() => {});
        }
      })
      .catch((err: any) => alert(err.message))
      .finally(() => setBackfillLoading(false));
  };

  const providerConfig = PROVIDERS.find((p) => p.provider === selectedProvider);

  const handleSave = async () => {
    if (!orgId || !selectedProvider) return;
    setSaving(true);
    setError('');
    try {
      const { connectionKey: connKey, ...restConfig } = formData;
      const connectionKey =
        selectedProvider === 'github' || selectedProvider === 'jira' ? (connKey ?? '').trim() : undefined;
      await api.post(`/organizations/${orgId}/integrations/${selectedProvider}`, {
        config: restConfig,
        ...(connectionKey !== undefined && { connectionKey }),
      });
      const updated = await api.get(`/organizations/${orgId}/integrations`);
      setSavedIntegrations(updated);
      setSelectedProvider(null);
      setFormData({});
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!orgId || !selectedProvider) return;
    setTesting(true);
    setTestResult(null);
    try {
      const result = await api.post(
        `/organizations/${orgId}/integrations/${selectedProvider}/test`,
        { config: formData },
      );
      setTestResult(result);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setTesting(false);
    }
  };

  const handleDelete = async (provider: string, connectionKey?: string) => {
    if (!orgId) return;
    const label =
      provider === 'github' && connectionKey
        ? `GitHub (org: ${connectionKey})`
        : provider === 'jira' && connectionKey
          ? `Jira (${connectionKey})`
          : provider;
    if (!confirm(`Remover integração ${label}?`)) return;
    try {
      const url =
        connectionKey != null && connectionKey !== ''
          ? `/organizations/${orgId}/integrations/${provider}?connectionKey=${encodeURIComponent(connectionKey)}`
          : `/organizations/${orgId}/integrations/${provider}`;
      await api.delete(url);
      setSavedIntegrations((prev) =>
        prev.filter(
          (i) => !(i.provider === provider && (connectionKey ?? '') === (i.connectionKey ?? '')),
        ),
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDiscoverRepos = async () => {
    if (!orgId) return;
    setDiscoverLoading(true);
    setDiscoverError(null);
    setDiscoveredRepos([]);
    setSelectedRepoIds(new Set());
    try {
      const ckParam = discoverConnectionKey ? `?connectionKey=${encodeURIComponent(discoverConnectionKey)}` : '';
      const data = await api.get<{ repos: DiscoveredRepo[] }>(`/organizations/${orgId}/repositories/discover${ckParam}`);
      setDiscoveredRepos(data.repos ?? []);
    } catch (err: any) {
      setDiscoverError(err.message || 'Erro ao buscar repositórios');
    }
    setDiscoverLoading(false);
  };

  const handleToggleRepo = (externalId: string) => {
    setSelectedRepoIds((prev) => {
      const next = new Set(prev);
      if (next.has(externalId)) next.delete(externalId);
      else next.add(externalId);
      return next;
    });
  };

  const handleSelectAll = () => {
    const available = discoveredRepos.filter((r) => !r.alreadyLinked && !r.archived);
    if (selectedRepoIds.size === available.length) {
      setSelectedRepoIds(new Set());
    } else {
      setSelectedRepoIds(new Set(available.map((r) => r.externalId)));
    }
  };

  const handleLinkSelected = async () => {
    if (!orgId || selectedRepoIds.size === 0) return;
    setLinkingRepos(true);
    try {
      const reposToLink = discoveredRepos
        .filter((r) => selectedRepoIds.has(r.externalId))
        .map((r) => ({
          externalId: r.externalId,
          fullName: r.fullName,
          language: r.language,
          defaultBranch: r.defaultBranch,
        }));
      await api.post(`/organizations/${orgId}/repositories/link`, { repos: reposToLink });
      // Refresh linked repos
      const updated = await api.get<OrgRepository[]>(`/organizations/${orgId}/repositories`);
      setRepositories(Array.isArray(updated) ? updated : []);
      // Update discovery list to reflect new links
      setDiscoveredRepos((prev) =>
        prev.map((r) =>
          selectedRepoIds.has(r.externalId) ? { ...r, alreadyLinked: true } : r,
        ),
      );
      setSelectedRepoIds(new Set());
    } catch (err: any) {
      alert(err.message || 'Erro ao vincular repositórios');
    }
    setLinkingRepos(false);
  };

  const handleUnlinkRepo = async (repoId: string, fullName: string) => {
    if (!orgId) return;
    if (!confirm(`Desvincular o repositório ${fullName} desta organização? Os dados já importados permanecem no sistema.`)) return;
    try {
      await api.delete(`/organizations/${orgId}/repositories/${repoId}`);
      setRepositories((prev) => prev.filter((r) => r.id !== repoId));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleTriggerScheduler = async () => {
    setSchedulerTriggering(true);
    try {
      const result = await api.post('/backfill/scheduler/trigger', {});
      alert(result.message || 'Ciclo de backfill automático iniciado.');
      // Refresh jobs list after a short delay
      setTimeout(() => {
        api.get('/backfill/jobs').then((data: any) => setBackfillJobs(Array.isArray(data) ? data : [])).catch(() => {});
        api.get('/backfill/scheduler/status').then(setSchedulerStatus).catch(() => {});
      }, 2000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSchedulerTriggering(false);
    }
  };

  const isConfigured = (provider: string) =>
    savedIntegrations.some((i) => i.provider === provider);

  const githubConnections = savedIntegrations.filter((i) => i.provider === 'github');
  const jiraConnections = savedIntegrations.filter((i) => i.provider === 'jira');

  // When Jira is selected and we have connections, default the dropdown to the first connection
  useEffect(() => {
    if (backfillSource !== 'jira' || jiraConnections.length === 0) return;
    const keys = jiraConnections.map((c) => c.connectionKey ?? '');
    setBackfillJiraConnectionKey((prev) => (keys.includes(prev) ? prev : keys[0] ?? ''));
  }, [backfillSource, jiraConnections]);

  if (!orgId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Integrações</h1>
        <div className="rounded-lg border border-yellow-400/20 bg-yellow-400/5 p-6 text-yellow-400">
          Nenhuma organização selecionada. Configure uma organização primeiro.
        </div>
      </div>
    );
  }

  const wizardService = wizardServiceId ? getServiceHelp(wizardServiceId) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-foreground">Integrações</h1>
        <Link
          to="/help"
          className="text-sm text-muted-foreground hover:text-foreground-secondary underline"
        >
          FAQ e guias de configuração
        </Link>
      </div>

      {/* Provider cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {PROVIDERS.map((p) => {
          const configured = isConfigured(p.provider);
          const isGitHub = p.provider === 'github';
          const isJira = p.provider === 'jira';
          const connections = isGitHub
            ? githubConnections
            : isJira
              ? jiraConnections
              : configured
                ? [savedIntegrations.find((i) => i.provider === p.provider)!].filter(Boolean)
                : [];

          return (
            <div
              key={p.provider}
              className={`rounded-xl border p-6 transition-colors ${
                configured
                  ? 'border-green-500/30 bg-green-500/5'
                  : 'border-border-default bg-surface'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{p.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{p.label}</h3>
                    <p className="text-sm text-muted">
                      {isGitHub && githubConnections.length > 0
                        ? `Configurado (${githubConnections.length} conexão(ões))`
                        : isJira && jiraConnections.length > 0
                          ? `Configurado (${jiraConnections.length} conexão(ões))`
                          : configured
                            ? 'Configurado'
                            : 'Não configurado'}
                    </p>
                  </div>
                </div>
                {configured && (
                  <span className="flex h-3 w-3 rounded-full bg-green-500" />
                )}
              </div>

              {isGitHub && githubConnections.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {githubConnections.map((conn) => {
                    const label = (conn.connectionKey && conn.connectionKey !== '') ? `Org: ${conn.connectionKey}` : 'Conexão padrão';
                    return (
                      <li
                        key={conn.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface-hover/50 px-3 py-2 text-sm"
                      >
                        <span className="text-foreground-secondary">{label}</span>
                        <span className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedProvider('github');
                              setFormData({ connectionKey: conn.connectionKey ?? '' });
                              setTestResult(null);
                              setError('');
                            }}
                            className="text-foreground-secondary hover:text-foreground underline"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete('github', conn.connectionKey)}
                            className="text-red-400 hover:text-red-300 underline"
                          >
                            Remover
                          </button>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
              {isJira && jiraConnections.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {jiraConnections.map((conn) => {
                    const label = (conn.connectionKey && conn.connectionKey !== '') ? conn.connectionKey : 'Conexão padrão';
                    return (
                      <li
                        key={conn.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface-hover/50 px-3 py-2 text-sm"
                      >
                        <span className="text-foreground-secondary">{label}</span>
                        <span className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedProvider('jira');
                              setFormData({ connectionKey: conn.connectionKey ?? '' });
                              setTestResult(null);
                              setError('');
                            }}
                            className="text-foreground-secondary hover:text-foreground underline"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete('jira', conn.connectionKey)}
                            className="text-red-400 hover:text-red-300 underline"
                          >
                            Remover
                          </button>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setSelectedProvider(p.provider);
                    setFormData(isGitHub || isJira ? { connectionKey: '' } : {});
                    setTestResult(null);
                    setError('');
                  }}
                  className="rounded-lg bg-surface-hover px-4 py-2 text-sm text-foreground-secondary hover:bg-surface-active transition-colors"
                >
                  {isGitHub && githubConnections.length > 0
                    ? 'Adicionar conexão'
                    : isJira && jiraConnections.length > 0
                      ? 'Adicionar conexão'
                      : configured
                        ? 'Editar'
                        : 'Configurar'}
                </button>
                {getServiceHelp(p.provider as ServiceId) && (
                  <button
                    onClick={() => setWizardServiceId(p.provider as ServiceId)}
                    className="rounded-lg border border-border-default px-4 py-2 text-sm text-foreground-secondary hover:bg-surface-hover transition-colors"
                  >
                    Guia
                  </button>
                )}
                {!isGitHub && !isJira && configured && (
                  <button
                    onClick={() => handleDelete(p.provider)}
                    className="rounded-lg border border-red-500/20 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    Remover
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Setup wizard (modal-like) */}
      {selectedProvider && providerConfig && (
        <div className="rounded-xl border border-border-default bg-surface p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">
              {providerConfig.icon} Configurar {providerConfig.label}
            </h2>
            <button
              onClick={() => setSelectedProvider(null)}
              className="text-muted hover:text-foreground-secondary text-sm"
            >
              Cancelar
            </button>
          </div>

          {!user && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600 dark:text-amber-400">
              Para salvar ou testar integrações é necessário fazer login com um usuário admin.
              Se você rodou o seed, use usuário <strong>admin</strong> e senha <strong>admin123</strong>.
              {' '}
              <a href="/login" className="underline font-medium">Ir para login</a>
            </div>
          )}

          <div className="space-y-4">
            {providerConfig.fields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-foreground-secondary mb-1">
                  {field.label}
                  {field.required && <span className="text-red-400"> *</span>}
                </label>
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  value={formData[field.key] || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  className="w-full rounded-lg border border-border-default bg-surface-hover px-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {field.help && (
                  <p className="mt-1.5 text-xs text-muted-foreground">{field.help}</p>
                )}
              </div>
            ))}
          </div>

          {testResult && (
            <div
              className={`rounded-lg border px-4 py-3 text-sm ${
                testResult.success
                  ? 'border-green-500/30 bg-green-500/10 text-green-400'
                  : 'border-red-400/20 bg-red-400/10 text-red-400'
              }`}
            >
              {testResult.success ? 'Conexão OK' : 'Falha'}: {testResult.message}
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleTest}
              disabled={testing || !user}
              className="rounded-lg border border-border-default px-5 py-2.5 text-sm font-medium text-foreground-secondary hover:bg-surface-hover transition-colors disabled:opacity-50"
            >
              {testing ? 'Testando...' : 'Testar conexão'}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !user}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      )}

      {/* Historical backfill */}
      <section className="rounded-xl border border-border-default bg-surface p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground-secondary">Historical backfill</h2>
        <p className="text-sm text-muted">
          Import past PRs/MRs and deployments from GitHub, GitLab or Jira.
        </p>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Source</label>
            <select
              value={backfillSource}
              onChange={(e) => setBackfillSource(e.target.value as any)}
              className="rounded-lg border border-border-default bg-surface-hover px-3 py-2 text-sm"
            >
              <option value="github">GitHub</option>
              <option value="gitlab">GitLab</option>
              <option value="jira">Jira</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Days back</label>
            <input
              type="number"
              min={1}
              max={365}
              value={backfillDays}
              onChange={(e) => setBackfillDays(Number(e.target.value))}
              className="rounded-lg border border-border-default bg-surface-hover px-3 py-2 text-sm w-24"
            />
          </div>
          {(backfillSource === 'github' || backfillSource === 'gitlab') && (
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-muted-foreground mb-1">
                Repos (ex.: org1/repo1, org2/repo2 — pode usar várias organizações)
              </label>
              <input
                type="text"
                placeholder="org1/repo1 org2/repo2"
                value={backfillRepos}
                onChange={(e) => setBackfillRepos(e.target.value)}
                className="w-full rounded-lg border border-border-default bg-surface-hover px-3 py-2 text-sm"
              />
            </div>
          )}
          {backfillSource === 'jira' && (
            <>
              {jiraConnections.length > 0 && (
                <div className="flex-1 min-w-[180px]">
                  <label className="block text-xs text-muted-foreground mb-1">Conexão Jira (BU/empresa)</label>
                  <select
                    value={backfillJiraConnectionKey}
                    onChange={(e) => setBackfillJiraConnectionKey(e.target.value)}
                    className="w-full rounded-lg border border-border-default bg-surface-hover px-3 py-2 text-sm"
                  >
                    {jiraConnections.map((conn) => (
                      <option key={conn.id} value={conn.connectionKey ?? ''}>
                        {(conn.connectionKey && conn.connectionKey !== '') ? conn.connectionKey : 'Conexão padrão'}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs text-muted-foreground mb-1">Project keys (ex.: ENG, PLATFORM)</label>
                <input
                  type="text"
                  placeholder="ENG PLATFORM"
                  value={backfillProjects}
                  onChange={(e) => setBackfillProjects(e.target.value)}
                  className="w-full rounded-lg border border-border-default bg-surface-hover px-3 py-2 text-sm"
                />
              </div>
            </>
          )}
          <button
            onClick={handleStartBackfill}
            disabled={
              backfillLoading ||
              (backfillSource === 'jira'
                ? !backfillProjects.trim() || jiraConnections.length === 0
                : !backfillRepos.trim())
            }
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {backfillLoading ? 'Starting...' : 'Start backfill'}
          </button>
        </div>
        {backfillJobs.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-foreground-secondary mb-2">Recent jobs</h3>
            <ul className="space-y-2">
              {backfillJobs.slice(0, 10).map((job) => (
                <li
                  key={job.id}
                  className="flex items-center justify-between rounded-lg border border-border-default bg-surface-hover/50 px-3 py-2 text-sm"
                >
                  <span className="text-foreground-secondary flex items-center gap-2">
                    {job.isScheduled && (
                      <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-400 border border-blue-500/20">
                        auto
                      </span>
                    )}
                    {job.source} — {job.status} ({job.progress}%)
                  </span>
                  <span className="text-muted-foreground text-xs">{job.message}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Automatic Backfill Scheduler */}
      <section className="rounded-xl border border-border-default bg-surface p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground-secondary">Backfill Automático</h2>
            <p className="text-sm text-muted mt-1">
              O sistema executa automaticamente um backfill a cada 6 horas para todos os repositórios vinculados, garantindo que nenhum dado seja perdido caso webhooks falhem.
            </p>
          </div>
          {schedulerStatus && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                schedulerStatus.enabled
                  ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                  : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${schedulerStatus.enabled ? 'bg-green-500' : 'bg-yellow-500'}`} />
              {schedulerStatus.enabled ? 'Ativo' : 'Desativado'}
            </span>
          )}
        </div>

        {schedulerStatus ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-border-default bg-surface-hover/50 p-4">
              <p className="text-xs text-muted-foreground mb-1">Frequência</p>
              <p className="text-sm font-medium text-foreground">A cada 6 horas</p>
              <p className="text-xs text-muted-foreground mt-1">Cron: {schedulerStatus.cronExpression}</p>
            </div>
            <div className="rounded-lg border border-border-default bg-surface-hover/50 p-4">
              <p className="text-xs text-muted-foreground mb-1">Período por execução</p>
              <p className="text-sm font-medium text-foreground">Últimos {schedulerStatus.daysBack} dia(s)</p>
              <p className="text-xs text-muted-foreground mt-1">Env: BACKFILL_SCHEDULER_DAYS</p>
            </div>
            <div className="rounded-lg border border-border-default bg-surface-hover/50 p-4">
              <p className="text-xs text-muted-foreground mb-1">Última execução</p>
              {schedulerStatus.lastRun ? (
                <>
                  <p className="text-sm font-medium text-foreground">
                    {new Date(schedulerStatus.lastRun.startedAt).toLocaleString('pt-BR')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {schedulerStatus.lastRun.source} — {schedulerStatus.lastRun.status}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma execução ainda</p>
              )}
            </div>
            <div className="rounded-lg border border-border-default bg-surface-hover/50 p-4">
              <p className="text-xs text-muted-foreground mb-1">Total de execuções auto</p>
              <p className="text-sm font-medium text-foreground">{schedulerStatus.totalAutoJobs}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {schedulerStatus.running ? (
                  <span className="text-blue-400">Em execução...</span>
                ) : (
                  'Aguardando próximo ciclo'
                )}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Carregando status do scheduler...</p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleTriggerScheduler}
            disabled={schedulerTriggering || schedulerStatus?.running}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
          >
            {schedulerTriggering || schedulerStatus?.running ? 'Executando...' : 'Executar agora'}
          </button>
          <p className="text-xs text-muted-foreground">
            Dispara manualmente um ciclo de backfill para todas as integrações ativas.
          </p>
        </div>

        {!schedulerStatus?.enabled && (
          <div className="rounded-lg border border-yellow-400/20 bg-yellow-400/5 p-4 text-sm text-yellow-400">
            O scheduler está desativado. Para ativá-lo, defina <code className="bg-surface-hover rounded px-1.5 py-0.5 text-xs">BACKFILL_SCHEDULER_ENABLED=true</code> nas variáveis de ambiente do servidor.
          </div>
        )}
      </section>

      {/* ─── Discover & Select GitHub Repositories ──────────────── */}
      <section className="rounded-xl border border-border-default bg-surface p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground-secondary">Descobrir repositórios GitHub</h2>
        <p className="text-sm text-muted">
          Busque todos os repositórios disponíveis no GitHub com o token configurado e selecione quais deseja incluir nas métricas.
        </p>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Organização GitHub (connectionKey)</label>
            <input
              type="text"
              value={discoverConnectionKey}
              onChange={(e) => setDiscoverConnectionKey(e.target.value)}
              placeholder="ex.: minha-org (vazio = padrão)"
              className="w-64 rounded-lg border border-border-default bg-surface-hover/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleDiscoverRepos}
            disabled={discoverLoading || !orgId}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {discoverLoading ? 'Buscando…' : 'Buscar repositórios'}
          </button>
        </div>

        {discoverError && (
          <p className="text-sm text-red-400">{discoverError}</p>
        )}

        {discoveredRepos.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {discoveredRepos.length} repositório(s) encontrado(s) · {discoveredRepos.filter((r) => r.alreadyLinked).length} já vinculado(s)
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs text-blue-400 hover:underline"
                >
                  {selectedRepoIds.size === discoveredRepos.filter((r) => !r.alreadyLinked && !r.archived).length
                    ? 'Desmarcar todos'
                    : 'Selecionar todos disponíveis'}
                </button>
                <button
                  type="button"
                  onClick={handleLinkSelected}
                  disabled={selectedRepoIds.size === 0 || linkingRepos}
                  className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  {linkingRepos
                    ? 'Vinculando…'
                    : `Vincular ${selectedRepoIds.size} selecionado(s)`}
                </button>
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto rounded-lg border border-border-default">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-surface">
                  <tr className="border-b border-border-default text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-2 w-8"></th>
                    <th className="px-3 py-2">Repositório</th>
                    <th className="px-3 py-2">Linguagem</th>
                    <th className="px-3 py-2">Branch</th>
                    <th className="px-3 py-2 text-center">Visib.</th>
                    <th className="px-3 py-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {discoveredRepos.map((repo) => {
                    const isSelected = selectedRepoIds.has(repo.externalId);
                    const disabled = repo.alreadyLinked || repo.archived;
                    return (
                      <tr
                        key={repo.externalId}
                        onClick={() => !disabled && handleToggleRepo(repo.externalId)}
                        className={`border-b border-border-default last:border-0 cursor-pointer transition-colors ${
                          disabled
                            ? 'opacity-50 cursor-default'
                            : isSelected
                            ? 'bg-blue-500/10'
                            : 'hover:bg-surface-hover'
                        }`}
                      >
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={disabled}
                            onChange={() => handleToggleRepo(repo.externalId)}
                            className="rounded border-border-default"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td className="px-3 py-2 font-medium text-foreground">{repo.fullName}</td>
                        <td className="px-3 py-2">
                          {repo.language ? (
                            <span className="rounded bg-surface-active px-2 py-0.5 text-xs">{repo.language}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground text-xs">{repo.defaultBranch}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`text-xs ${repo.private ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {repo.private ? 'Privado' : 'Público'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          {repo.alreadyLinked ? (
                            <span className="inline-flex rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                              Vinculado
                            </span>
                          ) : repo.archived ? (
                            <span className="inline-flex rounded-full bg-gray-500/20 px-2 py-0.5 text-[10px] font-semibold text-gray-400">
                              Arquivado
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Disponível</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* Repositories linked to this organization */}
      <section className="rounded-xl border border-border-default bg-surface p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground-secondary">Repositórios vinculados</h2>
        <p className="text-sm text-muted">
          Repositórios que pertencem a esta organização (vinculados via backfill ou webhooks). As métricas do dashboard consideram apenas estes repositórios.
        </p>
        {reposLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : repositories.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum repositório vinculado. Execute um backfill de GitHub ou GitLab com os repos desejados para vinculá-los automaticamente.
          </p>
        ) : (
          <ul className="space-y-2">
            {repositories.map((repo) => (
              <li
                key={repo.id}
                className="flex items-center justify-between rounded-lg border border-border-default bg-surface-hover/50 px-4 py-3 text-sm"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-medium text-foreground">{repo.fullName}</span>
                  <span className="text-muted-foreground">{repo.source}</span>
                  {repo.language && (
                    <span className="rounded bg-surface-active px-2 py-0.5 text-xs text-foreground-secondary">
                      {repo.language}
                    </span>
                  )}
                  <span className="text-muted-foreground">
                    {repo._count.pullRequests} PRs · {repo._count.commits} commits
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleUnlinkRepo(repo.id, repo.fullName)}
                  className="rounded-lg border border-red-500/20 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  Desvincular
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {wizardService && (
        <SetupWizard
          service={wizardService}
          onClose={() => setWizardServiceId(null)}
          onGoToConfigure={() => {
            setWizardServiceId(null);
            setSelectedProvider(wizardService.id as 'github' | 'gitlab' | 'jira');
            setFormData({});
            setTestResult(null);
            setError('');
          }}
        />
      )}
    </div>
  );
}

export default function IntegrationsPage() {
  return <IntegrationsPageContent />;
}
