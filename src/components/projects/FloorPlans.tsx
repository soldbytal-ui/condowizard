'use client';

import { useState } from 'react';

type FloorPlan = { url: string; label?: string };

export default function FloorPlans({
  floorPlans,
  projectId,
  projectName,
}: {
  floorPlans: FloorPlan[];
  projectId: string;
  projectName: string;
}) {
  const [unlocked, setUnlocked] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!floorPlans || floorPlans.length === 0) return null;

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;
    setLoading(true);
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, projectId, source: 'floor_plan' }),
      });
      setUnlocked(true);
    } catch {
      setUnlocked(true);
    }
    setLoading(false);
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-text-primary mb-4">Floor Plans</h2>

      {!unlocked ? (
        <div className="relative rounded-2xl overflow-hidden border border-border">
          {/* Blurred preview */}
          <div className="grid grid-cols-2 gap-3 p-4 filter blur-md pointer-events-none select-none">
            {floorPlans.slice(0, 4).map((fp, i) => (
              <div key={i} className="aspect-[3/4] bg-surface2 rounded-xl overflow-hidden">
                <img src={fp.url} alt={fp.label || `${projectName} floor plan preview ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>

          {/* Gate overlay */}
          <div className="absolute inset-0 bg-bg/80 backdrop-blur-sm flex items-center justify-center">
            <form onSubmit={handleUnlock} className="bg-surface border border-border rounded-2xl p-6 max-w-sm w-full mx-4 space-y-4 shadow-2xl">
              <div className="text-center">
                <div className="w-12 h-12 bg-accent-blue/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-text-primary">View Floor Plans</h3>
                <p className="text-sm text-text-muted mt-1">
                  Enter your details to access {floorPlans.length} floor {floorPlans.length === 1 ? 'plan' : 'plans'} for {projectName}
                </p>
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name *"
                required
                className="w-full px-4 py-3 bg-surface2 border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue outline-none transition-colors"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address *"
                required
                className="w-full px-4 py-3 bg-surface2 border border-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue outline-none transition-colors"
              />
              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                {loading ? 'Unlocking...' : 'Unlock Floor Plans'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {floorPlans.map((fp, i) => (
              <button
                key={i}
                onClick={() => setLightboxIndex(i)}
                className="relative aspect-[3/4] rounded-xl overflow-hidden group cursor-pointer border border-border hover:border-accent-blue/40 transition-all bg-white"
              >
                <img
                  src={fp.url}
                  alt={fp.label || `Floor Plan ${i + 1}`}
                  className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                {fp.label && (
                  <span className="absolute bottom-2 left-2 text-xs bg-black/70 text-white px-2 py-0.5 rounded-full">
                    {fp.label}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Lightbox */}
          {lightboxIndex !== null && (
            <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={() => setLightboxIndex(null)}>
              <button
                onClick={() => setLightboxIndex(null)}
                className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl z-10"
              >
                &times;
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => i !== null && i > 0 ? i - 1 : floorPlans.length - 1); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-4xl z-10"
              >
                &#8249;
              </button>
              <div className="bg-white rounded-lg p-4 max-h-[85vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
                <img
                  src={floorPlans[lightboxIndex].url}
                  alt={floorPlans[lightboxIndex].label || `Floor Plan ${lightboxIndex + 1}`}
                  className="max-h-[80vh] max-w-full object-contain"
                />
                {floorPlans[lightboxIndex].label && (
                  <p className="text-center text-sm text-gray-600 mt-2">{floorPlans[lightboxIndex].label}</p>
                )}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => i !== null && i < floorPlans.length - 1 ? i + 1 : 0); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-4xl z-10"
              >
                &#8250;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
