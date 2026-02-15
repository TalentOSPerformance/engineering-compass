import { ReactNode } from 'react';

// ─── Types ──────────────────────────────────────────────────────

export interface PaginationInfo {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface RepositoryRef {
  id: string;
  fullName: string;
}

export interface AuthorRef {
  id: string;
  displayName: string;
  githubUsername: string | null;
}

export interface ReviewsSummary {
  total: number;
  approved: number;
  changesRequested: number;
}

export interface LatestCheckRun {
  name: string;
  status: string;
  conclusion: string | null;
}

export interface ActivityPR {
  id: string;
  number: number;
  title: string;
  state: string;
  effectiveStatus: string;
  isDraft: boolean;
  headRef: string | null;
  baseRef: string | null;
  additions: number;
  deletions: number;
  changedFiles: number;
  sizeCategory: string | null;
  cycleTimeHours: number | null;
  pickupTimeHours: number | null;
  reviewTimeHours: number | null;
  createdAt: string;
  mergedAt: string | null;
  closedAt: string | null;
  updatedAt: string;
  repository: RepositoryRef;
  author: AuthorRef | null;
  reviewsSummary: ReviewsSummary;
  latestCheckRun: LatestCheckRun | null;
  jiraIssueId: string | null;
}

export interface DeployItem {
  id: string;
  environment: string;
  status: string;
  commitSha: string | null;
  deployedAt: string;
  repository: RepositoryRef;
}

export interface CheckRunItem {
  id: string;
  name: string;
  status: string;
  conclusion: string | null;
  startedAt: string | null;
  completedAt: string | null;
  durationSeconds: number | null;
  repository: RepositoryRef;
  pullRequest: { id: string; number: number; title: string } | null;
}

// ─── Badge Components ───────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-500/15 text-gray-400',
  open: 'bg-green-500/15 text-green-400',
  'in-review': 'bg-yellow-500/15 text-yellow-400',
  approved: 'bg-emerald-500/15 text-emerald-400',
  'changes-requested': 'bg-orange-500/15 text-orange-400',
  merged: 'bg-purple-500/15 text-purple-400',
  closed: 'bg-red-500/15 text-red-400',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  open: 'Open',
  'in-review': 'In Review',
  approved: 'Approved',
  'changes-requested': 'Changes Req.',
  merged: 'Merged',
  closed: 'Closed',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
        STATUS_STYLES[status] ?? 'bg-muted text-muted-foreground'
      }`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

const SIZE_STYLES: Record<string, string> = {
  xs: 'bg-green-500/15 text-green-400',
  s: 'bg-emerald-500/15 text-emerald-400',
  m: 'bg-yellow-500/15 text-yellow-400',
  l: 'bg-orange-500/15 text-orange-400',
  xl: 'bg-red-500/15 text-red-400',
};

export function SizeBadge({ size }: { size: string | null }) {
  if (!size) return <span className="text-muted-foreground text-xs">—</span>;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${
        SIZE_STYLES[size] ?? 'bg-muted text-muted-foreground'
      }`}
    >
      {size}
    </span>
  );
}

const DEPLOY_STATUS_STYLES: Record<string, string> = {
  success: 'bg-emerald-500/15 text-emerald-400',
  failure: 'bg-red-500/15 text-red-400',
  pending: 'bg-yellow-500/15 text-yellow-400',
  unknown: 'bg-gray-500/15 text-gray-400',
};

export function DeployStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${
        DEPLOY_STATUS_STYLES[status] ?? 'bg-muted text-muted-foreground'
      }`}
    >
      {status}
    </span>
  );
}

const CI_CONCLUSION_STYLES: Record<string, string> = {
  success: 'bg-emerald-500/15 text-emerald-400',
  failure: 'bg-red-500/15 text-red-400',
  cancelled: 'bg-gray-500/15 text-gray-400',
  skipped: 'bg-gray-500/15 text-gray-400',
  in_progress: 'bg-blue-500/15 text-blue-400',
};

export function ConclusionBadge({ conclusion, status }: { conclusion: string | null; status: string }) {
  const display = conclusion ?? status;
  const key = conclusion ?? status;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${
        CI_CONCLUSION_STYLES[key] ?? 'bg-muted text-muted-foreground'
      }`}
    >
      {display.replace('_', ' ')}
    </span>
  );
}

// ─── Avatar ─────────────────────────────────────────────────────

export function Avatar({ author }: { author: AuthorRef | null }) {
  if (!author) return <span className="text-xs text-muted-foreground">—</span>;

  const ghUser = author.githubUsername;
  const avatarUrl = ghUser
    ? `https://github.com/${ghUser}.png?size=32`
    : null;

  return (
    <div className="flex items-center gap-2">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={author.displayName}
          className="h-5 w-5 rounded-full"
        />
      ) : (
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold">
          {author.displayName.charAt(0).toUpperCase()}
        </div>
      )}
      <span className="text-xs truncate max-w-[120px]">{author.displayName}</span>
    </div>
  );
}

// ─── Relative Time ──────────────────────────────────────────────

export function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  return `${months}mo`;
}

export function formatDuration(seconds: number | null): string {
  if (seconds == null) return '—';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export function formatHours(hours: number | null): string {
  if (hours == null) return '—';
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${Math.round(hours * 10) / 10}h`;
  return `${Math.round(hours / 24 * 10) / 10}d`;
}

// ─── Pagination ─────────────────────────────────────────────────

export function Pagination({
  pagination,
  onPageChange,
}: {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
}) {
  const { page, totalPages, total } = pagination;
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-4 border-t border-border-default">
      <span className="text-xs text-muted-foreground">
        {total} resultado{total !== 1 ? 's' : ''}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-md px-3 py-1 text-xs bg-surface-hover text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
        >
          Anterior
        </button>
        <span className="text-xs text-muted-foreground">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded-md px-3 py-1 text-xs bg-surface-hover text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
        >
          Proximo
        </button>
      </div>
    </div>
  );
}

// ─── Loading Skeleton ───────────────────────────────────────────

export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-3">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-4 rounded bg-muted/30 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Empty State ────────────────────────────────────────────────

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-16">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

// ─── Summary Card ───────────────────────────────────────────────

export function SummaryCard({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string | number;
  suffix?: string;
}) {
  return (
    <div className="rounded-xl border border-border-default bg-surface p-4">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="mt-1 text-xl font-bold font-mono text-foreground">
        {value}
        {suffix && <span className="text-xs font-normal text-muted-foreground ml-1">{suffix}</span>}
      </p>
    </div>
  );
}
