/**
 * Mock data for all API endpoints.
 * Activated when VITE_MOCK=true (or when no API URL is configured in production).
 */

const ORG_ID = 'mock-org-001';
const TEAM_IDS = ['team-alpha', 'team-beta', 'team-gamma'];
const PERSON_IDS = ['person-1', 'person-2', 'person-3', 'person-4', 'person-5'];

const PEOPLE = [
  { id: 'person-1', displayName: 'Ana Silva', primaryEmail: 'ana@empresa.com', avatarUrl: null },
  { id: 'person-2', displayName: 'Bruno Costa', primaryEmail: 'bruno@empresa.com', avatarUrl: null },
  { id: 'person-3', displayName: 'Carla Mendes', primaryEmail: 'carla@empresa.com', avatarUrl: null },
  { id: 'person-4', displayName: 'Diego Ferreira', primaryEmail: 'diego@empresa.com', avatarUrl: null },
  { id: 'person-5', displayName: 'Elena Souza', primaryEmail: 'elena@empresa.com', avatarUrl: null },
];

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function randomBetween(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

// ─── Route matcher ────────────────────────────────────────────

type MockHandler = (path: string, body?: any) => any;

const routes: Array<{ pattern: RegExp; handler: MockHandler }> = [];

function route(pattern: RegExp, handler: MockHandler) {
  routes.push({ pattern, handler });
}

export function matchMockRoute(path: string, body?: any): any | undefined {
  for (const r of routes) {
    if (r.pattern.test(path)) {
      return r.handler(path, body);
    }
  }
  return undefined;
}

// ─── Auth ─────────────────────────────────────────────────────

route(/\/auth\/login$/, () => ({
  token: 'mock-jwt-token',
  refreshToken: 'mock-refresh-token',
  user: {
    id: 'user-mock-001',
    username: 'admin',
    role: 'admin',
    organizationId: ORG_ID,
    personId: 'person-1',
  },
}));

route(/\/auth\/me$/, () => ({
  id: 'user-mock-001',
  username: 'admin',
  role: 'admin',
  organizationId: ORG_ID,
  personId: 'person-1',
}));

route(/\/auth\/refresh$/, () => ({
  token: 'mock-jwt-token-refreshed',
  refreshToken: 'mock-refresh-token-refreshed',
}));

route(/\/auth\/logout$/, () => ({ ok: true }));

// ─── Public ───────────────────────────────────────────────────

route(/\/public\/default-organization$/, () => ({
  id: ORG_ID,
  name: 'Acme Corp',
  slug: 'acme-corp',
}));

// ─── Organizations / Teams ────────────────────────────────────

route(/\/organizations\/[^/]+\/teams$/, () => [
  { id: 'team-alpha', name: 'Alpha Squad', slug: 'alpha', parentTeamId: null, _count: { members: 5 }, members: [{ role: 'lead', person: PEOPLE[0] }] },
  { id: 'team-beta', name: 'Beta Squad', slug: 'beta', parentTeamId: null, _count: { members: 4 }, members: [{ role: 'lead', person: PEOPLE[1] }] },
  { id: 'team-gamma', name: 'Gamma Squad', slug: 'gamma', parentTeamId: 'team-alpha', _count: { members: 3 }, members: [{ role: 'lead', person: PEOPLE[2] }] },
]);

// ─── Dashboard ────────────────────────────────────────────────

route(/\/metrics\/[^/]+\/dashboard/, () => ({
  dora: {
    deploymentFrequency: { value: 3.2, unit: 'deploys_per_day', level: 'high', trendPct: 12 },
    leadTimeForChanges: { value: 18.5, unit: 'hours', level: 'high', trendPct: -8 },
    changeFailureRate: { value: 0.04, unit: 'ratio', level: 'elite', trendPct: -15 },
    timeToRestore: { value: 1.2, unit: 'hours', level: 'elite', trendPct: -20 },
  },
  flow: {
    cycleTimeP85: 42,
    prPickupTimeAvg: 3.5,
    silentPrRate: 0.08,
    reviewDepthAvg: 1.8,
    avgCiTimeHours: 0.25,
  },
  busFactor: {
    busFactor: 3,
    atRiskComponents: [
      { path: 'src/payments/', owner: 'Ana Silva', ownershipPct: 85 },
      { path: 'src/auth/', owner: 'Bruno Costa', ownershipPct: 78 },
    ],
  },
}));

// ─── Cycle Time Breakdown ─────────────────────────────────────

route(/\/metrics\/[^/]+\/cycle-time\/breakdown/, () => ({
  codingTimeP75: 16,
  pickupTimeP75: 4.2,
  reviewTimeP75: 6.8,
  deployTimeP75: 1.5,
  totalCycleTimeP75: 28.5,
  prCount: 142,
}));

// ─── Cycle Time Scatter ───────────────────────────────────────

route(/\/metrics\/[^/]+\/cycle-time\/scatter/, () =>
  Array.from({ length: 40 }, (_, i) => ({
    id: `pr-scatter-${i}`,
    title: `Feature ${i + 1}`,
    size: Math.floor(Math.random() * 800) + 20,
    cycleTimeHours: randomBetween(2, 120),
    sizeCategory: ['xs', 's', 'm', 'l', 'xl'][Math.floor(Math.random() * 5)],
  }))
);

// ─── Cycle Time Histogram ─────────────────────────────────────

route(/\/metrics\/[^/]+\/cycle-time\/histogram/, () => ({
  buckets: [
    { faixa: '0-8h', count: 28 },
    { faixa: '8-24h', count: 45 },
    { faixa: '24-48h', count: 32 },
    { faixa: '48-72h', count: 18 },
    { faixa: '72-168h', count: 12 },
    { faixa: '168h+', count: 7 },
  ],
}));

// ─── Pull Requests (flow) ─────────────────────────────────────

route(/\/metrics\/[^/]+\/flow\/pull-requests/, () =>
  Array.from({ length: 25 }, (_, i) => ({
    id: `pr-${i}`,
    number: 100 + i,
    title: ['Fix auth token expiry', 'Add user dashboard', 'Refactor payment service', 'Update CI pipeline', 'Improve search indexing', 'Add dark mode support', 'Fix memory leak in worker', 'Add rate limiting'][i % 8],
    state: i < 5 ? 'open' : 'merged',
    createdAt: daysAgo(Math.floor(Math.random() * 30)),
    mergedAt: i < 5 ? null : daysAgo(Math.floor(Math.random() * 15)),
    cycleTimeHours: randomBetween(4, 96),
    additions: Math.floor(Math.random() * 500) + 10,
    deletions: Math.floor(Math.random() * 200) + 5,
    sizeCategory: ['xs', 's', 'm', 'l', 'xl'][Math.floor(Math.random() * 5)],
    source: 'github',
    riskScore: randomBetween(0, 1),
  }))
);

// ─── DORA ─────────────────────────────────────────────────────

route(/\/metrics\/[^/]+\/dora\b/, () => ({
  current: {
    deploymentFrequency: { value: 3.2, unit: 'deploys_per_day', level: 'high', trendPct: 12 },
    leadTimeForChanges: { value: 18.5, unit: 'hours', level: 'high', trendPct: -8 },
    changeFailureRate: { value: 0.04, unit: 'ratio', level: 'elite', trendPct: -15 },
    timeToRestore: { value: 1.2, unit: 'hours', level: 'elite', trendPct: -20 },
  },
  trends: { deploymentFrequency: 12, leadTimeForChanges: -8, changeFailureRate: -15, timeToRestore: -20 },
}));

// ─── Review Distribution ──────────────────────────────────────

route(/\/metrics\/[^/]+\/flow\/review-distribution/, () => ({
  silent: 8,
  oneReviewer: 52,
  twoPlus: 82,
  total: 142,
}));

// ─── Quality ──────────────────────────────────────────────────

route(/\/metrics\/[^/]+\/quality/, () => {
  const timelineDaily = Array.from({ length: 30 }, (_, i) => ({
    date: daysAgo(29 - i),
    label: `D${i + 1}`,
    prsMergedWithoutReview: Math.floor(Math.random() * 3),
    prSizeP75: Math.floor(Math.random() * 400) + 50,
    reviewDepthAvg: randomBetween(1, 3),
    newCodePct: randomBetween(60, 90),
    refactorPct: randomBetween(5, 25),
    reworkRate: randomBetween(2, 15),
    prMaturityAvg: randomBetween(60, 95),
    ciPassRate: randomBetween(85, 100),
  }));
  return {
    reworkRate: 8.2,
    ciPassRate: 94.5,
    silentPrRate: 0.056,
    reviewDepthAvg: 1.8,
    prsMergedWithoutReviewCount: 8,
    prsMergedWithoutReviewPerDay: 0.27,
    prSizeP75: 245,
    newCodePct: 72,
    refactorPct: 18,
    prMaturityAvg: 82,
    timelineDaily,
  };
});

// ─── Throughput ───────────────────────────────────────────────

route(/\/metrics\/[^/]+\/throughput/, () => {
  const timelineDaily = Array.from({ length: 30 }, (_, i) => ({
    date: daysAgo(29 - i),
    label: `D${i + 1}`,
    codeChanges: Math.floor(Math.random() * 5000) + 500,
    commits: Math.floor(Math.random() * 20) + 5,
    prsOpened: Math.floor(Math.random() * 8) + 1,
    prsMerged: Math.floor(Math.random() * 6) + 1,
    reviews: Math.floor(Math.random() * 12) + 2,
    deploys: Math.floor(Math.random() * 5) + 1,
    prsReviewed: Math.floor(Math.random() * 8) + 1,
  }));
  return {
    codeChanges: 48500,
    codeChangesPerDay: 1617,
    commitsTotal: 385,
    commitsPerDay: 12.8,
    prsOpened: 142,
    prsOpenedPerDay: 4.7,
    mergeFrequency: 4.2,
    mergeFrequencyUnit: 'PRs/day',
    reviewsCount: 256,
    reviewsPerDay: 8.5,
    deployFrequency: 3.2,
    deployFrequencyUnit: 'deploys/day',
    prsReviewed: 134,
    prsReviewedPerDay: 4.5,
    prsMerged: 126,
    prsPerWeek: [
      { weekStart: daysAgo(28), count: 28 },
      { weekStart: daysAgo(21), count: 32 },
      { weekStart: daysAgo(14), count: 35 },
      { weekStart: daysAgo(7), count: 31 },
    ],
    commitsPerPrAvg: 2.7,
    storyPointsResolved: 89,
    deploysTotal: 96,
    timelineDaily,
  };
});

// ─── DORA+ ────────────────────────────────────────────────────

route(/\/metrics\/[^/]+\/dora-plus/, () => ({
  mttrByEnvironment: { production: 1.2, staging: 0.5 },
  recoveryCount: { production: 3, staging: 7 },
}));

// ─── Bugs ─────────────────────────────────────────────────────

route(/\/metrics\/[^/]+\/bugs/, () => ({
  bugsOpen: 12,
  bugsResolved: 28,
  mttrBugsHoursMedian: 18.5,
  bugs: Array.from({ length: 10 }, (_, i) => ({
    id: `bug-${i}`,
    issueKey: `BUG-${100 + i}`,
    summary: ['Login fails on Safari', 'Dashboard timeout on large orgs', 'Email notification delay', 'CSV export missing columns', 'Dark mode color issues'][i % 5],
    status: i < 4 ? 'Open' : 'Resolved',
    resolvedAt: i < 4 ? null : daysAgo(Math.floor(Math.random() * 20)),
    leadTimeHours: i < 4 ? null : randomBetween(4, 72),
  })),
}));

// ─── Process Limits ───────────────────────────────────────────

route(/\/metrics\/[^/]+\/process-limits/, () => ({
  mean: 32,
  stdDev: 12,
  ucl: 68,
  lcl: 0,
  metric: 'cycle_time',
  dataPoints: Array.from({ length: 12 }, (_, i) => ({
    week: `W${i + 1}`,
    value: randomBetween(18, 55),
    isOutlier: i === 7,
  })),
}));

// ─── Teams Overview ───────────────────────────────────────────

route(/\/metrics\/[^/]+\/teams-overview/, () => [
  {
    teamId: 'team-alpha', teamName: 'Alpha Squad', parentTeamId: null, memberCount: 5,
    members: PEOPLE.slice(0, 5).map(p => ({ id: p.id, displayName: p.displayName, avatarUrl: p.avatarUrl })),
    cycleTimeP85: 38, prPickupTimeAvg: 3.2, deployFrequency: 4.1, prsOpened: 52, prSizeP75: 210,
  },
  {
    teamId: 'team-beta', teamName: 'Beta Squad', parentTeamId: null, memberCount: 4,
    members: PEOPLE.slice(1, 5).map(p => ({ id: p.id, displayName: p.displayName, avatarUrl: p.avatarUrl })),
    cycleTimeP85: 56, prPickupTimeAvg: 5.1, deployFrequency: 2.3, prsOpened: 38, prSizeP75: 340,
  },
  {
    teamId: 'team-gamma', teamName: 'Gamma Squad', parentTeamId: 'team-alpha', memberCount: 3,
    members: PEOPLE.slice(2, 5).map(p => ({ id: p.id, displayName: p.displayName, avatarUrl: p.avatarUrl })),
    cycleTimeP85: 24, prPickupTimeAvg: 2.1, deployFrequency: 5.8, prsOpened: 65, prSizeP75: 145,
  },
]);

// ─── Team Detail ──────────────────────────────────────────────

route(/\/teams\/[^/]+$/, () => ({
  id: 'team-alpha',
  name: 'Alpha Squad',
  slug: 'alpha',
  members: PEOPLE.slice(0, 5).map((p, i) => ({
    id: `membership-${i}`,
    role: i === 0 ? 'lead' : 'member',
    person: { ...p, isActive: true },
  })),
}));

// ─── Activity: Pull Requests ──────────────────────────────────

route(/\/metrics\/[^/]+\/activity\/pull-requests/, () => ({
  items: Array.from({ length: 15 }, (_, i) => ({
    id: `act-pr-${i}`,
    number: 200 + i,
    title: ['Implement caching layer', 'Fix race condition', 'Add API versioning', 'Improve error handling', 'Add monitoring hooks', 'Refactor database queries', 'Update dependencies'][i % 7],
    state: i < 3 ? 'open' : 'merged',
    effectiveStatus: i < 3 ? 'open' : 'merged',
    createdAt: daysAgo(Math.floor(Math.random() * 20)),
    mergedAt: i < 3 ? null : daysAgo(Math.floor(Math.random() * 10)),
    closedAt: null,
    updatedAt: daysAgo(Math.floor(Math.random() * 5)),
    cycleTimeHours: randomBetween(4, 72),
    pickupTimeHours: randomBetween(0.5, 12),
    reviewTimeHours: randomBetween(1, 24),
    additions: Math.floor(Math.random() * 400) + 10,
    deletions: Math.floor(Math.random() * 150) + 5,
    sizeCategory: ['xs', 's', 'm', 'l', 'xl'][Math.floor(Math.random() * 5)],
    headRef: `feature/task-${200 + i}`,
    baseRef: 'main',
    author: { displayName: PEOPLE[i % 5].displayName, avatarUrl: null },
    repository: { fullName: `acme/service-${['api', 'web', 'worker'][i % 3]}` },
    reviewsSummary: { total: Math.floor(Math.random() * 4), approved: Math.floor(Math.random() * 3), changesRequested: Math.floor(Math.random() * 2) },
    latestCheckRun: { conclusion: i % 4 === 0 ? 'failure' : 'success', status: 'completed' },
  })),
  pagination: { page: 1, perPage: 25, total: 15, totalPages: 1 },
}));

// ─── Activity: Deployments ────────────────────────────────────

route(/\/metrics\/[^/]+\/activity\/deployments/, () => ({
  summary: { totalDeploys: 96, successRate: 95.8, deploysPerDay: 3.2 },
  items: Array.from({ length: 12 }, (_, i) => ({
    id: `deploy-${i}`,
    environment: ['production', 'staging', 'preview'][i % 3],
    status: i === 3 ? 'failure' : 'success',
    deployedAt: daysAgo(Math.floor(i * 2.5)),
    commitSha: `abc${i}def${i}1234567890`.slice(0, 40),
    repository: { fullName: `acme/service-${['api', 'web'][i % 2]}` },
  })),
  pagination: { page: 1, perPage: 25, total: 12, totalPages: 1 },
}));

// ─── Activity: Check Runs ─────────────────────────────────────

route(/\/metrics\/[^/]+\/activity\/check-runs/, () => ({
  summary: { totalRuns: 284, successRate: 92.3, avgDurationSeconds: 185 },
  items: Array.from({ length: 12 }, (_, i) => ({
    id: `cr-${i}`,
    name: ['CI / Build', 'CI / Test', 'CI / Lint', 'CI / Deploy'][i % 4],
    status: 'completed',
    conclusion: i % 5 === 0 ? 'failure' : 'success',
    startedAt: daysAgo(Math.floor(i * 2)),
    durationSeconds: Math.floor(Math.random() * 300) + 30,
    repository: { fullName: `acme/service-${['api', 'web'][i % 2]}` },
    pullRequest: { number: 200 + i, title: `PR #${200 + i}` },
  })),
  pagination: { page: 1, perPage: 25, total: 12, totalPages: 1 },
}));

// ─── Copilot / AI Tools ──────────────────────────────────────

route(/\/copilot\/[^/]+\/metrics/, () => {
  const dailyMetrics = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return {
      date: d.toISOString().slice(0, 10),
      totalActiveUsers: Math.floor(Math.random() * 8) + 12,
      totalEngagedUsers: Math.floor(Math.random() * 6) + 8,
      codeCompletions: {
        totalSuggestions: Math.floor(Math.random() * 500) + 200,
        totalAcceptances: Math.floor(Math.random() * 200) + 80,
        totalLinesAccepted: Math.floor(Math.random() * 800) + 200,
        acceptanceRate: randomBetween(28, 42),
      },
      chat: {
        totalChats: Math.floor(Math.random() * 40) + 10,
        totalInsertions: Math.floor(Math.random() * 20) + 5,
        totalCopies: Math.floor(Math.random() * 15) + 3,
      },
    };
  });
  return {
    adoptionRate: 78,
    activeUsersAvg: 15,
    engagedUsersAvg: 11,
    totalLinesAccepted: 18500,
    totalSuggestions: 12400,
    acceptanceRate: 34,
    dailyMetrics,
    byLanguage: [
      { name: 'TypeScript', suggestions: 4200, acceptances: 1600, acceptanceRate: 38 },
      { name: 'Python', suggestions: 3100, acceptances: 1100, acceptanceRate: 35 },
      { name: 'Go', suggestions: 2800, acceptances: 980, acceptanceRate: 35 },
      { name: 'JavaScript', suggestions: 1500, acceptances: 520, acceptanceRate: 35 },
      { name: 'YAML', suggestions: 800, acceptances: 240, acceptanceRate: 30 },
    ],
    byEditor: [
      { name: 'VS Code', suggestions: 9200, acceptances: 3400 },
      { name: 'JetBrains', suggestions: 2800, acceptances: 900 },
      { name: 'Neovim', suggestions: 400, acceptances: 140 },
    ],
  };
});

