import React from 'react';
import type { DashboardStats } from '../../types';

interface StatsPanelProps {
  stats: DashboardStats;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ stats }) => {
  const maxClassCount = Math.max(1, ...stats.byClass.map((c) => c.count));
  const maxCatCount = Math.max(1, ...stats.byCategory.map((c) => c.count));

  const kpis = [
    { label: 'Jumlah Siswa', value: stats.totalStudents, accent: 'text-slate-900' },
    { label: 'Jumlah Kelompok', value: stats.totalGroups, accent: 'text-slate-900' },
    { label: 'Total Tugas Masuk', value: stats.totalSubmissions, accent: 'text-indigo-700' },
    { label: 'Sudah Dinilai', value: stats.gradedSubmissions, accent: 'text-emerald-700' },
    { label: 'Menunggu Penilaian', value: stats.pendingSubmissions, accent: 'text-amber-700' },
    { label: 'Karya Dipublikasikan', value: stats.publishedWorks, accent: 'text-blue-700' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-900">
          Statistik Jurusan Animasi
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Ringkasan pengumpulan tugas, penilaian guru, serta publikasi karya siswa secara langsung.
        </p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((item) => (
          <div
            key={item.label}
            className="bg-white border border-slate-200 rounded-2xl p-5"
          >
            <p className="text-xs font-medium text-slate-500">{item.label}</p>
            <p className={`font-display text-3xl font-bold tabular-nums mt-2 ${item.accent}`}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Class & Category Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
          <div>
            <h3 className="font-display text-base font-bold text-slate-900">
              Pengumpulan Berdasarkan Kelas
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Distribusi tugas masuk per rombongan belajar.
            </p>
          </div>
          {stats.byClass.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">Belum ada data pengumpulan kelas.</p>
          ) : (
            <div className="space-y-3.5">
              {stats.byClass.map((row) => (
                <div key={row.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{row.name}</span>
                    <span className="font-mono font-semibold text-slate-600 tabular-nums">
                      {row.count} tugas
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-700"
                      style={{ width: `${Math.round((row.count / maxClassCount) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
          <div>
            <h3 className="font-display text-base font-bold text-slate-900">
              Pengumpulan Berdasarkan Kategori
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Sebaran tugas di 6 bidang keahlian animasi.
            </p>
          </div>
          {stats.byCategory.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">Belum ada data pengumpulan kategori.</p>
          ) : (
            <div className="space-y-3.5">
              {stats.byCategory.map((row) => (
                <div key={row.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{row.name}</span>
                    <span className="font-mono font-semibold text-slate-600 tabular-nums">
                      {row.count} tugas
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${Math.round((row.count / maxCatCount) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
