'use client';

import { useState, useCallback, useEffect } from 'react';

type ImageItem = { url: string; alt?: string; type?: 'rendering' | 'photo' | 'aerial' };

export default function ImageGallery({ images, projectName }: { images: ImageItem[]; projectName: string }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const close = useCallback(() => setLightboxIndex(null), []);
  const prev = useCallback(() => setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : (images.length - 1))), [images.length]);
  const next = useCallback(() => setLightboxIndex((i) => (i !== null && i < images.length - 1 ? i + 1 : 0)), [images.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxIndex, close, prev, next]);

  if (!images || images.length === 0) return null;

  return (
    <>
      <div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setLightboxIndex(i)}
              className="relative aspect-[4/3] rounded-xl overflow-hidden group cursor-pointer border border-border hover:border-accent-blue/40 transition-all"
            >
              <img
                src={img.url}
                alt={img.alt || `${projectName} - Image ${i + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              {img.type && (
                <span className="absolute top-2 left-2 text-[10px] uppercase tracking-wider bg-black/60 text-white px-2 py-0.5 rounded-full">
                  {img.type}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={close}>
          <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
            <span className="text-white/60 text-sm font-mono">
              {lightboxIndex + 1} / {images.length}
            </span>
            <button onClick={close} className="text-white/70 hover:text-white text-2xl transition-colors">
              &times;
            </button>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-4xl z-10 transition-colors"
          >
            &#8249;
          </button>

          <img
            src={images[lightboxIndex].url}
            alt={images[lightboxIndex].alt || `${projectName} - Image ${lightboxIndex + 1}`}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-4xl z-10 transition-colors"
          >
            &#8250;
          </button>
        </div>
      )}
    </>
  );
}
