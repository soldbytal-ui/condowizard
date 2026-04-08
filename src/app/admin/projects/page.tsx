'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface PreconProject {
  id: string;
  name: string;
  slug: string;
  address: string;
  neighborhood: string;
  developer: string;
  price_from: number | null;
  price_to: number | null;
  status: string;
  occupancy_year: number | null;
  is_featured: boolean;
  is_published: boolean;
  created_at: string;
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<PreconProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editProject, setEditProject] = useState<PreconProject | null>(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState<Record<string, any>>({
    name: '', slug: '', address: '', city: 'Toronto', neighborhood: '', community: '',
    developer: '', architect: '', price_from: '', price_to: '', price_per_sqft: '',
    beds_from: '', beds_to: '', baths_from: '', baths_to: '', sqft_from: '', sqft_to: '',
    floors: '', units: '', occupancy_year: '', occupancy_quarter: '', status: 'Selling',
    building_type: 'condo', description: '', deposit_structure: '', incentives: '',
    walk_score: '', transit_score: '', website_url: '', brochure_url: '',
    is_featured: false, is_published: true, seo_title: '', seo_description: '',
    images: '', amenities: '', features: '', floorplan_images: '',
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    setLoading(true);
    const { data } = await supabase
      .from('precon_projects')
      .select('*')
      .order('created_at', { ascending: false });
    setProjects(data || []);
    setLoading(false);
  }

  function slugify(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: Record<string, any> = { ...formData };

    // Convert string arrays
    if (typeof payload.images === 'string') payload.images = payload.images.split('\n').map((s: string) => s.trim()).filter(Boolean);
    if (typeof payload.amenities === 'string') payload.amenities = payload.amenities.split(',').map((s: string) => s.trim()).filter(Boolean);
    if (typeof payload.features === 'string') payload.features = payload.features.split(',').map((s: string) => s.trim()).filter(Boolean);
    if (typeof payload.floorplan_images === 'string') payload.floorplan_images = payload.floorplan_images.split('\n').map((s: string) => s.trim()).filter(Boolean);

    // Convert numbers
    ['price_from', 'price_to', 'price_per_sqft', 'beds_from', 'beds_to', 'baths_from', 'baths_to',
      'sqft_from', 'sqft_to', 'floors', 'units', 'occupancy_year', 'walk_score', 'transit_score'].forEach((key) => {
      if (payload[key] === '' || payload[key] === null) {
        payload[key] = null;
      } else {
        payload[key] = parseInt(payload[key]);
      }
    });

    if (!payload.slug) payload.slug = slugify(payload.name);
    if (!payload.occupancy_quarter || payload.occupancy_quarter === '') payload.occupancy_quarter = null;

    if (editProject) {
      await supabase.from('precon_projects').update(payload).eq('id', editProject.id);
    } else {
      await supabase.from('precon_projects').insert(payload);
    }

    setShowForm(false);
    setEditProject(null);
    setFormData({
      name: '', slug: '', address: '', city: 'Toronto', neighborhood: '', community: '',
      developer: '', architect: '', price_from: '', price_to: '', price_per_sqft: '',
      beds_from: '', beds_to: '', baths_from: '', baths_to: '', sqft_from: '', sqft_to: '',
      floors: '', units: '', occupancy_year: '', occupancy_quarter: '', status: 'Selling',
      building_type: 'condo', description: '', deposit_structure: '', incentives: '',
      walk_score: '', transit_score: '', website_url: '', brochure_url: '',
      is_featured: false, is_published: true, seo_title: '', seo_description: '',
      images: '', amenities: '', features: '', floorplan_images: '',
    });
    fetchProjects();
  }

  function startEdit(project: PreconProject) {
    setEditProject(project);
    setFormData({
      ...project,
      images: Array.isArray((project as any).images) ? (project as any).images.join('\n') : '',
      amenities: Array.isArray((project as any).amenities) ? (project as any).amenities.join(', ') : '',
      features: Array.isArray((project as any).features) ? (project as any).features.join(', ') : '',
      floorplan_images: Array.isArray((project as any).floorplan_images) ? (project as any).floorplan_images.join('\n') : '',
    });
    setShowForm(true);
  }

  async function togglePublished(id: string, current: boolean) {
    await supabase.from('precon_projects').update({ is_published: !current }).eq('id', id);
    fetchProjects();
  }

  async function toggleFeatured(id: string, current: boolean) {
    await supabase.from('precon_projects').update({ is_featured: !current }).eq('id', id);
    fetchProjects();
  }

  async function deleteProject(id: string) {
    if (!confirm('Delete this project?')) return;
    await supabase.from('precon_projects').delete().eq('id', id);
    fetchProjects();
  }

  const filtered = projects.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.neighborhood?.toLowerCase().includes(search.toLowerCase()) ||
    p.developer?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Pre-Construction Projects</h1>
          <p className="text-gray-400 text-sm mt-1">{projects.length} projects</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditProject(null); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Add Project
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search projects..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-4 px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg text-sm"
      />

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto pt-10 pb-10">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-3xl">
            <h2 className="text-xl font-bold text-white mb-4">
              {editProject ? 'Edit Project' : 'Add New Project'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400">Name *</label>
                  <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: slugify(e.target.value) })} className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Slug</label>
                  <input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Address</label>
                  <input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Neighbourhood</label>
                  <input value={formData.neighborhood} onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })} className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Developer</label>
                  <input value={formData.developer} onChange={(e) => setFormData({ ...formData, developer: e.target.value })} className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Community Code</label>
                  <input value={formData.community} onChange={(e) => setFormData({ ...formData, community: e.target.value })} placeholder="C01, C02..." className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Price From</label>
                  <input type="number" value={formData.price_from} onChange={(e) => setFormData({ ...formData, price_from: e.target.value })} className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Price To</label>
                  <input type="number" value={formData.price_to} onChange={(e) => setFormData({ ...formData, price_to: e.target.value })} className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Beds From</label>
                  <input type="number" value={formData.beds_from} onChange={(e) => setFormData({ ...formData, beds_from: e.target.value })} className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Beds To</label>
                  <input type="number" value={formData.beds_to} onChange={(e) => setFormData({ ...formData, beds_to: e.target.value })} className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Sqft From</label>
                  <input type="number" value={formData.sqft_from} onChange={(e) => setFormData({ ...formData, sqft_from: e.target.value })} className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Sqft To</label>
                  <input type="number" value={formData.sqft_to} onChange={(e) => setFormData({ ...formData, sqft_to: e.target.value })} className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Floors</label>
                  <input type="number" value={formData.floors} onChange={(e) => setFormData({ ...formData, floors: e.target.value })} className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Units</label>
                  <input type="number" value={formData.units} onChange={(e) => setFormData({ ...formData, units: e.target.value })} className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Occupancy Year</label>
                  <select value={formData.occupancy_year} onChange={(e) => setFormData({ ...formData, occupancy_year: e.target.value })} className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded text-sm">
                    <option value="">Select</option>
                    {[2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded text-sm">
                    <option value="Selling">Selling</option>
                    <option value="Upcoming">Upcoming</option>
                    <option value="Registration">Registration</option>
                    <option value="Sold Out">Sold Out</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400">Building Type</label>
                  <select value={formData.building_type} onChange={(e) => setFormData({ ...formData, building_type: e.target.value })} className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded text-sm">
                    <option value="condo">Condo</option>
                    <option value="townhome">Townhome</option>
                    <option value="stacked-townhome">Stacked Townhome</option>
                    <option value="detached">Detached</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400">Website URL</label>
                  <input value={formData.website_url} onChange={(e) => setFormData({ ...formData, website_url: e.target.value })} className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded text-sm" />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-400">Amenities (comma separated)</label>
                <input value={formData.amenities} onChange={(e) => setFormData({ ...formData, amenities: e.target.value })} placeholder="Pool, Gym, Concierge..." className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-400">Images (one URL per line)</label>
                <textarea value={formData.images} onChange={(e) => setFormData({ ...formData, images: e.target.value })} rows={3} placeholder="https://..." className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-400">Deposit Structure</label>
                <textarea value={formData.deposit_structure} onChange={(e) => setFormData({ ...formData, deposit_structure: e.target.value })} rows={2} className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded text-sm" />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input type="checkbox" checked={formData.is_featured} onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })} />
                  Featured
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input type="checkbox" checked={formData.is_published} onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })} />
                  Published
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                  {editProject ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditProject(null); }} className="px-6 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Project</th>
              <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium hidden md:table-cell">Neighbourhood</th>
              <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium hidden md:table-cell">Developer</th>
              <th className="text-right px-4 py-3 text-xs text-gray-400 font-medium">Price From</th>
              <th className="text-center px-4 py-3 text-xs text-gray-400 font-medium">Status</th>
              <th className="text-center px-4 py-3 text-xs text-gray-400 font-medium">Pub</th>
              <th className="text-right px-4 py-3 text-xs text-gray-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No projects found</td></tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                  <td className="px-4 py-3">
                    <p className="text-sm text-white font-medium">{p.name}</p>
                    {p.is_featured && <span className="text-[10px] text-yellow-400">FEATURED</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400 hidden md:table-cell">{p.neighborhood}</td>
                  <td className="px-4 py-3 text-sm text-gray-400 hidden md:table-cell">{p.developer}</td>
                  <td className="px-4 py-3 text-sm text-gray-300 text-right">
                    {p.price_from ? `$${p.price_from.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      p.status === 'Selling' ? 'bg-green-900/50 text-green-400' :
                      p.status === 'Upcoming' ? 'bg-blue-900/50 text-blue-400' :
                      p.status === 'Sold Out' ? 'bg-red-900/50 text-red-400' :
                      'bg-gray-700 text-gray-400'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => togglePublished(p.id, p.is_published)} className={`w-4 h-4 rounded-full ${p.is_published ? 'bg-green-500' : 'bg-gray-600'}`} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => startEdit(p)} className="text-xs text-blue-400 hover:underline">Edit</button>
                      <button onClick={() => toggleFeatured(p.id, p.is_featured)} className="text-xs text-yellow-400 hover:underline">
                        {p.is_featured ? 'Unfeature' : 'Feature'}
                      </button>
                      <button onClick={() => deleteProject(p.id)} className="text-xs text-red-400 hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
