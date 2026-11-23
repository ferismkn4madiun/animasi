import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, FileWarning, Search, Sparkles } from 'lucide-react';
import type { Submission, SubmissionStatusRecord, UserAccount } from '../types';
import { lookupSubmissionStatus, subscribeSubmissions } from '../services/firestoreService';
import { formatIndonesianDate } from '../utils/validation';

interface StatusTrackerViewProps {
  initialTrackingCode?: string;
  userProfile: UserAccount | null;
  onSignIn: () => void;
}

const STATUS_STYLE: Record<string, string> = {
  Menunggu: 'text-amber-700',
  Diterima: 'text-blue-700',
  Revisi: 'text-rose-700',
  Selesai: 'text-emerald-700',
};

export const StatusTrackerView: React.FC<StatusTrackerViewProps> = ({
  initialTrackingCode = '',
  userProfile,
  onSignIn,
}) => {
  const [codeInput, setCodeInput] = useState(initialTrackingCode);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [statusResult, setStatusResult] = useState<SubmissionStatusRecord | null>(null);
  const [lookupError, setLookupError] = useState('');
  const [mySubmissions, setMySubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    if (initialTrackingCode) {
      setCodeInput(initialTrackingCode);
      void runLookup(initialTrackingCode);
    }
  }, [initialTrackingCode]);

  useEffect(() => {
    if (!userProfile?.uid) {
      setMySubmissions([]);
      return;
    }
    const unsub = subscribeSubmissions((items) => {
      setMySubmissions(items);
    }, userProfile.uid);
    return () => unsub();
  }, [userProfile?.uid]);

  const runLookup = async (code: string) => {
    const clean = code.trim().toUpperCase();
    if (!clean) {
      setLookupError('Masukkan kode pelacakan terlebih dahulu.');
      return;
    }
    setLookupError('');
    setSearching(true);
    setSearched(true);
    try {
      const result = await lookupSubmissionStatus(clean);
      setStatusResult(result);
    } catch (err) {
      setLookupError(
        err instanceof Error ? err.message : 'Gagal memeriksa status pengumpulan.'
      );
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runLookup(codeInput);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-indigo-700">
          Pemantauan Tugas Siswa
        </p>
        <h1 className="font-display text-3xl font-bold text-slate-900">
          Cek Status Pengumpulan
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          Masukkan kode pelacakan yang Anda terima setelah mengirim tugas untuk melihat status peninjauan, nilai, serta catatan revisi dari guru pembimbing.
        </p>
      </div>

      {/* Lookup Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4"
      >
        <label htmlFor="trackingCodeInput" className="block text-xs font-semibold text-slate-700">
          Kode Pelacakan Tugas
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="trackingCodeInput"
              type="text"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              placeholder="Contoh: ANM-2026-X7K2P"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 font-mono text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-6 py-2.5 rounded-xl bg-indigo-700 text-white text-sm font-semibold hover:bg-indigo-800 disabled:opacity-60 transition-colors whitespace-nowrap cursor-pointer"
          >
            {searching ? 'Mencari...' : 'Periksa Status'}
          </button>
        </div>
        {lookupError && <p className="text-xs text-rose-600">{lookupError}</p>}
      </form>

      {/* Lookup Result */}
      {searched && !searching && (
        statusResult ? (
          <div
            data-testid="status-lookup-result"
            className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <p className="font-mono text-xs text-slate-500">
                  {statusResult.trackingCode} <span aria-hidden="true">·</span> {statusResult.category}
                </p>
                <h2 className="font-display text-xl font-bold text-slate-900 mt-0.5">
                  {statusResult.title}
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  {statusResult.groupName} <span aria-hidden="true">·</span> {statusResult.className}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs text-slate-500">Status Peninjauan</p>
                <p className={`text-base font-bold mt-0.5 ${STATUS_STYLE[statusResult.status] || 'text-slate-900'}`}>
                  {statusResult.status}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-slate-500">Tanggal Kirim</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">
                  {formatIndonesianDate(statusResult.submittedAt)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Nilai Guru</p>
                <p className="font-mono text-sm font-bold text-slate-900 tabular-nums mt-0.5">
                  {typeof statusResult.score === 'number' ? `${statusResult.score} / 100` : 'Belum dinilai'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Status Publikasi</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">
                  {statusResult.isPublished ? 'Sudah Tayang di Galeri' : 'Belum Dipublikasikan'}
                </p>
              </div>
            </div>

            {statusResult.revisionNote && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-700 mb-1">
                  Catatan Revisi / Masukan Guru
                </p>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {statusResult.revisionNote}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
            <FileWarning className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="font-display text-base font-semibold text-slate-900">
              Kode pelacakan tidak ditemukan
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Pastikan kode yang dimasukkan sesuai dengan bukti pengiriman tugas (huruf kapital &amp; angka).
            </p>
          </div>
        )
      )}

      {/* Logged-in Student History */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              Riwayat Tugas Akun Saya
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Masuk dengan akun Google sekolah untuk melihat seluruh riwayat tugas yang Anda kirim.
            </p>
          </div>
          {!userProfile && (
            <button
              type="button"
              onClick={onSignIn}
              className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 cursor-pointer whitespace-nowrap"
            >
              Masuk Akun Siswa
            </button>
          )}
        </div>

        {userProfile ? (
          mySubmissions.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">
              Belum ada tugas yang dikirim menggunakan akun {userProfile.email}.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {mySubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-slate-500">
                      {sub.trackingCode} <span aria-hidden="true">·</span> {sub.category}{' '}
                      <span aria-hidden="true">·</span> {formatIndonesianDate(sub.submittedAt)}
                    </p>
                    <p className="font-semibold text-sm text-slate-900 truncate mt-0.5">
                      {sub.title}
                    </p>
                    {sub.revisionNote && (
                      <p className="text-xs text-slate-600 mt-1">
                        Catatan: {sub.revisionNote}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="font-mono text-xs font-semibold text-slate-700 tabular-nums">
                      {typeof sub.score === 'number' ? `Nilai: ${sub.score}` : 'Belum dinilai'}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-xs font-bold ${STATUS_STYLE[sub.status] || 'text-slate-700'}`}>
                      {sub.status === 'Selesai' || sub.status === 'Diterima' ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : sub.status === 'Menunggu' ? (
                        <Clock className="w-3.5 h-3.5" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      {sub.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : null}
      </section>
    </div>
  );
};