// ─── Jira: WIP ────────────────────────────────────────────────

route(/\/metrics\/[^/]+\/jira\/wip/, () => ({
  total: 18,
  byPerson: PEOPLE.map((p, i) => ({ personId: p.id, displayName: p.displayName, wipCount: Math.floor(Math.random() * 5) + 1 })),
}));

// ─── Jira: Churn Rate ─────────────────────────────────────────

route(/\/metrics\/[^/]+\/jira\/churn-rate/, () => ({
  churnRate: 0.07,
  resolvedCount: 85,
  reopenedCount: 6,
  period: { start: daysAgo(30), end: new Date().toISOString() },
}));

// ─── Jira: Sprints ────────────────────────────────────────────

route(/\/metrics\/[^/]+\/jira\/sprints/, () => ({
  sprints: Array.from({ length: 6 }, (_, i) => ({
    sprintId: `sprint-${i}`,
    name: `Sprint ${20 - i}`,
    committedPoints: Math.floor(Math.random() * 20) + 30,
    completedPoints: Math.floor(Math.random() * 15) + 25,
    completionPct: Math.floor(Math.random() * 20) + 75,
    completedAt: daysAgo(i * 14),
  })),
}));

// ─── Jira: Flow Efficiency ────────────────────────────────────

route(/\/metrics\/[^/]+\/jira\/flow-efficiency/, () => ({
  avgEfficiencyPct: 38,
  medianEfficiencyPct: 42,
  byIssueType: { Story: 45, Bug: 32, Task: 38 },
  issueCount: 85,
}));

