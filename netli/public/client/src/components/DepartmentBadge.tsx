const DEPT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Engineering: { bg: 'rgba(99,102,241,0.15)', text: '#a5b4fc', border: 'rgba(99,102,241,0.3)' },
  Sales:       { bg: 'rgba(245,158,11,0.15)', text: '#fcd34d', border: 'rgba(245,158,11,0.3)' },
  HR:          { bg: 'rgba(236,72,153,0.15)', text: '#f9a8d4', border: 'rgba(236,72,153,0.3)' },
  Marketing:   { bg: 'rgba(16,185,129,0.15)', text: '#6ee7b7', border: 'rgba(16,185,129,0.3)' },
  Finance:     { bg: 'rgba(249,115,22,0.15)', text: '#fdba74', border: 'rgba(249,115,22,0.3)' },
};

export function getDeptColor(dept: string) {
  return DEPT_COLORS[dept] ?? { bg: 'rgba(139,92,246,0.15)', text: '#c4b5fd', border: 'rgba(139,92,246,0.3)' };
}

export function getDeptSolid(dept: string): string {
  const MAP: Record<string, string> = {
    Engineering: '#6366f1',
    Sales: '#f59e0b',
    HR: '#ec4899',
    Marketing: '#10b981',
    Finance: '#f97316',
  };
  return MAP[dept] ?? '#8b5cf6';
}

export default function DepartmentBadge({ dept }: { dept: string }) {
  const { bg, text, border } = getDeptColor(dept);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 500,
        background: bg,
        color: text,
        border: `1px solid ${border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {dept}
    </span>
  );
}
