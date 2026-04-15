'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  MediaAsset, MediaCategory, MEDIA_CATEGORIES, MEDIA_MAX_ITEMS,
  loadMedia, deleteMedia, addMediaFromFile, ensureSeededMedia,
} from '@/lib/scale-media';

// ═══════════════════════════════════════════════════════════════
// Theme (matches rest of Scale)
// ═══════════════════════════════════════════════════════════════
const S = {
  pageBg: '#F5F5F7',
  pageHeading: '#111318',
  pageSubtitle: '#6B7185',
  surface: '#111318',
  surfaceInner: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.06)',
  borderHover: 'rgba(255,255,255,0.12)',
  accent: '#0066FF',
  accentSoft: 'rgba(0,102,255,0.14)',
  accentBorder: 'rgba(0,102,255,0.4)',
  red: '#EF4444',
  redSoft: 'rgba(239,68,68,0.12)',
  amber: '#F59E0B',
  textPrimary: '#E2E4E9',
  textSecondary: '#8B8FA3',
  textMuted: '#6B7185',
  white: '#fff',
  font: "'DM Sans', -apple-system, sans-serif",
  mono: "'JetBrains Mono', monospace",
};
const CARD_SHADOW = '0 2px 12px rgba(0,0,0,0.08)';

interface ProjectWithImage {
  id: string; name: string; neighborhood: string; image: string; images?: string[];
}