// ─── Jira: Investment ─────────────────────────────────────────

route(/\/metrics\/[^/]+\/jira\/investment/, () => ({
  totalPoints: 89,
  categories: [
    { name: 'Story', label: 'New Features (CapEx)', storyPoints: 52, issueCount: 18, pctOfTotal: 58 },
    { name: 'Bug', label: 'Bug Fixes', storyPoints: 22, issueCount: 12, pctOfTotal: 25 },
    { name: 'Task', label: 'Maintenance (OpEx)', storyPoints: 15, issueCount: 8, pctOfTotal: 17 },
  ],
}));

// ─── Jira: Cumulative Flow ────────────────────────────────────

route(/\/metrics\/[^/]+\/jira\/cumulative-flow/, () => ({
  points: Array.from({ length: 30 }, (_, i) => ({
    date: daysAgo(29 - i),
    label: `D${i + 1}`,
    toDo: Math.max(0, 20 - Math.floor(i * 0.5) + Math.floor(Math.random() * 3)),
    doing: Math.floor(Math.random() * 5) + 8,
    done: Math.floor(i * 2.5) + Math.floor(Math.random() * 3),
  })),
}));

// ─── Jira: Aging Chart ────────────────────────────────────────

route(/\/metrics\/[^/]+\/jira\/aging-chart/, () => ({
  points: Array.from({ length: 30 }, (_, i) => ({
    date: daysAgo(29 - i),
    label: `D${i + 1}`,
    wip: Math.floor(Math.random() * 5) + 8,
    mediaDias: randomBetween(3, 12),
  })),
}));

