import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useFilters } from '@/components/filters/filter-context';
import { InProgressTab } from '@/components/activity/in-progress-tab';
import { PullRequestsTab } from '@/components/activity/pull-requests-tab';
import { DeploysTab } from '@/components/activity/deploys-tab';
import { PipelineTab } from '@/components/activity/pipeline-tab';

type Tab = 'in-progress' | 'pull-requests' | 'deploys' | 'pipeline';

const TABS: { key: Tab; label: string }[] = [
  { key: 'in-progress', label: 'Em Andamento' },
  { key: 'pull-requests', label: 'Pull Requests' },
  { key: 'deploys', label: 'Deploys' },
  { key: 'pipeline', label: 'Pipeline' },
];

export default function ActivityPage() {
  const { effectiveOrganizationId: orgId } = useAuth();
  const { days, teamId } = useFilters();
  const [activeTab, setActiveTab] = useState<Tab>('in-progress');

  if (!orgId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Activity</h1>
        <p className="text-muted">Selecione uma organizacao.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Activity</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visao operacional em tempo real — o que esta acontecendo agora no codigo
        </p>
      </div>

      {/* ─── Tabs ────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-border-default">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-blue-500 text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Tab Content ─────────────────────────────────────── */}
      {activeTab === 'in-progress' && (
        <InProgressTab orgId={orgId} days={days} teamId={teamId ?? undefined} />
      )}
      {activeTab === 'pull-requests' && (
        <PullRequestsTab orgId={orgId} days={days} teamId={teamId ?? undefined} />
      )}
      {activeTab === 'deploys' && (
        <DeploysTab orgId={orgId} days={days} />
      )}
      {activeTab === 'pipeline' && (
        <PipelineTab orgId={orgId} days={days} />
      )}
    </div>
  );
}