export default function MediaPage() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [projects, setProjects] = useState<ProjectWithImage[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<'all' | MediaCategory>('all');
  const [uploadCategory, setUploadCategory] = useState<MediaCategory>('project_photo');
  const [uploading, setUploading] = useState(false);
  const [flash, setFlash] = useState<{ kind: 'ok' | 'err'; message: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setAssets(ensureSeededMedia());
    (async () => {
      try {
        const res = await fetch('/api/admin/scale/projects', { cache: 'no-store' });
        const data = await res.json();
        if (Array.isArray(data.projects)) {
          setProjects(data.projects.filter((p: ProjectWithImage) => p.image || (p.images && p.images.length)));
        }
      } catch { /* ignore */ }
    })();
  }, []);

  const filtered = useMemo(
    () => (categoryFilter === 'all' ? assets : assets.filter((a) => a.category === categoryFilter)),
    [assets, categoryFilter]
  );

  const nearLimit = assets.length >= MEDIA_MAX_ITEMS - 3;

  const handleFiles = async (files: FileList | File[]) => {
    setUploading(true);
    setFlash(null);
    const added: MediaAsset[] = [];
    try {
      for (const file of Array.from(files)) {
        const asset = await addMediaFromFile(file, uploadCategory);
        added.push(asset);
      }
      setAssets(loadMedia());
      setFlash({ kind: 'ok', message: `Uploaded ${added.length} file${added.length === 1 ? '' : 's'}.` });
    } catch (err) {
      setFlash({ kind: 'err', message: err instanceof Error ? err.message : String(err) });
      setAssets(loadMedia());
    } finally {
      setUploading(false);
      setTimeout(() => setFlash(null), 4000);
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  };

  const copyImageToClipboard = async (asset: MediaAsset) => {
    try {
      await navigator.clipboard.writeText(asset.dataUrl);
      setFlash({ kind: 'ok', message: 'Data URL copied. Paste into creative or campaign.' });
    } catch {
      setFlash({ kind: 'err', message: 'Clipboard unavailable. Right-click the image to save.' });
    }
    setTimeout(() => setFlash(null), 3000);
  };

  return (
    <div style={{ background: S.pageBg, minHeight: '100%', fontFamily: S.font, color: S.pageHeading, fontSize: 16, lineHeight: 1.6 }}>
      <style>{`
        @keyframes sFadeIn { from { opacity:0; transform:translateY(8px);} to { opacity:1; transform:translateY(0);} }
        .media-card:hover { border-color: ${S.borderHover} !important; transform: translateY(-1px); }
        .media-card { transition: all 0.15s; }
      `}</style>

      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '32px 40px 96px', animation: 'sFadeIn 0.25s ease' }}>
        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: S.pageHeading, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Media library
          </h1>
          <p style={{ fontSize: 17, color: S.pageSubtitle, margin: '12px 0 0', lineHeight: 1.6, maxWidth: 680 }}>
            Upload brand assets, logos, and photos. Available across all campaigns.
          </p>
        </div>

        {flash && (
          <div style={{
            marginBottom: 20, padding: '14px 18px', borderRadius: 12,
            background: flash.kind === 'ok' ? 'rgba(16,185,129,0.12)' : S.redSoft,
            border: `1px solid ${flash.kind === 'ok' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
            color: flash.kind === 'ok' ? '#047857' : '#991B1B',
            fontSize: 15, fontWeight: 500,
          }}>
            {flash.message}
          </div>
        )}

        {nearLimit && (
          <div style={{
            marginBottom: 20, padding: '14px 18px', borderRadius: 12,
            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
            color: '#7C2D12', fontSize: 14,
          }}>
            You have {assets.length} of {MEDIA_MAX_ITEMS} assets. Delete older files to keep uploading.
          </div>
        )}

        {/* Brand assets section */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: S.pageHeading, margin: '0 0 14px', letterSpacing: '-0.015em' }}>
            Brand assets
          </h2>

          {/* Upload zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              borderRadius: 16,
              border: `2px dashed ${dragOver ? S.accent : 'rgba(0,0,0,0.18)'}`,
              background: dragOver ? 'rgba(0,102,255,0.06)' : '#fff',
              padding: 36, textAlign: 'center',
              cursor: 'pointer', transition: 'all 0.15s',
              marginBottom: 22,
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 10 }}>⬆</div>
            <div style={{ fontSize: 17, fontWeight: 600, color: S.pageHeading, marginBottom: 6 }}>
              {uploading ? 'Uploading…' : 'Drop images here or click to browse'}
            </div>
            <div style={{ fontSize: 14, color: S.pageSubtitle }}>
              PNG, JPG, WEBP, or SVG — up to 5 MB each
            </div>
            <div style={{ marginTop: 18, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, color: S.pageSubtitle }}>Category:</span>
              <select
                value={uploadCategory}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => { e.stopPropagation(); setUploadCategory(e.target.value as MediaCategory); }}
                style={{
                  padding: '8px 14px', borderRadius: 9,
                  background: '#fff', border: '1px solid rgba(0,0,0,0.12)',
                  color: S.pageHeading, fontSize: 14, fontWeight: 500, fontFamily: S.font,
                  cursor: 'pointer', outline: 'none',
                }}
              >
                {MEDIA_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <input
              ref={fileInputRef}
              type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml"
              multiple style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files?.length) handleFiles(e.target.files);
                e.currentTarget.value = '';
              }}
            />
          </div>

          {/* Category filter */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
            {(['all', ...MEDIA_CATEGORIES.map((c) => c.id)] as const).map((cat) => {
              const active = categoryFilter === cat;
              const label = cat === 'all' ? `All (${assets.length})` :
                `${MEDIA_CATEGORIES.find((c) => c.id === cat)!.label} (${assets.filter((a) => a.category === cat).length})`;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  style={{
                    padding: '9px 16px', borderRadius: 9,
                    background: active ? S.accent : '#fff',
                    border: `1px solid ${active ? S.accent : 'rgba(0,0,0,0.12)'}`,
                    color: active ? '#fff' : S.pageHeading,
                    fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: S.font,
                    boxShadow: active ? 'none' : '0 1px 2px rgba(0,0,0,0.04)',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div style={{
              padding: 36, textAlign: 'center',
              background: S.surface, color: S.textMuted, borderRadius: 16,
              border: `1px solid ${S.border}`, fontSize: 14, boxShadow: CARD_SHADOW,
            }}>
              No assets in this category yet.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
              {filtered.map((a) => (
                <AssetCard
                  key={a.id}
                  asset={a}
                  onDelete={() => {
                    if (confirm(`Delete ${a.name}?`)) {
                      setAssets(deleteMedia(a.id));
                    }
                  }}
                  onCopyUrl={() => copyImageToClipboard(a)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Project images */}
        <section>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: S.pageHeading, margin: '0 0 8px', letterSpacing: '-0.015em' }}>
            Project images
          </h2>
          <p style={{ fontSize: 15, color: S.pageSubtitle, margin: '0 0 18px', lineHeight: 1.6 }}>
            Pulled live from the projects database. Click <strong>Use in campaign</strong> to jump into the creative generator with that image pre-loaded.
          </p>

          {projects.length === 0 ? (
            <div style={{
              padding: 36, textAlign: 'center',
              background: S.surface, color: S.textMuted, borderRadius: 16,
              border: `1px solid ${S.border}`, fontSize: 14, boxShadow: CARD_SHADOW,
            }}>
              No project images found in the database yet.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
              {projects.map((p) => (
                <div
                  key={p.id}
                  className="media-card"
                  style={{
                    background: S.surface, color: S.textPrimary,
                    border: `1px solid ${S.border}`, borderRadius: 14,
                    overflow: 'hidden', boxShadow: CARD_SHADOW,
                    display: 'flex', flexDirection: 'column',
                  }}
                >
                  <div style={{
                    width: '100%', aspectRatio: '1 / 1',
                    backgroundImage: `url(${p.image})`, backgroundSize: 'cover', backgroundPosition: 'center',
                    background: p.image ? `center/cover no-repeat url(${p.image})` : `linear-gradient(135deg, rgba(0,102,255,0.12) 0%, rgba(0,212,170,0.08) 100%)`,
                  }} />
                  <div style={{ padding: 14 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: S.white, marginBottom: 4 }}>{p.name}</div>
                    <div style={{ fontSize: 13, color: S.textMuted, marginBottom: 12 }}>{p.neighborhood}</div>
                    <Link
                      href="/admin/scale/campaigns"
                      style={{
                        display: 'inline-block', padding: '8px 14px', borderRadius: 8,
                        background: S.accentSoft, border: `1px solid ${S.accentBorder}`,
                        color: '#93C5FD', fontSize: 13, fontWeight: 500, textDecoration: 'none',
                      }}
                    >
                      Use in campaign →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function AssetCard({ asset, onDelete, onCopyUrl }: { asset: MediaAsset; onDelete: () => void; onCopyUrl: () => void }) {
  const cat = MEDIA_CATEGORIES.find((c) => c.id === asset.category);
  return (
    <div
      className="media-card"
      style={{
        background: S.surface, color: S.textPrimary,
        border: `1px solid ${S.border}`, borderRadius: 14,
        overflow: 'hidden', boxShadow: CARD_SHADOW,
        display: 'flex', flexDirection: 'column',
      }}
    >
      <div style={{
        width: '100%', aspectRatio: '1 / 1', position: 'relative',
        background: `center/cover no-repeat url(${asset.dataUrl})`,
        backgroundColor: 'rgba(255,255,255,0.03)',
      }}>
        <span style={{
          position: 'absolute', top: 10, left: 10,
          padding: '3px 10px', borderRadius: 100,
          background: 'rgba(0,0,0,0.6)', color: '#fff',
          fontSize: 11, fontWeight: 600,
          backdropFilter: 'blur(8px)',
        }}>
          {cat?.label || asset.category}
        </span>
      </div>
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: S.white, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {asset.name}
        </div>
        <div style={{ fontSize: 12, color: S.textMuted, fontFamily: S.mono }}>
          {asset.width}×{asset.height} · {formatBytes(asset.size)}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <button onClick={onCopyUrl} style={tinyBtn()}>Copy URL</button>
          <button onClick={onDelete} style={{ ...tinyBtn(), color: S.red, borderColor: 'rgba(239,68,68,0.3)' }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function tinyBtn(): React.CSSProperties {
  return {
    flex: 1, padding: '7px 10px', borderRadius: 7,
    background: 'rgba(255,255,255,0.03)', border: `1px solid ${S.border}`,
    color: S.textSecondary, fontSize: 12, fontWeight: 500,
    cursor: 'pointer', fontFamily: S.font,
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
