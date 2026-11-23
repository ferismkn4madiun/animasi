import React, { useMemo, useState } from 'react';
import { ArrowRight, Film, Play, Search, Share2 } from 'lucide-react';
import type { AnimationClass, PublishedWork, WorkCategory } from '../types';
import { HERO_STUDIO_IMAGE } from '../data/seedWorks';
import { buildWhatsAppShareUrl, formatIndonesianDate } from '../utils/validation';

interface GalleryViewProps {
  works: PublishedWork[];
  categories: WorkCategory[];
  classes: AnimationClass[];
  loading: boolean;
  onSelectWork: (work: PublishedWork) => void;
  onGoToSubmit: () => void;
}

export const GalleryView: React.FC<GalleryViewProps> = ({
  works,
  categories,
  classes,
  loading,
  onSelectWork,
  onGoToSubmit,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [selectedClass, setSelectedClass] = useState<string>('Semua');
  const [brokenThumbs, setBrokenThumbs] = useState<Record<string, boolean>>({});

  const visibleWorks = useMemo(
    () => works.filter((w) => w.isVisible),
    [works]
  );

  const featuredWorks = useMemo(
    () => visibleWorks.filter((w) => w.isFeatured),
    [visibleWorks]
  );

  const filteredWorks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return visibleWorks.filter((w) => {
      if (selectedCategory !== 'Semua' && w.category !== selectedCategory) {
        return false;
      }
      if (selectedClass !== 'Semua' && w.className !== selectedClass) {
        return false;
      }
      if (!q) return true;
      return (
        w.title.toLowerCase().includes(q) ||
        w.groupName.toLowerCase().includes(q) ||
        w.leaderName.toLowerCase().includes(q) ||
        w.className.toLowerCase().includes(q) ||
        w.members.some((m) => m.toLowerCase().includes(q))
      );
    });
  }, [visibleWorks, selectedCategory, selectedClass, searchQuery]);

  const categoryNames = useMemo(() => {
    const set = new Set<string>(categories.map((c) => c.name));
    visibleWorks.forEach((w) => set.add(w.category));
    return ['Semua', ...Array.from(set)];
  }, [categories, visibleWorks]);

  const classNames = useMemo(() => {
    const set = new Set<string>(classes.map((c) => c.name));
    visibleWorks.forEach((w) => set.add(w.className));
    return ['Semua', ...Array.from(set)];
  }, [classes, visibleWorks]);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="space-y-12 pb-16">
      {/* Split Hero Section */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center space-y-5">
              <p className="text-xs font-semibold tracking-wide text-indigo-700">
                Portofolio Digital Resmi Jurusan Animasi
              </p>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-[1.12] text-balance">
                Galeri Karya Siswa SMK Animasi
              </h1>
              <p className="text-base text-slate-600 leading-relaxed max-w-xl">
                Ruang publikasi dan kurasi karya animasi 2D, pemodelan 3D, motion graphic, storyboard, serta desain karakter yang telah melewati peninjauan guru pembimbing.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={onGoToSubmit}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-700 text-white text-sm font-semibold hover:bg-indigo-800 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Kumpulkan Tugas Karya
                  <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href="#katalog-karya"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm font-semibold hover:bg-slate-50 transition-colors whitespace-nowrap"
                >
                  Jelajahi Galeri
                </a>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative h-64 sm:h-80 lg:h-full min-h-[280px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-900">
                <img
                  src={HERO_STUDIO_IMAGE}
                  alt="Studio Produksi Animasi Siswa SMK"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/15 to-transparent flex items-end p-6">
                  <div className="text-white">
                    <p className="text-xs text-blue-200 font-medium">
                      Studio Produksi · Kelas X, XI &amp; XII
                    </p>
                    <p className="font-display text-lg font-semibold mt-0.5">
                      Kurasi Karya Kreatif Industri Animasi
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Full-width Metric Strip Below Hero Split */}
          <div className="mt-10 pt-8 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-slate-500">Karya Terpublikasi</p>
              <p className="font-display text-2xl font-bold text-slate-900 tabular-nums mt-1">
                {visibleWorks.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Karya Unggulan</p>
              <p className="font-display text-2xl font-bold text-indigo-700 tabular-nums mt-1">
                {featuredWorks.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Bidang Kategori</p>
              <p className="font-display text-2xl font-bold text-slate-900 tabular-nums mt-1">
                {Math.max(categoryNames.length - 1, 6)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Rombel Animasi</p>
              <p className="font-display text-2xl font-bold text-blue-600 tabular-nums mt-1">
                {Math.max(classNames.length - 1, 6)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Spotlight */}
      {featuredWorks.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-indigo-700">Pilihan Kurator Guru</p>
              <h2 className="font-display text-2xl font-bold text-slate-900 mt-0.5">
                Karya Unggulan Jurusan
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {featuredWorks.slice(0, 2).map((work) => (
              <article
                key={work.id}
                className="group bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col sm:flex-row hover:border-indigo-300 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => onSelectWork(work)}
                  className="sm:w-64 h-52 sm:h-auto shrink-0 relative overflow-hidden bg-slate-900 cursor-pointer text-left"
                >
                  {!brokenThumbs[work.id] && work.thumbnailUrl ? (
                    <img
                      src={work.thumbnailUrl}
                      alt={work.title}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setBrokenThumbs((prev) => ({ ...prev, [work.id]: true }))
                      }
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-indigo-950 text-indigo-200 p-4">
                      <Film className="w-8 h-8" />
                    </div>
                  )}
                  {(work.mediaType === 'video' || work.externalLink) && (
                    <span className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-slate-950/75 text-white flex items-center justify-center">
                      <Play className="w-4 h-4 fill-current" />
                    </span>
                  )}
                </button>
                <div className="p-6 flex flex-col justify-between flex-1 min-w-0">
                  <div>
                    <p className="text-xs font-medium text-indigo-700">
                      Unggulan <span aria-hidden="true">·</span> {work.category}{' '}
                      <span aria-hidden="true">·</span> {work.className}
                    </p>
                    <h3 className="font-display text-xl font-bold text-slate-900 mt-1.5 line-clamp-2">
                      {work.title}
                    </h3>
                    <p className="text-sm text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                      {work.description}
                    </p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {work.groupName}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {formatIndonesianDate(work.publishedAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectWork(work)}
                      className="px-3.5 py-2 rounded-lg bg-indigo-700 text-white text-xs font-semibold hover:bg-indigo-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Lihat Karya
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Search & Filter Catalog */}
      <section
        id="katalog-karya"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900">
              Katalog Karya Siswa
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Menampilkan {filteredWorks.length} dari {visibleWorks.length} karya animasi yang telah disetujui.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Cari judul karya, kelompok, atau nama siswa"
                placeholder="Cari judul, kelompok, siswa..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              aria-label="Filter kelas"
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              {classNames.map((cls) => (
                <option key={cls} value={cls}>
                  {cls === 'Semua' ? 'Semua Kelas' : cls}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Segmented Tabs */}
        <div
          role="tablist"
          aria-label="Filter kategori animasi"
          className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 rounded-xl w-fit max-w-full"
        >
          {categoryNames.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Grid State Handling */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden animate-pulse"
              >
                <div className="aspect-[4/3] bg-slate-200" />
                <div className="p-5 space-y-3">
                  <div className="h-3 w-1/2 bg-slate-200 rounded" />
                  <div className="h-5 w-4/5 bg-slate-200 rounded" />
                  <div className="h-4 w-full bg-slate-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredWorks.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
            <p className="font-display text-lg font-semibold text-slate-900">
              Belum ada karya yang sesuai filter
            </p>
            <p className="text-sm text-slate-500 mt-1 mb-5">
              Coba ubah kata kunci pencarian atau pilih kategori animasi lainnya.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('Semua');
                setSelectedClass('Semua');
              }}
              className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Atur Ulang Filter
            </button>
          </div>
        ) : (
          <div
            data-testid="gallery-grid"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredWorks.map((work) => {
              const waHref = buildWhatsAppShareUrl(work, origin);
              return (
                <article
                  key={work.id}
                  className="group bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col hover:border-indigo-300 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => onSelectWork(work)}
                    className="relative aspect-[4/3] w-full overflow-hidden bg-slate-900 cursor-pointer text-left"
                  >
                    {!brokenThumbs[work.id] && work.thumbnailUrl ? (
                      <img
                        src={work.thumbnailUrl}
                        alt={work.title}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setBrokenThumbs((prev) => ({ ...prev, [work.id]: true }))
                        }
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 to-blue-900 text-white p-6 text-center">
                        <Film className="w-8 h-8 mb-2 text-blue-200" />
                        <span className="text-xs font-medium">{work.title}</span>
                      </div>
                    )}
                    {(work.mediaType === 'video' || work.externalLink) && (
                      <span className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-slate-950/75 text-white flex items-center justify-center">
                        <Play className="w-4 h-4 fill-current" />
                      </span>
                    )}
                  </button>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <p className="text-xs text-slate-500">
                        <span className="font-semibold text-indigo-700">{work.category}</span>{' '}
                        <span aria-hidden="true">·</span> {work.className}{' '}
                        <span aria-hidden="true">·</span> {formatIndonesianDate(work.publishedAt)}
                      </p>
                      <h3 className="font-display text-lg font-bold text-slate-900 mt-1.5 line-clamp-1">
                        {work.title}
                      </h3>
                      <p className="text-sm text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                        {work.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {work.groupName}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {work.members.join(', ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={waHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Bagikan ${work.title} ke WhatsApp`}
                          className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-emerald-700 hover:border-emerald-200 transition-colors"
                        >
                          <Share2 className="w-4 h-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => onSelectWork(work)}
                          className="px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors whitespace-nowrap cursor-pointer"
                        >
                          Detail
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
