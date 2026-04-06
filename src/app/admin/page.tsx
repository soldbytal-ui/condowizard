'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const STATUS_LABELS: Record<string, string> = {
  new: 'New', contacted: 'Contacted', showing: 'Showing',
  under_contract: 'Under Contract', closed: 'Closed', lost: 'Lost',
};

const STATUS_COLORS: Record<string, string> = {
  new: 'text-accent-green', contacted: 'text-accent-blue', showing: 'text-yellow-400',
  under_contract: 'text-accent-orange', closed: 'text-emerald-400', lost: 'text-red-400',
};

function formatCurrency(amount: number) {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount}`;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/admin/dashboard').then(r => r.json()).then(setStats);
    fetch('/api/admin/leads?limit=10').then(r => r.json()).then(d => setLeads(Array.isArray(d) ? d.slice(0, 10) : []));
  }, []);

  if (!stats) {
    return <div className="text-text-muted animate-pulse">Loading dashboard...</div>;
  }

  const statCards = [
    { label: 'Total Leads', value: stats.totalLeads, color: 'text-accent-green' },
    { label: 'This Week', value: stats.leadsThisWeek, color: 'text-accent-blue' },
    { label: 'Conversion', value: `${stats.conversionRate}%`, color: 'text-accent-orange' },
    { label: 'Pipeline', value: formatCurrency(stats.pipeline), color: 'text-emerald-400' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-muted mt-1">Overview of your lead pipeline</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(s => (
          <div key={s.label} className="glass-panel p-4 rounded-xl">
            <p className="text-xs text-text-muted uppercase tracking-wider">{s.label}</p>
            <p className={`text-2xl font-mono font-semibold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Pipeline Breakdown */}
      <div className="glass-panel p-5 rounded-xl">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Pipeline</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <div key={key} className="text-center">
              <p className={`text-xl font-mono font-semibold ${STATUS_COLORS[key]}`}>
                {stats.statusCounts?.[key] || 0}
              </p>
              <p className="text-xs text-text-muted mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Leads */}
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="p-5 flex items-center justify-between border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">Recent Leads</h2>
          <Link href="/admin/leads" className="text-xs text-accent-green hover:underline">View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-text-muted uppercase tracking-wider border-b border-border">
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3 hidden md:table-cell">Source</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3 hidden md:table-cell">Agent</th>
                <th className="text-left p-3 hidden md:table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {leads.map(lead => (
                <tr key={lead.id} className="border-b border-border/50 hover:bg-surface2/50 transition-colors">
                  <td className="p-3">
                    <Link href={`/admin/leads?id=${lead.id}`} className="text-sm text-text-primary hover:text-accent-green">
                      {lead.name}
                    </Link>
                    <p className="text-xs text-text-muted">{lead.email}</p>
                  </td>
                  <td className="p-3 text-xs text-text-muted hidden md:table-cell">{lead.source}</td>
                  <td className="p-3">
                    <span className={`text-xs font-medium ${STATUS_COLORS[lead.status] || 'text-text-muted'}`}>
                      {STATUS_LABELS[lead.status] || lead.status}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-text-muted hidden md:table-cell">{lead.assignedAgent?.name || '—'}</td>
                  <td className="p-3 text-xs text-text-muted hidden md:table-cell">
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-text-muted text-sm">No leads yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
