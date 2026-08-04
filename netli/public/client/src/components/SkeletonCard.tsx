export default function SkeletonCard() {
  return (
    <div className="glass-card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <div className="skeleton" style={{ width: 38, height: 38, borderRadius: 10 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 11, width: '40%' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <div className="skeleton" style={{ height: 22, width: 90, borderRadius: 999 }} />
        <div className="skeleton" style={{ height: 22, width: 70, borderRadius: 999 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="skeleton" style={{ height: 13, width: '45%' }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="skeleton" style={{ width: 30, height: 30, borderRadius: 8 }} />
          <div className="skeleton" style={{ width: 30, height: 30, borderRadius: 8 }} />
        </div>
      </div>
    </div>
  );
}