// ─── Insights Dashboard ──────────────────────────────────────

route(/\/insights-dashboard\/[^/]+\/ask/, () => ({
  answer: 'Com base nos dados do período, o time Alpha apresenta a melhor performance em Cycle Time (38h P85), enquanto o time Beta pode se beneficiar de pair programming para reduzir o pickup time de PRs. A taxa de deploy está saudável em 3.2/dia, acima do benchmark "High Performer" do DORA.',
}));

route(/\/insights-dashboard\/[^/]+\/sprint-report\//, () => ({
  sprintName: 'Sprint 20',
  report: 'O Sprint 20 entregou 32 dos 38 story points comprometidos (84% completion). Destaques: feature de caching implementada e bug crítico de login resolvido. 2 itens carryover: integração com API de pagamentos e refactor do worker de emails.',
  stats: { committed: 38, completed: 32, completionPct: 84, carryover: 2 },
}));

route(/\/insights-dashboard\/[^/]+/, () => ({
  healthScore: { score: 78, trendPct: 5, breakdown: { dora: 82, flow: 75, quality: 80, throughput: 74 }, period: { start: daysAgo(30), end: new Date().toISOString() } },
  digest: {
    content: 'O time de engenharia apresentou melhoria de 5% no health score geral. O Cycle Time P85 caiu para 42h, abaixo do limite de 48h. A taxa de deploy manteve-se acima de 3/dia.\n\nPontos de atenção: pickup time médio de PRs subiu para 3.5h e a taxa de PRs sem review (silent PRs) está em 8%, acima do ideal de 5%.\n\nRecomendação: implementar alertas automáticos para PRs sem review após 4h e revisar a distribuição de carga entre os times.',
    period: { start: daysAgo(30), end: new Date().toISOString() },
  },
  bottlenecks: [
    { type: 'PICKUP_TIME', title: 'PR Pickup Time elevado no Beta Squad', description: 'Média de 5.1h, acima do target de 4h', severity: 'warning' as const, metrics: { avg: 5.1, target: 4 } },
    { type: 'SILENT_PRS', title: 'PRs sem code review', description: '8% dos PRs foram mergeados sem revisão', severity: 'warning' as const, metrics: { rate: 0.08, target: 0.05 } },
  ],
  correlations: [
    { title: 'PR Size vs Cycle Time', description: 'PRs maiores que 300 linhas levam 2.3x mais tempo', coefficient: 0.72, metrics: { smallPrCycleTime: 18, largePrCycleTime: 42 } },
  ],
  recommendations: {
    items: [
      { title: 'Implementar PR size alerts', why: 'PRs grandes correlacionam com cycle time alto', impact: 'Redução estimada de 20% no cycle time', metrics: ['cycleTime', 'prSize'] },
      { title: 'Adicionar code owners para src/payments/', why: 'Bus factor de 1 neste componente crítico', impact: 'Redução de risco operacional', metrics: ['busFactor'] },
    ],
  },
  reviewerFatigue: [
    { prId: 'pr-7', title: 'Large refactor merged quickly', reviewerId: 'person-3', reviewMinutes: 2, size: 850 },
  ],
  burnoutRisk: [
    { personId: 'person-1', displayName: 'Ana Silva', score: 72, factors: ['High commit volume', 'Weekend activity', 'Long hours'] },
  ],
  anomalousPRs: [
    { prId: 'pr-12', number: 212, title: 'Massive dependency update', repo: 'acme/service-api', reason: 'Unusually large PR (2400 lines)', size: 2400 },
  ],
}));

