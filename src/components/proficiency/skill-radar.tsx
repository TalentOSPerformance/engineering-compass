'use client';

interface Skill {
  name: string;
  declared: number | null;
  verified: number | null;
  verifiedLevel: string | null;
}

export function SkillRadar({ skills }: { skills: Skill[] }) {
  const topSkills = skills.filter((s) => s.verified !== null).slice(0, 8);
  const size = 300;
  const center = size / 2;
  const maxLevel = 5;
  const levels = [1, 2, 3, 4, 5];

  // Calculate points for radar
  const angleStep = (2 * Math.PI) / topSkills.length;

  const getPoint = (index: number, value: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const radius = (value / maxLevel) * (center - 40);
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  };

  const declaredPoints = topSkills
    .map((s, i) => getPoint(i, s.declared || 0))
    .map((p) => `${p.x},${p.y}`)
    .join(' ');

  const verifiedPoints = topSkills
    .map((s, i) => getPoint(i, s.verified || 0))
    .map((p) => `${p.x},${p.y}`)
    .join(' ');

  return (
    <div className="rounded-xl border border-border-default bg-surface p-6">
      <div className="flex items-center gap-6 mb-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-muted/50" />
          <span className="text-xs text-muted">Declared</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-blue-500" />
          <span className="text-xs text-muted">Verified (AI)</span>
        </div>
      </div>

      <div className="flex justify-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Grid circles */}
          {levels.map((level) => {
            const radius = (level / maxLevel) * (center - 40);
            return (
              <circle
                key={level}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="#27272a"
                strokeWidth="1"
              />
            );
          })}

          {/* Grid lines */}
          {topSkills.map((_, i) => {
            const point = getPoint(i, maxLevel);
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={point.x}
                y2={point.y}
                stroke="#27272a"
                strokeWidth="1"
              />
            );
          })}

          {/* Declared polygon */}
          <polygon
            points={declaredPoints}
            fill="rgba(113, 113, 122, 0.15)"
            stroke="rgba(113, 113, 122, 0.5)"
            strokeWidth="1.5"
          />

          {/* Verified polygon */}
          <polygon
            points={verifiedPoints}
            fill="rgba(59, 130, 246, 0.15)"
            stroke="rgba(59, 130, 246, 0.8)"
            strokeWidth="2"
          />

          {/* Labels */}
          {topSkills.map((skill, i) => {
            const labelPoint = getPoint(i, maxLevel + 0.7);
            return (
              <text
                key={skill.name}
                x={labelPoint.x}
                y={labelPoint.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-foreground-secondary text-[11px]"
              >
                {skill.name}
              </text>
            );
          })}

          {/* Verified dots */}
          {topSkills.map((skill, i) => {
            if (!skill.verified) return null;
            const point = getPoint(i, skill.verified);
            return (
              <circle
                key={`dot-${skill.name}`}
                cx={point.x}
                cy={point.y}
                r="4"
                fill="#3b82f6"
                stroke="#1e3a8a"
                strokeWidth="1.5"
              />
            );
          })}
        </svg>
      </div>

      {/* Dreyfus scale legend */}
      <div className="mt-4 flex justify-center gap-4 text-xs text-muted-foreground">
        <span>1: Novice</span>
        <span>2: Adv. Beginner</span>
        <span>3: Competent</span>
        <span>4: Proficient</span>
        <span>5: Expert</span>
      </div>
    </div>
  );
}
