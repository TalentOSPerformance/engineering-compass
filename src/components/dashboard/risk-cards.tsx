import { motion } from 'framer-motion';

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
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      {/* Bus Factor Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className={`relative rounded-md border p-5 overflow-hidden card-hover ${
          isCritical
            ? 'border-red-500/30 bg-red-500/5'
            : isWarning
              ? 'border-amber-500/30 bg-amber-500/5'
              : 'border-border-default bg-surface'
        }`}
      >
        {/* Left accent */}
        <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${
          isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
        }`} style={{ opacity: 0.7 }} />

        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-md text-2xl font-bold font-mono ${
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
          <div className="mt-4 rounded-sm bg-red-500/10 p-3 text-sm text-red-300 border border-red-500/20">
            If the top contributor leaves, &gt;50% of the codebase becomes orphaned.
            Immediate action: pair programming and knowledge sharing sessions.
          </div>
        )}
      </motion.div>

      {/* Ownership Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
        className="col-span-1 relative rounded-md border border-border-default bg-surface p-5 lg:col-span-2 card-hover overflow-hidden"
      >
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-accent opacity-30" />

        <p className="text-sm font-medium text-foreground-secondary">Code Ownership Distribution</p>
        <p className="mt-1 text-xs text-muted-foreground">Top contributors by file ownership</p>

        <div className="mt-4 space-y-3">
          {busFactor.atRiskComponents.map((comp) => (
            <div key={comp.owner} className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-hover text-xs font-medium text-foreground-secondary font-mono">
                {comp.owner.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground-secondary">{comp.owner}</span>
                  <span className="text-xs text-muted font-mono">{comp.path} ({comp.ownershipPct}%)</span>
                </div>
                <div className="mt-1 h-1 w-full rounded-sm bg-surface-hover overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${comp.ownershipPct}%` }}
                    transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
                    className={`h-1 rounded-sm ${
                      comp.ownershipPct > 40
                        ? 'bg-red-500'
                        : comp.ownershipPct > 25
                          ? 'bg-amber-500'
                          : 'bg-blue-500'
                    }`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