// ─── People / Identity ────────────────────────────────────────

route(/\/identity\/persons\/[^/]+$/, () =>
  PEOPLE.map((p, i) => ({
    ...p,
    isActive: true,
    identities: [
      { id: `id-gh-${i}`, provider: 'github', externalId: `gh-${p.displayName.toLowerCase().replace(' ', '')}`, username: p.displayName.toLowerCase().replace(' ', '.'), email: p.primaryEmail },
      ...(i < 3 ? [{ id: `id-gl-${i}`, provider: 'gitlab', externalId: `gl-${i}`, username: null, email: p.primaryEmail }] : []),
    ],
    user: i === 0 ? { id: 'user-mock-001', username: 'admin', role: 'admin', lastLoginAt: daysAgo(0) } : null,
    _count: { pullRequests: Math.floor(Math.random() * 100) + 20, commits: Math.floor(Math.random() * 300) + 50, reviews: Math.floor(Math.random() * 80) + 10, skills: Math.floor(Math.random() * 15) + 3 },
  }))
);

route(/\/identity\/persons\/[^/]+\/invite/, () => ({
  created: true,
  existingIdentity: false,
  person: { id: 'person-new' },
}));

route(/\/identity\/person\/[^/]+\/link/, () => ({ ok: true }));

// ─── Proficiency ──────────────────────────────────────────────

