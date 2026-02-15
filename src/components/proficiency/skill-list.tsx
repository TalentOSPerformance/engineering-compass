'use client';

interface Skill {
  name: string;
  category: string;
  declared: number | null;
  verified: number | null;
  verifiedLevel: string | null;
  confidence: number;
  decayFactor: number;
  effectiveScore: number | null;
  lastEvidence: string;
  evidenceCount: number;
}

const LEVEL_BADGE: Record<string, string> = {
  EXPERT: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  PROFICIENT: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  COMPETENT: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  ADV_BEGINNER: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  NOVICE: 'bg-muted/20 text-foreground-secondary border-muted/30',
};

const CATEGORY_LABEL: Record<string, string> = {
  language: 'Language',
  framework: 'Framework',
  pattern: 'Pattern',
  practice: 'Practice',
  soft_skill: 'Soft Skill',
};

function formatLevel(level: string): string {
  return level.replace('ADV_BEGINNER', 'Adv. Beginner')
    .replace('_', ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function SkillList({ skills }: { skills: Skill[] }) {
  return (
    <div className="space-y-3">
      {skills.map((skill) => {
        const isDecaying = skill.decayFactor < 0.7;
        const gapExists = skill.declared && skill.verified && skill.declared > skill.verified;

        return (
          <div
            key={skill.name}
            className={`rounded-xl border p-4 transition-colors ${
              isDecaying
                ? 'border-amber-500/30 bg-amber-500/5'
                : 'border-border-default bg-surface hover:border-border-default'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{skill.name}</span>
                    <span className="rounded-full bg-surface-hover px-2 py-0.5 text-[10px] text-muted">
                      {CATEGORY_LABEL[skill.category] || skill.category}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{skill.evidenceCount} evidence points</span>
                    <span>Last: {skill.lastEvidence}</span>
                    {isDecaying && (
                      <span className="text-amber-400">
                        Decaying ({Math.round(skill.decayFactor * 100)}%)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Declared */}
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground">Declared</p>
                  <p className="text-lg font-bold text-muted">
                    {skill.declared || '-'}
                  </p>
                </div>

                {/* Arrow */}
                <span className="text-muted-foreground">vs</span>

                {/* Verified */}
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground">Verified</p>
                  <p className="text-lg font-bold text-blue-400">
                    {skill.verified || '-'}
                  </p>
                </div>

                {/* Level badge */}
                {skill.verifiedLevel && (
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${LEVEL_BADGE[skill.verifiedLevel]}`}
                  >
                    {formatLevel(skill.verifiedLevel)}
                  </span>
                )}
              </div>
            </div>

            {/* Confidence bar */}
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-16">Confidence</span>
              <div className="flex-1 h-1.5 rounded-full bg-surface-hover">
                <div
                  className="h-1.5 rounded-full bg-blue-500 transition-all"
                  style={{ width: `${skill.confidence * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-muted w-10 text-right">
                {Math.round(skill.confidence * 100)}%
              </span>
            </div>

            {/* Gap indicator */}
            {gapExists && (
              <div className="mt-2 rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs text-amber-300">
                Gap detected: declared level ({skill.declared}) exceeds verified level ({skill.verified}).
                More evidence needed.
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
