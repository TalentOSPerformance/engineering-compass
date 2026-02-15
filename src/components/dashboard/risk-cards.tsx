'use client';

interface BusFactorResult {
  busFactor: number;
  atRiskComponents: Array<{
    path: string;
    owner: string;
    ownershipPct: number;
  }>;
}

export function RiskCards({ busFactor }: { busFactor: BusFactorResult }) {
  const isCritical = busFactor.busFactor <= 1;
  const isWarning = busFactor.busFactor === 2;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Bus Factor Card */}
      <div
        className={`rounded-xl border p-6 ${
          isCritical
            ? 'border-red-500/30 bg-red-500/5'
            : isWarning
              ? 'border-amber-500/30 bg-amber-500/5'
              : 'border-border-default bg-surface'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl font-bold ${
              isCritical
                ? 'bg-red-500/20 text-red-400'
                : isWarning
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-emerald-500/20 text-emerald-400'
            }`}
          >
            {busFactor.busFactor}
          </div>
          <div>
            <p className="text-lg font-semibold">Bus Factor</p>
            <p className="text-xs text-muted">
              {isCritical
                ? 'CRITICAL: Extreme single-person dependency'
                : isWarning
                  ? 'WARNING: Low knowledge distribution'
                  : 'Healthy knowledge distribution'}
            </p>
          </div>
        </div>

        {isCritical && (
          <div className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">
            If the top contributor leaves, &gt;50% of the codebase becomes orphaned.
            Immediate action: pair programming and knowledge sharing sessions.
          </div>
        )}
      </div>

      {/* Ownership Distribution */}
      <div className="col-span-1 rounded-xl border border-border-default bg-surface p-6 lg:col-span-2">
        <p className="text-sm font-medium text-foreground-secondary">Code Ownership Distribution</p>
        <p className="mt-1 text-xs text-muted-foreground">Top contributors by file ownership</p>

        <div className="mt-4 space-y-3">
          {busFactor.atRiskComponents.map((comp) => (
            <div key={comp.owner} className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-hover text-xs font-medium text-foreground-secondary">
                {comp.owner.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground-secondary">{comp.owner}</span>
                  <span className="text-xs text-muted">{comp.path} ({comp.ownershipPct}%)</span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-surface-hover">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      comp.ownershipPct > 40
                        ? 'bg-red-500'
                        : comp.ownershipPct > 25
                          ? 'bg-amber-500'
                          : 'bg-blue-500'
                    }`}
                    style={{ width: `${comp.ownershipPct}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