route(/\/proficiency\/person\/[^/]+\/graph/, () => ({
  skills: [
    { name: 'TypeScript', category: 'Language', declared: 4, verified: 4, verifiedLevel: 'PROFICIENT', confidence: 0.92, decayFactor: 0.95, effectiveScore: 3.8, lastEvidence: daysAgo(3), evidenceCount: 48 },
    { name: 'React', category: 'Framework', declared: 4, verified: 3, verifiedLevel: 'COMPETENT', confidence: 0.85, decayFactor: 0.90, effectiveScore: 2.7, lastEvidence: daysAgo(5), evidenceCount: 32 },
    { name: 'Node.js', category: 'Runtime', declared: 3, verified: 3, verifiedLevel: 'COMPETENT', confidence: 0.78, decayFactor: 0.88, effectiveScore: 2.3, lastEvidence: daysAgo(12), evidenceCount: 21 },
    { name: 'PostgreSQL', category: 'Database', declared: 3, verified: 2, verifiedLevel: 'ADV_BEGINNER', confidence: 0.65, decayFactor: 0.82, effectiveScore: 1.6, lastEvidence: daysAgo(20), evidenceCount: 14 },
    { name: 'Docker', category: 'DevOps', declared: 2, verified: 2, verifiedLevel: 'ADV_BEGINNER', confidence: 0.70, decayFactor: 0.85, effectiveScore: 1.4, lastEvidence: daysAgo(15), evidenceCount: 8 },
    { name: 'Kubernetes', category: 'DevOps', declared: 2, verified: 1, verifiedLevel: 'NOVICE', confidence: 0.45, decayFactor: 0.75, effectiveScore: 0.8, lastEvidence: daysAgo(45), evidenceCount: 3 },
    { name: 'System Design', category: 'Architecture', declared: 4, verified: 3, verifiedLevel: 'COMPETENT', confidence: 0.72, decayFactor: 0.88, effectiveScore: 2.6, lastEvidence: daysAgo(8), evidenceCount: 18 },
    { name: 'Go', category: 'Language', declared: 1, verified: 1, verifiedLevel: 'NOVICE', confidence: 0.35, decayFactor: 0.70, effectiveScore: 0.7, lastEvidence: daysAgo(60), evidenceCount: 2 },
  ],
}));

