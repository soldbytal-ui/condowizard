'use client';

import { useState, useEffect } from 'react';

const NEIGHBORHOODS = [
  'brickell','downtown-miami','edgewater','miami-beach','south-beach',
  'sunny-isles-beach','coconut-grove','coral-gables','surfside','bal-harbour',
  'bay-harbor-islands','key-biscayne','midtown-wynwood','design-district',
  'aventura','hollywood','fort-lauderdale','hallandale-beach','pompano-beach',
  'palm-beach','boca-raton','west-palm-beach',
];

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', licenseNumber: '', brokerage: '', neighborhoods: [] as string[] });
  const [error, setError] = useState('');

  const fetchAgents = async () => {
    const data = await fetch('/api/admin/agents').then(r => r.json());
    if (Array.isArray(data)) setAgents(data);
  };

  useEffect(() => { fetchAgents(); }, []);

  const createAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/admin/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ name: '', email: '', password: '', phone: '', licenseNumber: '', brokerage: '', neighborhoods: [] });
      fetchAgents();
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to create agent');
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await fetch('/api/admin/agents', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive: !isActive }),
    });
    fetchAgents();
  };

  const toggleNeighborhood = (slug: string) => {
    setForm(f => ({
      ...f,
      neighborhoods: f.neighborhoods.includes(slug)
        ? f.neighborhoods.filter(n => n !== slug)
        : [...f.neighborhoods, slug],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Agents</h1>
          <p className="text-sm text-text-muted mt-1">{agents.length} registered agents</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm py-2 px-4">
          {showForm ? 'Cancel' : '+ Add Agent'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={createAgent} className="glass-panel p-5 rounded-xl space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 text-sm text-red-400">{error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className="bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary" />
            <input placeholder="Email *" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required className="bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary" />
            <input placeholder="Password *" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required className="bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary" />
            <input placeholder="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary" />
            <input placeholder="License #" value={form.licenseNumber} onChange={e => setForm(f => ({ ...f, licenseNumber: e.target.value }))} className="bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary" />
            <input placeholder="Brokerage" value={form.brokerage} onChange={e => setForm(f => ({ ...f, brokerage: e.target.value }))} className="bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary" />
          </div>
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wider mb-2 block">Coverage Areas</label>
            <div className="flex flex-wrap gap-1.5">
              {NEIGHBORHOODS.map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => toggleNeighborhood(n)}
                  className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                    form.neighborhoods.includes(n)
                      ? 'bg-accent-green/10 border-accent-green/30 text-accent-green'
                      : 'border-border text-text-muted hover:text-text-primary'
                  }`}
                >
                  {n.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" className="btn-primary text-sm py-2 px-6">Create Agent</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map(agent => (
          <div key={agent.id} className="glass-panel p-5 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-accent-green/10 flex items-center justify-center text-accent-green font-semibold text-sm">
                {agent.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">{agent.name}</p>
                <p className="text-xs text-text-muted">{agent.email}</p>
              </div>
              <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${agent.isActive ? 'bg-accent-green/10 text-accent-green' : 'bg-red-500/10 text-red-400'}`}>
                {agent.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center mb-3">
              <div>
                <p className="text-lg font-mono font-semibold text-text-primary">{agent.stats?.total || 0}</p>
                <p className="text-xs text-text-muted">Leads</p>
              </div>
              <div>
                <p className="text-lg font-mono font-semibold text-accent-green">{agent.stats?.closed || 0}</p>
                <p className="text-xs text-text-muted">Closed</p>
              </div>
              <div>
                <p className="text-lg font-mono font-semibold text-accent-blue">{agent.stats?.pipeline || 0}</p>
                <p className="text-xs text-text-muted">Pipeline</p>
              </div>
            </div>
            {agent.neighborhoods?.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {agent.neighborhoods.slice(0, 4).map((n: string) => (
                  <span key={n} className="text-xs bg-surface2 text-text-muted px-2 py-0.5 rounded">
                    {n.split('-').map((w: string) => w[0].toUpperCase() + w.slice(1)).join(' ')}
                  </span>
                ))}
                {agent.neighborhoods.length > 4 && <span className="text-xs text-text-muted">+{agent.neighborhoods.length - 4}</span>}
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => toggleActive(agent.id, agent.isActive)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  agent.isActive ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' : 'border-accent-green/30 text-accent-green hover:bg-accent-green/10'
                }`}
              >
                {agent.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
