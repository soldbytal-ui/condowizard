'use client';

import { useState } from 'react';

type Service = {
  id: string;
  title: string;
  stat: string;
  statLabel: string;
  description: string;
  features: string[];
};

export default function StagingClient({ services }: { services: Service[] }) {
  const [active, setActive] = useState(services[0]?.id);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {services.map((s) => {
        const isActive = active === s.id;
        return (
          <button
            key={s.id}
            onClick={() => setActive(s.id)}
            className={`text-left bg-white rounded-2xl border-2 p-7 transition-all ${
              isActive
                ? 'border-accent-blue shadow-lg shadow-accent-blue/10 -translate-y-1'
                : 'border-border hover:border-accent-blue/30 hover:-translate-y-0.5'
            }`}
          >
            <div className="flex items-baseline justify-between mb-4">
              <h3 className="text-xl font-bold text-text-primary">{s.title}</h3>
              <div
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  isActive ? 'bg-accent-blue' : 'bg-surface2'
                }`}
              />
            </div>
            <div className="mb-5">
              <p className="font-serif text-4xl font-bold text-accent-blue leading-none">{s.stat}</p>
              <p className="text-xs text-text-muted uppercase tracking-wider font-semibold mt-1">
                {s.statLabel}
              </p>
            </div>
            <p className="text-sm text-text-muted leading-relaxed mb-5">{s.description}</p>
            <ul className="space-y-2">
              {s.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-text-primary">
                  <svg
                    className="w-4 h-4 text-accent-blue flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </button>
        );
      })}
    </div>
  );
}