// ─── AI Insights (personal) ──────────────────────────────────

route(/\/insights\/person\//, () => [
  { id: 'ins-1', type: 'PRAISE', title: 'Excelente cobertura em TypeScript', content: 'Suas contribuições em TypeScript mostram proficiência consistente com 48 evidências nos últimos 90 dias.', relatedSkills: ['TypeScript'], severity: 'info', status: 'NEW', createdAt: daysAgo(2) },
  { id: 'ins-2', type: 'GAP', title: 'Kubernetes precisa de prática', content: 'Apenas 3 evidências de uso de Kubernetes nos últimos 90 dias. Considere participar de projetos de infra para consolidar.', relatedSkills: ['Kubernetes', 'Docker'], severity: 'medium', status: 'NEW', createdAt: daysAgo(5) },
  { id: 'ins-3', type: 'RISK', title: 'Bus factor alto em src/payments/', content: 'Você é responsável por 85% do código em src/payments/. Considere pair programming para compartilhar conhecimento.', relatedSkills: ['System Design'], severity: 'high', status: 'NEW', createdAt: daysAgo(8) },
  { id: 'ins-4', type: 'GROWTH', title: 'Progressão para System Design Proficient', content: 'Com mais 5-8 contribuições em decisões arquiteturais, você pode alcançar o nível Proficient em System Design.', relatedSkills: ['System Design', 'Architecture'], severity: 'info', status: 'ACKNOWLEDGED', createdAt: daysAgo(12) },
]);

