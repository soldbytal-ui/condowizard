'use client';

import { useState, useEffect, useCallback } from 'react';

const STATUSES = ['new', 'contacted', 'showing', 'under_contract', 'closed', 'lost'] as const;
const STATUS_LABELS: Record<string, string> = {
  new: 'New', contacted: 'Contacted', showing: 'Showing',
  under_contract: 'Under Contract', closed: 'Closed', lost: 'Lost',
};
const STATUS_COLORS: Record<string, string> = {
  new: 'bg-accent-green/20 text-accent-green', contacted: 'bg-accent-blue/20 text-accent-blue',
  showing: 'bg-yellow-500/20 text-yellow-400', under_contract: 'bg-accent-orange/20 text-accent-orange',
  closed: 'bg-emerald-500/20 text-emerald-400', lost: 'bg-red-500/20 text-red-400',
};
const PRIORITY_COLORS: Record<string, string> = {
  hot: 'bg-red-500/20 text-red-400', warm: 'bg-yellow-500/20 text-yellow-400', cold: 'bg-blue-500/20 text-blue-400',
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [filter, setFilter] = useState({ status: '', search: '' });
  const [noteText, setNoteText] = useState('');
  const [smsText, setSmsText] = useState('');
  const [user, setUser] = useState<any>(null);

  const fetchLeads = useCallback(async () => {
    const params = new URLSearchParams();
    if (filter.status) params.set('status', filter.status);
    if (filter.search) params.set('search', filter.search);
    const data = await fetch(`/api/admin/leads?${params}`).then(r => r.json());
    if (Array.isArray(data)) setLeads(data);
  }, [filter]);

  useEffect(() => {
    fetch('/api/admin/auth').then(r => r.json()).then(d => setUser(d.user));
    fetch('/api/admin/agents').then(r => r.json()).then(d => { if (Array.isArray(d)) setAgents(d); });
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const selectLead = async (lead: any) => {
    setSelected(lead);
    const acts = await fetch(`/api/admin/activities?leadId=${lead.id}`).then(r => r.json());
    setActivities(Array.isArray(acts) ? acts : []);
  };

  const updateLead = async (id: string, updates: any) => {
    await fetch('/api/admin/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    fetchLeads();
    if (selected?.id === id) {
      setSelected((prev: any) => prev ? { ...prev, ...updates } : null);
    }
  };

  const addNote = async () => {
    if (!noteText.trim() || !selected) return;
    await fetch('/api/admin/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId: selected.id, type: 'note', content: noteText }),
    });
    setNoteText('');
    const acts = await fetch(`/api/admin/activities?leadId=${selected.id}`).then(r => r.json());
    setActivities(Array.isArray(acts) ? acts : []);
  };

  const initiateCall = async (leadId: string) => {
    await fetch('/api/admin/call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId }),
    });
    if (selected) {
      const acts = await fetch(`/api/admin/activities?leadId=${selected.id}`).then(r => r.json());
      setActivities(Array.isArray(acts) ? acts : []);
    }
  };

  const sendSms = async () => {
    if (!smsText.trim() || !selected) return;
    await fetch('/api/admin/sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId: selected.id, message: smsText }),
    });
    setSmsText('');
    const acts = await fetch(`/api/admin/activities?leadId=${selected.id}`).then(r => r.json());
    setActivities(Array.isArray(acts) ? acts : []);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Leads</h1>
          <p className="text-sm text-text-muted mt-1">{leads.length} total leads</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            placeholder="Search..."
            value={filter.search}
            onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
            className="bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary w-48 focus:outline-none focus:border-accent-green/50"
          />
          <select
            value={filter.status}
            onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
            className="bg-surface2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none"
          >
            <option value="">All Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <div className="flex bg-surface2 rounded-lg border border-border overflow-hidden">
            <button onClick={() => setView('table')} className={`px-3 py-2 text-xs ${view === 'table' ? 'bg-accent-green/10 text-accent-green' : 'text-text-muted'}`}>Table</button>
            <button onClick={() => setView('kanban')} className={`px-3 py-2 text-xs ${view === 'kanban' ? 'bg-accent-green/10 text-accent-green' : 'text-text-muted'}`}>Kanban</button>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Main content */}
        <div className={`flex-1 min-w-0 ${selected ? 'hidden md:block' : ''}`}>
          {view === 'table' ? (
            <div className="glass-panel rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-text-muted uppercase tracking-wider border-b border-border">
                      <th className="text-left p-3">Lead</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3 hidden lg:table-cell">Priority</th>
                      <th className="text-left p-3 hidden md:table-cell">Project</th>
                      <th className="text-left p-3 hidden lg:table-cell">Agent</th>
                      <th className="text-left p-3 hidden md:table-cell">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map(lead => (
                      <tr
                        key={lead.id}
                        onClick={() => selectLead(lead)}
                        className={`border-b border-border/50 cursor-pointer transition-colors ${selected?.id === lead.id ? 'bg-accent-green/5' : 'hover:bg-surface2/50'}`}
                      >
                        <td className="p-3">
                          <p className="text-sm text-text-primary font-medium">{lead.name}</p>
                          <p className="text-xs text-text-muted">{lead.email}</p>
                        </td>
                        <td className="p-3">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[lead.status]}`}>
                            {STATUS_LABELS[lead.status] || lead.status}
                          </span>
                        </td>
                        <td className="p-3 hidden lg:table-cell">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${PRIORITY_COLORS[lead.priority]}`}>
                            {lead.priority}
                          </span>
                        </td>
                        <td className="p-3 text-xs text-text-muted hidden md:table-cell">{lead.project?.name || lead.source}</td>
                        <td className="p-3 text-xs text-text-muted hidden lg:table-cell">{lead.assignedAgent?.name || 'Unassigned'}</td>
                        <td className="p-3 text-xs text-text-muted hidden md:table-cell">{new Date(lead.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Kanban view */
            <div className="flex gap-3 overflow-x-auto pb-4">
              {STATUSES.filter(s => s !== 'lost').map(status => (
                <div key={status} className="flex-shrink-0 w-64">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[status]}`}>
                      {STATUS_LABELS[status]}
                    </span>
                    <span className="text-xs text-text-muted">{leads.filter(l => l.status === status).length}</span>
                  </div>
                  <div className="space-y-2">
                    {leads.filter(l => l.status === status).map(lead => (
                      <div
                        key={lead.id}
                        onClick={() => selectLead(lead)}
                        className="glass-panel p-3 rounded-lg cursor-pointer hover:border-accent-green/30 transition-colors"
                      >
                        <p className="text-sm text-text-primary font-medium truncate">{lead.name}</p>
                        <p className="text-xs text-text-muted truncate">{lead.email}</p>
                        {lead.project?.name && <p className="text-xs text-accent-green mt-1 truncate">{lead.project.name}</p>}
                        <div className="flex items-center justify-between mt-2">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${PRIORITY_COLORS[lead.priority]}`}>{lead.priority}</span>
                          <span className="text-xs text-text-muted">{new Date(lead.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className={`w-full md:w-96 flex-shrink-0 ${selected ? '' : 'hidden'}`}>
            <div className="glass-panel rounded-xl overflow-hidden sticky top-4">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text-primary">{selected.name}</h3>
                <button onClick={() => setSelected(null)} className="text-text-muted hover:text-text-primary text-xl">&times;</button>
              </div>

              <div className="p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                {/* Contact Info */}
                <div className="space-y-2">
                  <p className="text-sm text-text-muted">{selected.email}</p>
                  {isAdmin && selected.phone && <p className="text-sm text-text-primary">{selected.phone}</p>}
                  {!isAdmin && selected.phone && <p className="text-sm text-text-muted italic">{selected.phone}</p>}
                  {selected.project?.name && <p className="text-xs text-accent-green">Interested in: {selected.project.name}</p>}
                  {selected.message && <p className="text-xs text-text-muted bg-surface2 p-2 rounded">{selected.message}</p>}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => initiateCall(selected.id)}
                    className="flex-1 bg-accent-green/10 text-accent-green text-xs font-medium py-2 rounded-lg hover:bg-accent-green/20 transition-colors"
                  >
                    📞 Click to Call
                  </button>
                  <button
                    onClick={() => document.getElementById('sms-input')?.focus()}
                    className="flex-1 bg-accent-blue/10 text-accent-blue text-xs font-medium py-2 rounded-lg hover:bg-accent-blue/20 transition-colors"
                  >
                    💬 Text
                  </button>
                </div>

                {/* Status + Priority + Agent */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-text-muted uppercase tracking-wider">Status</label>
                    <select
                      value={selected.status}
                      onChange={e => updateLead(selected.id, { status: e.target.value })}
                      className="w-full bg-surface2 border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary mt-1"
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-text-muted uppercase tracking-wider">Priority</label>
                    <select
                      value={selected.priority}
                      onChange={e => updateLead(selected.id, { priority: e.target.value })}
                      className="w-full bg-surface2 border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary mt-1"
                    >
                      <option value="hot">Hot</option>
                      <option value="warm">Warm</option>
                      <option value="cold">Cold</option>
                    </select>
                  </div>
                </div>

                {isAdmin && (
                  <div>
                    <label className="text-xs text-text-muted uppercase tracking-wider">Assigned Agent</label>
                    <select
                      value={selected.assignedAgentId || ''}
                      onChange={e => updateLead(selected.id, { assignedAgentId: e.target.value || null })}
                      className="w-full bg-surface2 border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary mt-1"
                    >
                      <option value="">Unassigned</option>
                      {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                )}

                {selected.status === 'closed' && (
                  <div>
                    <label className="text-xs text-text-muted uppercase tracking-wider">Deal Value</label>
                    <input
                      type="number"
                      defaultValue={selected.dealValue || ''}
                      onBlur={e => updateLead(selected.id, { dealValue: parseInt(e.target.value) || null })}
                      placeholder="$"
                      className="w-full bg-surface2 border border-border rounded-lg px-2 py-1.5 text-xs text-text-primary mt-1"
                    />
                  </div>
                )}

                {/* SMS Input */}
                <div className="flex gap-2">
                  <input
                    id="sms-input"
                    placeholder="Send SMS..."
                    value={smsText}
                    onChange={e => setSmsText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendSms()}
                    className="flex-1 bg-surface2 border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-green/50"
                  />
                  <button onClick={sendSms} className="bg-accent-blue/10 text-accent-blue text-xs px-3 rounded-lg hover:bg-accent-blue/20">Send</button>
                </div>

                {/* Add Note */}
                <div className="flex gap-2">
                  <input
                    placeholder="Add note..."
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addNote()}
                    className="flex-1 bg-surface2 border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-accent-green/50"
                  />
                  <button onClick={addNote} className="bg-surface2 text-text-muted text-xs px-3 rounded-lg hover:text-text-primary border border-border">Add</button>
                </div>

                {/* Activity Timeline */}
                <div>
                  <h4 className="text-xs text-text-muted uppercase tracking-wider mb-2">Activity</h4>
                  <div className="space-y-2">
                    {activities.map(act => (
                      <div key={act.id} className="bg-surface2 rounded-lg p-2.5">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-accent-green capitalize">{act.type.replace('_', ' ')}</span>
                          <span className="text-xs text-text-muted">{act.agent?.name}</span>
                          <span className="text-xs text-text-muted ml-auto">{new Date(act.createdAt).toLocaleString()}</span>
                        </div>
                        {act.content && <p className="text-xs text-text-muted">{act.content}</p>}
                      </div>
                    ))}
                    {activities.length === 0 && <p className="text-xs text-text-muted text-center py-4">No activity yet</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