route(/\/insights\/[^/]+\/status/, () => ({ ok: true }));

// ─── Marketplace ──────────────────────────────────────────────

route(/\/marketplace\/[^/]+\/match-position/, () => [
  {
    personId: 'person-1', displayName: 'Ana Silva', matchScore: 92,
    matchedSkills: [
      { skill: 'TypeScript', required: 'PROFICIENT', actual: 'PROFICIENT', met: true },
      { skill: 'React', required: 'COMPETENT', actual: 'COMPETENT', met: true },
      { skill: 'System Design', required: 'PROFICIENT', actual: 'COMPETENT', met: false },
      { skill: 'Kubernetes', required: 'COMPETENT', actual: 'NOVICE', met: false },
    ],
    gaps: ['System Design', 'Kubernetes'],
  },
  {
    personId: 'person-2', displayName: 'Bruno Costa', matchScore: 78,
    matchedSkills: [
      { skill: 'TypeScript', required: 'PROFICIENT', actual: 'COMPETENT', met: false },
      { skill: 'React', required: 'COMPETENT', actual: 'PROFICIENT', met: true },
      { skill: 'System Design', required: 'PROFICIENT', actual: 'COMPETENT', met: false },
      { skill: 'Kubernetes', required: 'COMPETENT', actual: 'ADV_BEGINNER', met: false },
    ],
    gaps: ['TypeScript', 'System Design', 'Kubernetes'],
  },
]);

route(/\/marketplace\/[^/]+\/search/, () => [
  { person: PEOPLE[1], personId: 'person-2', skillName: 'Go', verifiedLevel: 'PROFICIENT', confidenceScore: 0.88, lastEvidenceAt: daysAgo(4), team: 'Beta Squad' },
  { person: PEOPLE[3], personId: 'person-4', skillName: 'Go', verifiedLevel: 'COMPETENT', confidenceScore: 0.72, lastEvidenceAt: daysAgo(12), team: 'Alpha Squad' },
]);

// ─── Mentoring ────────────────────────────────────────────────

route(/\/mentoring/, () => []);

// ─── Surveys ──────────────────────────────────────────────────

route(/\/surveys/, () => []);

// ─── Career Paths ─────────────────────────────────────────────

route(/\/career-paths/, () => []);

// ─── Integrations ─────────────────────────────────────────────

route(/\/integrations/, () => [
  { id: 'int-1', provider: 'github', status: 'active', organizationSlug: 'acme', connectedAt: daysAgo(90) },
  { id: 'int-2', provider: 'jira', status: 'active', organizationSlug: 'acme', connectedAt: daysAgo(60) },
]);

// ─── Settings ─────────────────────────────────────────────────

route(/\/settings/, () => ({ ok: true }));

// ─── Forecast ─────────────────────────────────────────────────

route(/\/metrics\/[^/]+\/forecast/, () => ({
  targetItems: 20,
  simulations: 10000,
  percentiles: { p50: 4, p85: 6, p95: 8 },
  histogram: Array.from({ length: 10 }, (_, i) => ({ weeks: i + 1, frequency: Math.max(0, 2000 - Math.abs(i - 4) * 500) })),
  weeksOfHistory: 12,
}));

// ─── Me Page ──────────────────────────────────────────────────

route(/\/me/, () => ({
  id: 'user-mock-001',
  username: 'admin',
  role: 'admin',
  organizationId: ORG_ID,
  personId: 'person-1',
  person: PEOPLE[0],
}));

// ─── Fallback catch-all (returns empty) ───────────────────────
// This is intentionally NOT added so that unmatched routes return undefined
// and the real API can be tried.
